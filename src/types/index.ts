export type RequirementStatus =
  | 'draft'
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'scheduled'
  | 'developing'
  | 'testing'
  | 'released'
  | 'rejected'
  | 'deferred';

export type ModuleType = 'pos' | 'inventory' | 'member' | 'report' | 'other';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type BusinessValue = 'high' | 'medium' | 'low';

export type ImpactScope = 'single' | 'regional' | 'chainwide';

export type ReviewConclusion = 'approved' | 'rejected' | 'deferred';

export type VersionStatus = 'planning' | 'developing' | 'testing' | 'released';

export interface Store {
  id: string;
  name: string;
  region: string;
  city: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  storeId?: string;
}

export interface Requirement {
  id: string;
  title: string;
  module: ModuleType;
  description: string;
  screenshots: string[];
  impactScope: ImpactScope;
  expectedDate: string;
  priority: Priority;
  businessValue: BusinessValue;
  status: RequirementStatus;
  storeId: string;
  submitterId: string;
  assigneeId?: string;
  versionId?: string;
  reviewTime?: string;
  statusHistory: StatusHistory[];
  mergedFromIds?: string[];
  isHidden?: boolean;
  batchOperationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  requirementId: string;
  conclusion: ReviewConclusion;
  comment: string;
  returnReason?: string;
  materialsNeeded?: string[];
  reviewedAt: string;
  reviewerId: string;
  batchOperationId?: string;
}

export interface StatusHistory {
  id: string;
  requirementId: string;
  fromStatus: RequirementStatus;
  toStatus: RequirementStatus;
  reason?: string;
  changedAt: string;
  operatorId: string;
  batchOperationId?: string;
}

export interface Version {
  id: string;
  name: string;
  status: VersionStatus;
  startDate: string;
  releaseDate: string;
  description: string;
  delayReason?: string;
  originalReleaseDate?: string;
  capacity?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  mitigationPlan?: string;
}

export interface Announcement {
  id: string;
  versionId: string;
  title: string;
  content: string;
  publishedAt: string;
}

export interface FilterOptions {
  status?: RequirementStatus[] | RequirementStatus;
  module?: ModuleType[] | ModuleType;
  region?: string[] | string;
  priority?: Priority[] | Priority;
  assigneeId?: string[] | string;
  search?: string;
  dateRange?: [string, string];
  period?: '7d' | '30d' | '90d' | 'all';
}

export type GroupByType = 'module' | 'region' | 'titleSimilarity';

export interface ReviewGroup {
  id: string;
  name: string;
  type: GroupByType;
  requirementIds: string[];
  assigneeId?: string;
  priority?: Priority;
  reviewComment?: string;
  status?: RequirementStatus;
}

export interface BatchOperation {
  id: string;
  type: 'batchReview' | 'batchMerge';
  operatorId: string;
  createdAt: string;
  totalCount: number;
  groupCount: number;
  requirementIds: string[];
  summary: string;
}

export interface CapacityPreview {
  versionId: string;
  currentWorkload: number;
  addedWorkload: number;
  newWorkload: number;
  capacity: number;
  utilizationPercent: number;
  isOverloaded: boolean;
  isNearCapacity: boolean;
  p0Count: number;
  p1Count: number;
  newP0Count: number;
  newP1Count: number;
  riskLevel: 'low' | 'medium' | 'high';
  newRiskLevel: 'low' | 'medium' | 'high';
  estimatedDelayDays: number;
  addedRequirements: string[];
}
