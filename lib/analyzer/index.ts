// Repository Static Analyzer
// Builds a complete RepositoryGraph from a local clone using ts-morph and file system traversal.
// NO AI is used here — all analysis is deterministic.

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind } from 'ts-morph';
import type {
  RepositoryGraph,
  FolderNode,
  FileNode,
  DependencyEdge,
  ComponentNode,
  APIRouteNode,
  EnvVarNode,
  DatabaseSchema,
} from '../types/index';
import { detectDbSchema } from './db-detector';
import { detectFrameworks } from './framework-detector';
import { computeComplexity } from './complexity';

export interface AnalysisResult {
  graph: RepositoryGraph;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  packageManager: string | null;
  hasTests: boolean;
  hasDocker: boolean;
  hasCI: boolean;
  totalFiles: number;
  totalLines: number;
}

export async function analyzeRepository(clonePath: string): Promise<AnalysisResult> {
  const allFiles = await glob('**/*', {
    cwd: clonePath,
    nodir: false,
    ignore: [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      '.turbo/**',
      'coverage/**',
      '*.min.js',
      '*.min.css',
    ],
  });

  const fileNodes: FileNode[] = [];
  const folderSet = new Set<string>();
  let totalLines = 0;
  const languageCount: Record<string, number> = {};

  // Pass 1: collect all file metadata
  for (const relPath of allFiles) {
    const absPath = path.join(clonePath, relPath);
    const stat = fs.statSync(absPath);

    if (stat.isDirectory()) {
      folderSet.add(relPath);
      continue;
    }

    const ext = path.extname(relPath).toLowerCase().replace('.', '');
    const lang = extensionToLanguage(ext);
    const lines = countLines(absPath);

    totalLines += lines;
    languageCount[lang] = (languageCount[lang] ?? 0) + lines;

    fileNodes.push({
      path: relPath,
      name: path.basename(relPath),
      extension: ext,
      language: lang,
      sizeBytes: stat.size,
      lines,
      purpose: inferFilePurpose(relPath),
      exports: [],       // populated in pass 2
      imports: [],       // populated in pass 2
      isEntryPoint: isEntryPoint(relPath),
      isConfig: isConfigFile(relPath),
      isTested: false,   // populated in pass 3
      complexity: 1,     // populated in pass 2
      tags: inferFileTags(relPath),
    });
  }

  // Pass 2: deep TypeScript/JavaScript analysis via ts-morph
  const tsFiles = fileNodes
    .filter((f) => ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(f.extension))
    .map((f) => path.join(clonePath, f.path));

  const tsProject = new Project({ skipAddingFilesFromTsConfig: true });
  tsProject.addSourceFilesAtPaths(tsFiles);

  const edges: DependencyEdge[] = [];
  const componentNodes: ComponentNode[] = [];
  const apiRouteNodes: APIRouteNode[] = [];
  const importGraph: Record<string, string[]> = {};

  for (const sourceFile of tsProject.getSourceFiles()) {
    const relPath = path.relative(clonePath, sourceFile.getFilePath());
    const fileNode = fileNodes.find((f) => f.path === relPath);
    if (!fileNode) continue;

    // Extract imports
    const imports: string[] = [];
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const specifier = importDecl.getModuleSpecifierValue();
      imports.push(specifier);
      edges.push({
        from: relPath,
        to: specifier,
        type: 'import',
      });
    }
    fileNode.imports = imports;
    importGraph[relPath] = imports;

    // Extract exports
    const namedExports: string[] = [];
    for (const exportDecl of sourceFile.getExportedDeclarations()) {
      namedExports.push(exportDecl[0]);
    }
    fileNode.exports = namedExports;

    // Detect React components
    const isReactFile = imports.some((i) => i === 'react' || i === 'react-dom');
    const hasTsx = relPath.endsWith('.tsx') || relPath.endsWith('.jsx');
    if (isReactFile || hasTsx) {
      const component = extractComponentInfo(sourceFile, relPath, clonePath);
      if (component) componentNodes.push(component);
    }

    // Detect Next.js API routes
    if (isApiRoute(relPath)) {
      apiRouteNodes.push(extractApiRoute(sourceFile, relPath));
    }

    // Estimate complexity
    const fnCount = sourceFile.getFunctions().length;
    const classCount = sourceFile.getClasses().length;
    const ifCount = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement).length;
    fileNode.complexity = Math.min(10, Math.ceil((fnCount + classCount * 2 + ifCount * 0.5) / 3) + 1);
  }

  // Pass 3: mark tested files
  const testFiles = new Set(
    fileNodes
      .filter((f) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f.name))
      .map((f) => f.path.replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '')),
  );
  for (const f of fileNodes) {
    const withoutExt = f.path.replace(/\.(ts|tsx|js|jsx)$/, '');
    f.isTested = testFiles.has(withoutExt);
  }

  // Build folder nodes
  const folderNodes: FolderNode[] = [];
  for (const folderPath of folderSet) {
    if (!folderPath) continue;
    const children = [...folderSet].filter(
      (p) => path.dirname(p) === folderPath,
    );
    const filesInFolder = fileNodes.filter(
      (f) => path.dirname(f.path) === folderPath,
    ).length;

    folderNodes.push({
      path: folderPath,
      name: path.basename(folderPath),
      purpose: inferFolderPurpose(folderPath),
      fileCount: filesInFolder,
      children,
    });
  }

  // Extract environment variables
  const envVars = extractEnvVars(clonePath, fileNodes);

  // Detect database schema
  let dbSchema: DatabaseSchema | null = null;
  try {
    dbSchema = await detectDbSchema(clonePath, fileNodes);
  } catch {
    // Non-fatal: some repos have no DB
  }

  // Detect frameworks & package manager
  const { frameworks, packageManager } = detectFrameworks(clonePath);
  const detectedLanguages = Object.entries(languageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang)
    .filter((l) => l !== 'unknown');

  const conceptTags = deriveConceptTags(fileNodes, componentNodes, apiRouteNodes, dbSchema, frameworks);
  const architectureType = inferArchitectureType(clonePath, folderNodes, frameworks);
  const overallComplexity = computeComplexity(fileNodes, edges, componentNodes);

  const graph: RepositoryGraph = {
    folders: folderNodes,
    files: fileNodes,
    dependencies: edges,
    components: componentNodes,
    apiRoutes: apiRouteNodes,
    dbSchema,
    envVars,
    importGraph,
    conceptTags,
    architectureType,
    complexity: overallComplexity,
  };

  return {
    graph,
    detectedLanguages,
    detectedFrameworks: frameworks,
    packageManager,
    hasTests: fileNodes.some((f) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f.name)),
    hasDocker: fs.existsSync(path.join(clonePath, 'Dockerfile')) ||
               fs.existsSync(path.join(clonePath, 'docker-compose.yml')),
    hasCI: fs.existsSync(path.join(clonePath, '.github/workflows')) ||
           fs.existsSync(path.join(clonePath, '.circleci')),
    totalFiles: fileNodes.length,
    totalLines,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function extensionToLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript',
    js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
    py: 'Python',
    rs: 'Rust',
    go: 'Go',
    java: 'Java',
    kt: 'Kotlin',
    swift: 'Swift',
    rb: 'Ruby',
    php: 'PHP',
    cs: 'C#',
    cpp: 'C++', cc: 'C++', cxx: 'C++',
    c: 'C', h: 'C',
    html: 'HTML', htm: 'HTML',
    css: 'CSS', scss: 'SCSS', sass: 'Sass', less: 'Less',
    json: 'JSON', jsonc: 'JSON',
    yaml: 'YAML', yml: 'YAML',
    md: 'Markdown', mdx: 'MDX',
    sql: 'SQL',
    sh: 'Shell', bash: 'Shell',
    prisma: 'Prisma',
    graphql: 'GraphQL', gql: 'GraphQL',
  };
  return map[ext] ?? 'unknown';
}

function inferFilePurpose(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (/\/api\//i.test(lower)) return 'api-route';
  if (/\/components?\//i.test(lower)) return 'component';
  if (/\/pages?\//i.test(lower) || /\/app\//i.test(lower)) {
    if (lower.endsWith('page.tsx') || lower.endsWith('page.ts')) return 'page';
    if (lower.endsWith('layout.tsx')) return 'layout';
    if (lower.endsWith('loading.tsx')) return 'loading';
    if (lower.endsWith('error.tsx')) return 'error';
    if (lower.endsWith('middleware.ts')) return 'middleware';
  }
  if (/\/hooks?\//i.test(lower) || /^use[A-Z]/.test(path.basename(lower))) return 'hook';
  if (/\/lib\//i.test(lower) || /\/utils?\//i.test(lower) || /\/helpers?\//i.test(lower)) return 'utility';
  if (/\/types?\//i.test(lower) || lower.endsWith('.d.ts')) return 'types';
  if (/\/store\//i.test(lower) || /\/state\//i.test(lower)) return 'state';
  if (/\/services?\//i.test(lower)) return 'service';
  if (/\/middleware/i.test(lower)) return 'middleware';
  if (isConfigFile(filePath)) return 'config';
  if (lower.endsWith('prisma')) return 'database';
  if (/\.(test|spec)\./i.test(lower)) return 'test';
  return 'module';
}

function inferFileTags(filePath: string): string[] {
  const tags: string[] = [];
  const lower = filePath.toLowerCase();
  if (lower.includes('server')) tags.push('server');
  if (lower.includes('client')) tags.push('client');
  if (lower.endsWith('.tsx') || lower.endsWith('.jsx')) tags.push('react');
  if (lower.includes('layout')) tags.push('layout');
  if (lower.includes('middleware')) tags.push('middleware');
  if (/auth/i.test(lower)) tags.push('auth');
  if (/db|database|prisma|drizzle/i.test(lower)) tags.push('database');
  if (/webhook/i.test(lower)) tags.push('webhook');
  if (/socket|ws\./i.test(lower)) tags.push('websocket');
  return tags;
}

function isEntryPoint(filePath: string): boolean {
  const name = path.basename(filePath).toLowerCase();
  return ['index.ts', 'index.tsx', 'index.js', 'main.ts', 'main.tsx',
          'server.ts', 'app.ts', 'app.tsx'].includes(name);
}

function isConfigFile(filePath: string): boolean {
  const name = path.basename(filePath).toLowerCase();
  return [
    'package.json', 'tsconfig.json', 'next.config.mjs', 'next.config.js',
    'tailwind.config.ts', 'tailwind.config.js', '.env', '.env.local',
    'docker-compose.yml', 'dockerfile', 'vitest.config.ts', 'eslint.config.js',
    '.eslintrc.json', '.prettierrc', 'prisma.schema',
  ].some((c) => name === c || name.startsWith(c));
}

function isApiRoute(filePath: string): boolean {
  return /app\/api\/.+\/route\.(ts|js)/.test(filePath) ||
         /pages\/api\/.+\.(ts|js)/.test(filePath);
}

function extractComponentInfo(
  sourceFile: ReturnType<Project['getSourceFiles']>[0],
  relPath: string,
  _clonePath: string,
): ComponentNode | null {
  const name = path.basename(relPath, path.extname(relPath));
  if (!/^[A-Z]/.test(name)) return null; // React components are PascalCase

  const imports = sourceFile.getImportDeclarations().map((i) => i.getModuleSpecifierValue());
  const isClient = sourceFile.getFullText().includes('"use client"') ||
                   sourceFile.getFullText().includes("'use client'");

  return {
    name,
    filePath: relPath,
    type: isClient ? 'client' : 'server',
    props: [],
    childComponents: [],
    parentComponents: [],
    usesHooks: imports.filter((i) => i.includes('/hooks/') || /^use[A-Z]/.test(path.basename(i))),
    usesContext: imports.filter((i) => i.includes('/context/') || i.includes('Context')),
    isLayout: name.toLowerCase().includes('layout'),
    isPage: name.toLowerCase().includes('page'),
  };
}

function extractApiRoute(
  sourceFile: ReturnType<Project['getSourceFiles']>[0],
  relPath: string,
): APIRouteNode {
  const urlPath = relPath
    .replace(/^app/, '')
    .replace(/route\.(ts|js)$/, '')
    .replace(/\/$/, '');

  const text = sourceFile.getFullText();
  const methods: string[] = [];
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    if (new RegExp(`export (?:async )?function ${method}`).test(text)) {
      methods.push(method);
    }
  }

  const isProtected =
    text.includes('getServerSession') ||
    text.includes('auth()') ||
    text.includes('requireAuth') ||
    text.includes('verifyToken');

  return {
    path: urlPath || '/',
    filePath: relPath,
    methods,
    isProtected,
    middleware: [],
  };
}

function extractEnvVars(clonePath: string, fileNodes: FileNode[]): EnvVarNode[] {
  const envMap: Map<string, EnvVarNode> = new Map();
  const secretPattern = /KEY|SECRET|TOKEN|PASSWORD|PASS|PRIVATE|CREDENTIAL|CERT/i;

  // Read .env.example or .env.local for declared vars
  for (const envFile of ['.env.example', '.env', '.env.local']) {
    const envPath = path.join(clonePath, envFile);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9_]+)(?:=(.*))?$/);
      if (!match || !match[1]) continue;
      const name = match[1];
      envMap.set(name, {
        name,
        isSecret: secretPattern.test(name),
        usedIn: [],
        hasDefault: (match[2]?.trim().length ?? 0) > 0,
      });
    }
  }

  // Scan source files for process.env usage
  const processEnvPattern = /process\.env\.([A-Z0-9_]+)/g;
  for (const fileNode of fileNodes) {
    if (!['ts', 'tsx', 'js', 'jsx'].includes(fileNode.extension)) continue;
    try {
      const content = fs.readFileSync(path.join(clonePath, fileNode.path), 'utf-8');
      let match;
      while ((match = processEnvPattern.exec(content)) !== null) {
        const name = match[1];
        if (!name) continue;
        if (!envMap.has(name)) {
          envMap.set(name, {
            name,
            isSecret: secretPattern.test(name),
            usedIn: [],
            hasDefault: false,
          });
        }
        const node = envMap.get(name)!;
        if (!node.usedIn.includes(fileNode.path)) {
          node.usedIn.push(fileNode.path);
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  return [...envMap.values()];
}

function inferFolderPurpose(folderPath: string): string {
  const name = path.basename(folderPath).toLowerCase();
  const purposeMap: Record<string, string> = {
    components: 'UI components',
    pages: 'Next.js pages',
    app: 'Next.js App Router',
    api: 'API routes',
    lib: 'Shared utilities',
    utils: 'Utility functions',
    hooks: 'React hooks',
    context: 'React context providers',
    store: 'State management',
    types: 'TypeScript types',
    prisma: 'Database schema',
    workers: 'Background workers',
    public: 'Static assets',
    styles: 'CSS/styling',
    tests: 'Test files',
    __tests__: 'Test files',
    middleware: 'Middleware',
    services: 'Business logic services',
    config: 'Configuration',
    scripts: 'Build/automation scripts',
  };
  return purposeMap[name] ?? 'Module';
}

function deriveConceptTags(
  files: FileNode[],
  components: ComponentNode[],
  apiRoutes: APIRouteNode[],
  dbSchema: DatabaseSchema | null,
  frameworks: string[],
): string[] {
  const tags = new Set<string>();

  const allImports = files.flatMap((f) => f.imports);
  const allContent = files.map((f) => f.tags).flat();

  if (frameworks.includes('Next.js')) tags.add('nextjs');
  if (frameworks.includes('React')) tags.add('react');
  if (frameworks.includes('Tailwind CSS')) tags.add('tailwind');

  if (components.some((c) => c.type === 'server')) tags.add('react-server-components');
  if (components.some((c) => c.type === 'client')) tags.add('react-client-components');
  if (components.some((c) => c.usesContext.length > 0)) tags.add('react-context');
  if (components.some((c) => c.usesHooks.length > 0)) tags.add('react-hooks');

  if (apiRoutes.length > 0) tags.add('rest-api');
  if (apiRoutes.some((r) => r.isProtected)) tags.add('api-authentication');

  if (allImports.some((i) => i.includes('prisma'))) tags.add('prisma-orm');
  if (allImports.some((i) => i.includes('drizzle'))) tags.add('drizzle-orm');
  if (dbSchema) tags.add('database');

  if (allImports.some((i) => i.includes('next-auth') || i.includes('@auth'))) tags.add('nextauth');
  if (allImports.some((i) => i.includes('zod'))) tags.add('zod-validation');
  if (allImports.some((i) => i.includes('stripe'))) tags.add('stripe-payments');
  if (allImports.some((i) => i.includes('redis') || i.includes('ioredis'))) tags.add('redis');
  if (allImports.some((i) => i.includes('bullmq'))) tags.add('job-queues');
  if (allImports.some((i) => i.includes('@supabase'))) tags.add('supabase');
  if (allContent.includes('websocket')) tags.add('websockets');
  if (files.some((f) => f.path.includes('middleware'))) tags.add('middleware');

  if (files.some((f) => f.extension === 'ts' || f.extension === 'tsx')) tags.add('typescript');

  return [...tags];
}

function inferArchitectureType(
  clonePath: string,
  _folders: FolderNode[],
  frameworks: string[],
): RepositoryGraph['architectureType'] {
  if (fs.existsSync(path.join(clonePath, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(clonePath, 'turbo.json')) ||
      fs.existsSync(path.join(clonePath, 'lerna.json'))) {
    return 'monorepo';
  }
  if (fs.existsSync(path.join(clonePath, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(clonePath, 'package.json'), 'utf-8')) as { workspaces?: unknown };
      if (pkg.workspaces) return 'monorepo';
    } catch { /* ignore */ }
  }
  if (frameworks.includes('Next.js') || frameworks.includes('React')) return 'monolith';
  if (fs.existsSync(path.join(clonePath, 'docker-compose.yml'))) return 'microservices';
  if (!fs.existsSync(path.join(clonePath, 'package.json')) &&
      !fs.existsSync(path.join(clonePath, 'Cargo.toml'))) return 'library';
  return 'monolith';
}
