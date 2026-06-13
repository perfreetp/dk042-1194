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
}

export interface StatusHistory {
  id: string;
  requirementId: string;
  fromStatus: RequirementStatus;
  toStatus: RequirementStatus;
  reason?: string;
  changedAt: string;
  operatorId: string;
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
}

export interface Announcement {
  id: string;
  versionId: string;
  title: string;
  content: string;
  publishedAt: string;
}

export interface FilterOptions {
  status?: RequirementStatus[];
  module?: ModuleType[];
  region?: string[];
  priority?: Priority[];
  assigneeId?: string[];
  search?: string;
  dateRange?: [string, string];
}
