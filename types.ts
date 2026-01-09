
export interface ManagementConstraints {
  deadlineFixed: boolean;
  maxBudgetIncreasePercent: number;
}

export interface EVMMetrics {
  pv: number; // Planned Value
  ev: number; // Earned Value
  ac: number; // Actual Cost
  bac: number; // Budget at Completion
  totalDurationDays: number; // Original Planned Duration
  elapsedDays: number; // Time elapsed
}

export interface EVMResults {
  sv: number;
  spi: number;
  cv: number;
  cpi: number;
  eac: number;
  etc: number;
  vac: number;
  tcpi: number;
  estimatedCompletionDays: number;
  scheduleVarianceDays: number;
}

export interface AnalysisResponse {
  executiveSummary: string;
  varianceAnalysis: string;
  riskIdentification: string[];
  recommendations: string[];
  pmbokReference: string;
  feasibilityScore: number; // 0-100
  managementVerdict: string;
}

export interface ChartDataPoint {
  day: number;
  pv: number;
  ev: number;
  ac: number;
}
