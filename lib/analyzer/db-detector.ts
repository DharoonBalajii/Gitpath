import * as fs from 'fs';
import * as path from 'path';
import type { DatabaseSchema, TableDefinition, FieldDefinition, TableRelationship } from '../types/index';
import type { FileNode } from '../types/index';

export async function detectDbSchema(
  clonePath: string,
  _fileNodes: FileNode[],
): Promise<DatabaseSchema | null> {
  // 1. Prisma schema
  const prismaPath = path.join(clonePath, 'prisma/schema.prisma');
  if (fs.existsSync(prismaPath)) {
    return parsePrismaSchema(fs.readFileSync(prismaPath, 'utf-8'));
  }

  // 2. Drizzle schema files
  const drizzleFile = findFile(clonePath, ['db/schema.ts', 'lib/db/schema.ts', 'drizzle/schema.ts']);
  if (drizzleFile) {
    return parseDrizzleSchema(fs.readFileSync(drizzleFile, 'utf-8'));
  }

  return null;
}

function findFile(clonePath: string, candidates: string[]): string | null {
  for (const candidate of candidates) {
    const full = path.join(clonePath, candidate);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function parsePrismaSchema(content: string): DatabaseSchema {
  const tables: TableDefinition[] = [];
  const relationships: TableRelationship[] = [];

  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let match;

  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1] ?? '';
    const body = match[2] ?? '';
    const fields: FieldDefinition[] = [];

    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('//') || line.startsWith('@@')) continue;
      const parts = line.split(/\s+/);
      if (!parts[0] || !parts[1]) continue;
      const fieldName = parts[0];
      const fieldType = (parts[1] ?? '').replace('?', '').replace('[]', '');
      const isRequired = !line.includes('?');
      const isId = line.includes('@id');
      const isUnique = line.includes('@unique');

      // Detect relations
      if (line.includes('@relation')) {
        const relatedModel = fieldType;
        if (line.includes('[]')) {
          relationships.push({ from: modelName, to: relatedModel, type: 'one-to-many' });
        } else {
          relationships.push({ from: modelName, to: relatedModel, type: 'one-to-one' });
        }
      }

      fields.push({ name: fieldName, type: fieldType, isRequired, isId, isUnique });
    }

    tables.push({ name: modelName, fields });
  }

  return { orm: 'prisma', tables, relationships };
}

function parseDrizzleSchema(content: string): DatabaseSchema {
  const tables: TableDefinition[] = [];
  const tableRegex = /export const (\w+) = pgTable\(['"](\w+)['"]/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    tables.push({
      name: match[2] ?? match[1] ?? '',
      fields: [],
    });
  }

  return { orm: 'drizzle', tables, relationships: [] };
}
