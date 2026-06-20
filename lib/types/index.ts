// Core domain types for Gitpath
// These mirror the Prisma schema but are used in application logic

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type QuizType = 'MULTIPLE_CHOICE' | 'CODE_COMPLETION' | 'DEBUGGING' | 'ARCHITECTURE' | 'FREE_RESPONSE';
export type GenerationStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type CloneStatus = 'PENDING' | 'CLONING' | 'CLONED' | 'FAILED';
export type AnalysisStatus = 'PENDING' | 'ANALYZING' | 'ANALYZED' | 'FAILED';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type AIJobType = 'GENERATE_COURSE' | 'GENERATE_LESSON' | 'GENERATE_PREREQUISITES' | 'GENERATE_QUIZ';

// ─── Repository Graph Types ───────────────────────────────────────────────────

export interface FolderNode {
  path: string;
  name: string;
  purpose: string;  // inferred purpose: "components", "api", "utils", etc.
  fileCount: number;
  children: string[]; // child folder paths
}

export interface FileNode {
  path: string;
  name: string;
  extension: string;
  language: string;
  sizeBytes: number;
  lines: number;
  purpose: string;         // inferred: "component", "api-route", "config", etc.
  exports: string[];       // exported symbols
  imports: string[];       // imported modules
  isEntryPoint: boolean;
  isConfig: boolean;
  isTested: boolean;       // has corresponding test file
  complexity: number;      // cyclomatic complexity estimate 1-10
  tags: string[];          // ["server-component", "async", "uses-db", ...]
}

export interface DependencyEdge {
  from: string;  // file path
  to: string;    // file path or package name
  type: 'import' | 'dynamic-import' | 'require' | 're-export';
}

export interface ComponentNode {
  name: string;
  filePath: string;
  type: 'server' | 'client' | 'shared';
  props: PropDefinition[];
  childComponents: string[];
  parentComponents: string[];
  usesHooks: string[];
  usesContext: string[];
  isLayout: boolean;
  isPage: boolean;
}

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
}

export interface APIRouteNode {
  path: string;           // URL path: "/api/users/[id]"
  filePath: string;       // file path in repo
  methods: string[];      // ["GET", "POST"]
  isProtected: boolean;
  middleware: string[];
  requestSchema?: string;
  responseSchema?: string;
}

export interface EnvVarNode {
  name: string;
  isSecret: boolean;      // heuristic: contains KEY, SECRET, TOKEN, PASSWORD
  usedIn: string[];       // file paths where it's referenced
  hasDefault: boolean;
}

export interface RepositoryGraph {
  folders: FolderNode[];
  files: FileNode[];
  dependencies: DependencyEdge[];
  components: ComponentNode[];
  apiRoutes: APIRouteNode[];
  dbSchema: DatabaseSchema | null;
  envVars: EnvVarNode[];
  importGraph: Record<string, string[]>;
  conceptTags: string[];
  architectureType: 'monolith' | 'monorepo' | 'microservices' | 'library' | 'unknown';
  complexity: number;     // overall repo complexity 1-10
}

export interface DatabaseSchema {
  orm: 'prisma' | 'drizzle' | 'typeorm' | 'sequelize' | 'mongoose' | 'raw';
  tables: TableDefinition[];
  relationships: TableRelationship[];
}

export interface TableDefinition {
  name: string;
  fields: FieldDefinition[];
}

export interface FieldDefinition {
  name: string;
  type: string;
  isRequired: boolean;
  isId: boolean;
  isUnique: boolean;
}

export interface TableRelationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

// ─── AI Generation Types ──────────────────────────────────────────────────────

export interface CourseGenerationInput {
  repositoryId: string;
  graph: RepositoryGraph;
  repoMetadata: {
    owner: string;
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
  };
}

export interface GeneratedCourse {
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours: number;
  prerequisites: string[];     // concept slugs
  learningGoals: string[];
  tags: string[];
  modules: GeneratedModule[];
}

export interface GeneratedModule {
  order: number;
  title: string;
  description: string;
  conceptSlug: string;
  prerequisites: string[];
  lessons: GeneratedLesson[];
}

export interface GeneratedLesson {
  order: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  explanation: string;
  codeSnippets: CodeSnippet[];
  flowDiagram: string | null;  // Mermaid syntax
  realWorldAnalogy: string;
  summary: string;
  practiceTask: string;
  keyTakeaways: string[];
  architecturalDecisions: ArchitecturalDecision[];
  bestPractices: string[];
  commonMistakes: string[];
  relatedFiles: string[];
  conceptsCovered: string[];
  xpReward: number;
  quizzes: GeneratedQuiz[];
}

export interface CodeSnippet {
  filename: string;
  language: string;
  code: string;
  highlight?: number[];   // line numbers to highlight
  explanation: string;
}

export interface ArchitecturalDecision {
  decision: string;
  rationale: string;
  alternatives: string[];
  tradeoffs: string[];
}

export interface GeneratedQuiz {
  type: QuizType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  codeContext?: string;
  difficulty: Difficulty;
  xpReward: number;
}

// ─── Queue Job Payloads ───────────────────────────────────────────────────────

export interface CloneJobPayload {
  repositoryId: string;
  githubUrl: string;
  userId: string;
}

export interface AnalysisJobPayload {
  repositoryId: string;
  clonePath: string;
}

export interface CourseGenerationJobPayload {
  repositoryId: string;
  aiJobId: string;
  priority: number;
}

export interface LessonGenerationJobPayload {
  lessonId: string;
  moduleId: string;
  courseId: string;
  repositoryId: string;
  aiJobId: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface UserDashboard {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    xp: number;
    level: number;
    streak: number;
  };
  enrollments: EnrollmentSummary[];
  recentActivity: ActivityItem[];
  badges: BadgeSummary[];
  skillGraph: SkillNode[];
  stats: UserStats;
}

export interface EnrollmentSummary {
  courseId: string;
  courseTitle: string;
  repositoryFullName: string;
  progressPct: number;
  lastAccessAt: Date | null;
  nextLesson: {
    id: string;
    title: string;
    moduleTitle: string;
  } | null;
}

export interface ActivityItem {
  type: 'lesson_completed' | 'quiz_passed' | 'badge_earned' | 'repo_enrolled';
  title: string;
  xpEarned: number;
  timestamp: Date;
}

export interface BadgeSummary {
  slug: string;
  name: string;
  icon: string;
  description: string;
  awardedAt: Date;
}

export interface SkillNode {
  conceptSlug: string;
  conceptName: string;
  category: string;
  level: number;  // 0-3
}

export interface UserStats {
  totalLessonsCompleted: number;
  totalXP: number;
  totalReposLearned: number;
  avgQuizScore: number;
  currentStreak: number;
  longestStreak: number;
}

// ─── Tutor Types ──────────────────────────────────────────────────────────────

export interface TutorContext {
  repositoryGraph: RepositoryGraph;
  currentLesson: {
    title: string;
    relatedFiles: string[];
    conceptsCovered: string[];
  } | null;
  conversationHistory: TutorMessageItem[];
}

export interface TutorMessageItem {
  role: 'user' | 'assistant';
  content: string;
  citations?: FileReference[];
}

export interface FileReference {
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  excerpt?: string;
}
