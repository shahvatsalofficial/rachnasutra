export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Confidence = 'high' | 'medium' | 'low';
/** confirmed = deterministic pattern or measurement; review-required = heuristic, needs human/runtime check. */
export type FindingStatus = 'confirmed' | 'review-required';
export type Category =
  | 'accessibility'
  | 'responsive'
  | 'visual'
  | 'performance'
  | 'design-system'
  | 'content'
  | 'motion'
  | 'usability'
  | 'trust';

export interface Evidence {
  path: string;
  line?: number;
  /** Redacted excerpt; never contains secret values. */
  excerpt?: string;
}

export interface Finding {
  id: string;
  rule: string;
  category: Category;
  title: string;
  severity: Severity;
  confidence: Confidence;
  status: FindingStatus;
  platform: 'web';
  file: string;
  line?: number;
  evidence: Evidence[];
  criterion?: string;
  user_impact: string;
  recommended_fix: string;
  verification: string;
  limitations: string;
  /** Hash of rule, file and evidence text; survives line-number shifts. Used by `verify --report`. */
  fingerprint: string;
}

export interface SourceFile {
  rel: string;
  abs: string;
  size: number;
  ext: string;
}

export interface Asset {
  rel: string;
  size: number;
}

export interface Corpus {
  root: string;
  files: SourceFile[];
  assets: Asset[];
  skipped: { ignoredDirs: number; tooLarge: number; binary: number; symlinks: number; overBudget: number; excluded: number };
  truncated: boolean;
}

export type CoverageState = 'evaluated' | 'partial' | 'not-run' | 'not-applicable';

export interface CoverageEntry {
  category: string;
  state: CoverageState;
  detail: string;
  checks: number;
}

export interface TokenInventory {
  cssVariables: number;
  colors: { value: string; count: number }[];
  fontSizes: { value: string; count: number }[];
  spacing: { value: string; count: number }[];
  radii: { value: string; count: number }[];
  hardcodedColorRatio: number;
}

export interface AuditConfig {
  exclude: string[];
  disableRules: string[];
  failOn?: Severity;
  maxFiles?: number;
  imageBudgetKb?: number;
}

export interface AuditResult {
  schemaVersion: '1.0.0';
  tool: { name: 'rachnasutra'; version: string };
  generatedAt: string;
  root: string;
  mode: 'static';
  filesScanned: number;
  fileTypes: Record<string, number>;
  skipped: Corpus['skipped'];
  truncated: boolean;
  findings: Finding[];
  coverage: CoverageEntry[];
  tokens: TokenInventory;
  limitations: string[];
}
