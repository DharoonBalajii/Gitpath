// Prompt templates for all AI generation tasks.
// Keep prompts structured with JSON output to enable reliable parsing.

import type { RepositoryGraph, GeneratedCourse } from '../types/index';

export function buildCourseOutlinePrompt(
  graph: RepositoryGraph,
  repoMeta: { owner: string; name: string; description: string | null; language: string | null },
): string {
  const summary = buildGraphSummary(graph);
  return `You are an expert software engineering educator. Your task is to design a structured learning course for the following GitHub repository.

## Repository
- **Name**: ${repoMeta.owner}/${repoMeta.name}
- **Description**: ${repoMeta.description ?? 'No description'}
- **Primary Language**: ${repoMeta.language ?? 'Unknown'}
- **Architecture**: ${graph.architectureType}
- **Complexity Score**: ${graph.complexity}/10
- **Frameworks**: ${graph.conceptTags.join(', ')}

## Repository Structure Summary
${summary}

## Task
Generate a comprehensive learning course outline. The course should teach users HOW this project was built from scratch, WHY architectural decisions were made, and WHAT concepts they need before each lesson.

Respond with ONLY valid JSON matching this schema exactly:
\`\`\`json
{
  "title": "string",
  "description": "string (2-3 sentences)",
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
  "estimatedHours": number,
  "prerequisites": ["concept-slug", ...],
  "learningGoals": ["string", ...],
  "tags": ["string", ...],
  "modules": [
    {
      "order": number,
      "title": "string",
      "description": "string",
      "conceptSlug": "string (kebab-case)",
      "prerequisites": ["concept-slug", ...],
      "lessons": [
        {
          "order": number,
          "title": "string",
          "description": "string",
          "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
          "estimatedMinutes": number,
          "relatedFiles": ["path/in/repo", ...],
          "conceptsCovered": ["concept-slug", ...]
        }
      ]
    }
  ]
}
\`\`\`

Requirements:
- Each module covers ONE distinct concept or architectural layer
- Lessons build on each other progressively
- Include prerequisite concepts a user must know before each module
- relatedFiles must be actual paths from the repository
- estimatedMinutes should be realistic (10-45 min per lesson)
- Aim for 4-8 modules with 2-5 lessons each
`;
}

export function buildLessonContentPrompt(
  lessonTitle: string,
  lessonDescription: string,
  relatedFiles: Array<{ path: string; content: string }>,
  conceptsCovered: string[],
  graph: RepositoryGraph,
): string {
  const fileSection = relatedFiles
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``)
    .join('\n\n');

  return `You are an expert software engineering educator. Generate a detailed, production-quality lesson about the following topic.

## Lesson
**Title**: ${lessonTitle}
**Description**: ${lessonDescription}
**Concepts**: ${conceptsCovered.join(', ')}

## Relevant Source Files
${fileSection}

## Architecture Context
- Architecture type: ${graph.architectureType}
- Frameworks: ${graph.conceptTags.slice(0, 10).join(', ')}
- Overall complexity: ${graph.complexity}/10

## Task
Generate the full lesson content. Respond with ONLY valid JSON:

\`\`\`json
{
  "explanation": "string (detailed markdown explanation, 300-600 words)",
  "codeSnippets": [
    {
      "filename": "string",
      "language": "string",
      "code": "string (actual code from the repo or modified example)",
      "highlight": [1, 2, 3],
      "explanation": "string"
    }
  ],
  "flowDiagram": "string (Mermaid diagram syntax) | null",
  "realWorldAnalogy": "string (1-2 paragraphs relating this concept to everyday life)",
  "summary": "string (2-3 sentence recap)",
  "practiceTask": "string (specific actionable task the learner can do)",
  "keyTakeaways": ["string", ...],
  "architecturalDecisions": [
    {
      "decision": "string",
      "rationale": "string",
      "alternatives": ["string"],
      "tradeoffs": ["string"]
    }
  ],
  "bestPractices": ["string", ...],
  "commonMistakes": ["string", ...],
  "xpReward": number (10-50 based on difficulty),
  "quizzes": [
    {
      "type": "MULTIPLE_CHOICE" | "CODE_COMPLETION" | "DEBUGGING" | "ARCHITECTURE",
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "string",
      "explanation": "string",
      "codeContext": "string | null",
      "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      "xpReward": number (5-15)
    }
  ]
}
\`\`\`

Requirements:
- explanation must reference the ACTUAL code in the repo
- codeSnippets must contain real or slightly modified code from the files above
- Include 2-4 quizzes mixing different types
- flowDiagram must be valid Mermaid syntax (graph TD or sequenceDiagram)
- realWorldAnalogy must make the concept intuitive to a beginner
- practiceTask must be specific and achievable in 15-30 minutes
`;
}

export function buildTutorSystemPrompt(
  graph: RepositoryGraph,
  repoFullName: string,
): string {
  const fileList = graph.files
    .slice(0, 50)
    .map((f) => `- ${f.path} (${f.purpose})`)
    .join('\n');

  return `You are an AI tutor for the ${repoFullName} codebase. You help learners understand this specific repository.

## Your Capabilities
- Explain how any file, function, or concept works in THIS repository
- Answer why architectural decisions were made
- Suggest alternative approaches with trade-offs
- Reference specific file paths and line numbers

## Repository Overview
- Architecture: ${graph.architectureType}
- Key concepts: ${graph.conceptTags.slice(0, 15).join(', ')}
- Complexity: ${graph.complexity}/10

## Key Files (${graph.files.length} total)
${fileList}

## Rules
1. ONLY answer questions about this specific repository
2. Always cite specific files when explaining concepts
3. If you don't know something about this repo, say so clearly
4. Never hallucinate code or features that don't exist in the repo
5. Keep responses concise and actionable
6. Use code snippets from the actual repository when relevant`;
}

function buildGraphSummary(graph: RepositoryGraph): string {
  const topFiles = graph.files
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 20)
    .map((f) => `- ${f.path} [${f.purpose}] (complexity: ${f.complexity}/10)`)
    .join('\n');

  const components = graph.components.slice(0, 10)
    .map((c) => `- ${c.name} (${c.type})`)
    .join('\n');

  const apiRoutes = graph.apiRoutes.slice(0, 10)
    .map((r) => `- ${r.methods.join('/')} ${r.path}${r.isProtected ? ' [protected]' : ''}`)
    .join('\n');

  const dbTables = graph.dbSchema?.tables
    .slice(0, 10)
    .map((t) => `- ${t.name} (${t.fields.length} fields)`)
    .join('\n') ?? 'None detected';

  return `**Top Complex Files**
${topFiles}

**React Components** (${graph.components.length} total)
${components || 'None'}

**API Routes** (${graph.apiRoutes.length} total)
${apiRoutes || 'None'}

**Database Tables**
${dbTables}

**Environment Variables**
${graph.envVars.slice(0, 10).map((e) => `- ${e.name}${e.isSecret ? ' (secret)' : ''}`).join('\n')}`;
}

export function parseJSONFromResponse(response: string): unknown {
  // Strip markdown code fences anywhere in the text
  let cleaned = response.replace(/```(?:json)?/gi, '').trim();

  // If the model added prose around the JSON, extract the outermost object/array.
  const starts = ['{', '['].map((c) => cleaned.indexOf(c)).filter((i) => i >= 0);
  const start = starts.length ? Math.min(...starts) : -1;
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (start >= 0 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Tolerate common LLM JSON slips: trailing commas before } or ]
    const repaired = cleaned.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(repaired);
  }
}
