// AI Course Generator
// Called ONLY from background workers. Never called on page requests.
// Generates course structure + lessons once, then stores them permanently.

import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db/client';
// callAI handles key rotation automatically — no need to manage the client directly
import { callAI, MAX_TOKENS } from './client';
import {
  buildCourseOutlinePrompt,
  buildLessonContentPrompt,
  parseJSONFromResponse,
} from './prompts';
import type {
  RepositoryGraph,
  GeneratedCourse,
  GeneratedLesson,
  GeneratedModule,
} from '../types/index';

export async function generateCourse(
  repositoryId: string,
  graph: RepositoryGraph,
  clonePath: string,
): Promise<void> {
  const repo = await db.repository.findUniqueOrThrow({
    where: { id: repositoryId },
  });

  // Step 1: Generate course outline (module + lesson titles, no content yet)
  // callAI() rotates through Gemini keys 1-5 on quota errors, then falls back to DeepSeek V3
  console.log(`[AI] Generating course outline for ${repo.fullName}`);
  const outlinePrompt = buildCourseOutlinePrompt(graph, {
    owner: repo.owner,
    name: repo.name,
    description: repo.description,
    language: repo.language,
  });

  const rawOutline = await callAI(
    [{ role: 'user', content: outlinePrompt }],
    { maxTokens: MAX_TOKENS.COURSE_OUTLINE, temperature: 0.3 },
  );
  const outline = parseJSONFromResponse(rawOutline) as GeneratedCourse;

  // Step 2: Persist course shell in DB
  const course = await db.course.create({
    data: {
      repositoryId,
      title: outline.title,
      description: outline.description,
      difficulty: outline.difficulty,
      estimatedHours: outline.estimatedHours,
      prerequisites: outline.prerequisites,
      learningGoals: outline.learningGoals,
      tags: outline.tags,
      language: repo.language,
      generationStatus: 'GENERATING',
      totalLessons: outline.modules.reduce((sum, m) => sum + m.lessons.length, 0),
    },
  });

  let totalXP = 0;

  // Step 3: Generate each lesson's full content sequentially
  // (parallel would flood the GPU — sequential respects the self-hosted model)
  for (const moduleData of outline.modules) {
    const module = await db.module.create({
      data: {
        courseId: course.id,
        order: moduleData.order,
        title: moduleData.title,
        description: moduleData.description,
        conceptSlug: moduleData.conceptSlug,
        prerequisites: moduleData.prerequisites,
      },
    });

    for (const lessonOutline of moduleData.lessons) {
      console.log(`[AI] Generating lesson: ${lessonOutline.title}`);

      // Fetch related file contents from the clone
      const relatedFiles = await readRelatedFiles(clonePath, lessonOutline.relatedFiles ?? []);

      const lessonPrompt = buildLessonContentPrompt(
        lessonOutline.title,
        lessonOutline.description,
        relatedFiles,
        lessonOutline.conceptsCovered ?? [],
        graph,
      );

      let lessonContent: GeneratedLesson;
      try {
        // callAI auto-rotates to the next key if this call hits a quota limit
        const rawContent = await callAI(
          [{ role: 'user', content: lessonPrompt }],
          { maxTokens: MAX_TOKENS.LESSON_CONTENT, temperature: 0.2 },
        );
        lessonContent = parseJSONFromResponse(rawContent) as GeneratedLesson;
      } catch (err) {
        console.error(`[AI] Lesson generation failed for "${lessonOutline.title}":`, err);
        // Create a placeholder lesson so course structure is preserved
        lessonContent = placeholderLesson(lessonOutline);
      }

      const lesson = await db.lesson.create({
        data: {
          moduleId: module.id,
          order: lessonOutline.order,
          title: lessonOutline.title,
          description: lessonOutline.description,
          difficulty: lessonOutline.difficulty,
          estimatedMinutes: lessonOutline.estimatedMinutes,
          explanation: lessonContent.explanation ?? '',
          codeSnippets: lessonContent.codeSnippets as any,
          flowDiagram: lessonContent.flowDiagram ?? null,
          realWorldAnalogy: lessonContent.realWorldAnalogy ?? '',
          summary: lessonContent.summary ?? '',
          practiceTask: lessonContent.practiceTask ?? '',
          keyTakeaways: lessonContent.keyTakeaways as any,
          architecturalDecisions: lessonContent.architecturalDecisions as any,
          bestPractices: lessonContent.bestPractices as any,
          commonMistakes: lessonContent.commonMistakes as any,
          relatedFiles: lessonOutline.relatedFiles as any,
          conceptsCovered: lessonOutline.conceptsCovered as any,
          xpReward: lessonContent.xpReward ?? 10,
        },
      });

      totalXP += lessonContent.xpReward ?? 10;

      // Persist quizzes — sanitise so a single malformed field from the model
      // (e.g. a missing explanation) can't fail the whole course generation.
      const validQuizzes = (lessonContent.quizzes ?? []).filter((q) => q.question && q.correctAnswer);
      if (validQuizzes.length) {
        await db.quiz.createMany({
          data: validQuizzes.map((q) => ({
            lessonId: lesson.id,
            type: q.type ?? 'MULTIPLE_CHOICE',
            question: q.question,
            options: q.options ?? [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? '',
            codeContext: q.codeContext ?? null,
            difficulty: q.difficulty ?? lessonOutline.difficulty ?? 'BEGINNER',
            xpReward: q.xpReward ?? 5,
          })),
        });
      }

      // Upsert concept mastery records
      for (const slug of lessonOutline.conceptsCovered ?? []) {
        await db.concept.upsert({
          where: { slug },
          create: {
            slug,
            name: slug.replace(/-/g, ' '),
            category: 'general',
            description: `Concept: ${slug}`,
            difficulty: lessonOutline.difficulty,
            prerequisites: [],
          },
          update: {},
        });
      }
    }
  }

  // Step 4: Mark course as complete
  await db.course.update({
    where: { id: course.id },
    data: {
      generationStatus: 'COMPLETED',
      generatedAt: new Date(),
      isPublished: true,
      publishedAt: new Date(),
      totalXP,
    },
  });

  console.log(`[AI] Course generation complete: ${course.id}`);
}

async function readRelatedFiles(
  clonePath: string,
  filePaths: string[],
): Promise<Array<{ path: string; content: string }>> {
  const result: Array<{ path: string; content: string }> = [];
  for (const filePath of filePaths.slice(0, 5)) { // max 5 files per lesson to control token usage
    try {
      const abs = path.join(clonePath, filePath);
      if (!fs.existsSync(abs)) continue;
      const content = fs.readFileSync(abs, 'utf-8');
      result.push({ path: filePath, content: content.slice(0, 4000) }); // truncate
    } catch {
      // skip unreadable files
    }
  }
  return result;
}

function placeholderLesson(outline: { title: string; description: string; difficulty: string }): GeneratedLesson {
  return {
    order: 0,
    title: outline.title,
    description: outline.description,
    difficulty: outline.difficulty as GeneratedLesson['difficulty'],
    estimatedMinutes: 15,
    explanation: `# ${outline.title}\n\n${outline.description}\n\n*Detailed content is being generated...*`,
    codeSnippets: [],
    flowDiagram: null,
    realWorldAnalogy: 'Content coming soon.',
    summary: outline.description,
    practiceTask: 'Explore the related files in the repository viewer.',
    keyTakeaways: [],
    architecturalDecisions: [],
    bestPractices: [],
    commonMistakes: [],
    relatedFiles: [],
    conceptsCovered: [],
    xpReward: 10,
    quizzes: [],
  };
}
