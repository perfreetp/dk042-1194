import type { RequirementStatus, ModuleType, Priority, BusinessValue, ImpactScope, ReviewConclusion, VersionStatus } from '@/types';

export const STATUS_LABELS: Record<RequirementStatus, string> = {
  draft: '草稿',
  pending: '待处理',
  reviewing: '评审中',
  approved: '已通过',
  scheduled: '已排期',
  developing: '开发中',
  testing: '测试中',
  released: '已上线',
  rejected: '已拒绝',
  deferred: '已暂缓',
};

export const STATUS_COLORS: Record<RequirementStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  developing: 'bg-amber-50 text-amber-700 border-amber-200',
  testing: 'bg-purple-50 text-purple-700 border-purple-200',
  released: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  deferred: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const MODULE_LABELS: Record<ModuleType, string> = {
  pos: '收银',
  inventory: '库存',
  member: '会员',
  report: '报表',
  other: '其他',
};

export const MODULE_COLORS: Record<ModuleType, string> = {
  pos: 'bg-blue-100 text-blue-700',
  inventory: 'bg-green-100 text-green-700',
  member: 'bg-purple-100 text-purple-700',
  report: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-700',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700',
};

export const BUSINESS_VALUE_LABELS: Record<BusinessValue, string> = {
  high: '高价值',
  medium: '中价值',
  low: '低价值',
};

export const BUSINESS_VALUE_COLORS: Record<BusinessValue, string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-700',
};

export const IMPACT_SCOPE_LABELS: Record<ImpactScope, string> = {
  single: '单店',
  regional: '区域',
  chainwide: '全连锁',
};

export const REVIEW_CONCLUSION_LABELS: Record<ReviewConclusion, string> = {
  approved: '通过',
  rejected: '退回',
  deferred: '暂缓',
};

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  planning: '规划中',
  developing: '开发中',
  testing: '测试中',
  released: '已发布',
};

export const VERSION_STATUS_COLORS: Record<VersionStatus, string> = {
  planning: 'bg-gray-100 text-gray-700',
  developing: 'bg-blue-100 text-blue-700',
  testing: 'bg-amber-100 text-amber-700',
  released: 'bg-green-100 text-green-700',
};

export const REGIONS = ['华东区', '华南区', '华北区', '华中区', '西南区', '西北区', '东北区'];

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
