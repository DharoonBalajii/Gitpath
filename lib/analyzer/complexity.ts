import type { FileNode, DependencyEdge, ComponentNode } from '../types/index';

export function computeComplexity(
  files: FileNode[],
  edges: DependencyEdge[],
  components: ComponentNode[],
): number {
  if (files.length === 0) return 1;

  const avgFileComplexity =
    files.reduce((sum, f) => sum + f.complexity, 0) / files.length;

  const edgeDensity = Math.min(edges.length / Math.max(files.length, 1) / 5, 1);
  const componentDepth = components.length > 0
    ? Math.min(components.reduce((max, c) => Math.max(max, c.childComponents.length), 0) / 10, 1)
    : 0;

  const raw = (avgFileComplexity / 10) * 0.5 + edgeDensity * 0.3 + componentDepth * 0.2;
  return Math.max(1, Math.min(10, Math.round(raw * 10)));
}
