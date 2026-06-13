import { useMemo } from 'react';
import {
  Eye,
  Edit2,
  GitMerge,
  FileEdit,
  User,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  TrendingUp,
  Layers,
  ClipboardCheck,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { Modal } from '@/components/ui/Modal';
import { Tag } from '@/components/ui/Tag';
import { formatDateTime } from '@/utils/format';
import { BUSINESS_VALUE_LABELS, BUSINESS_VALUE_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '@/utils/constants';
import type { Requirement, TimelineEvent } from '@/types';

interface RequirementDetailProps {
  isOpen: boolean;
  onClose: () => void;
  requirementId: string | null;
  onEdit?: (req: Requirement) => void;
  onEditDraft?: (req: Requirement) => void;
}

export function RequirementDetail({ isOpen, onClose, requirementId, onEdit, onEditDraft }: RequirementDetailProps) {
  const requirements = useAppStore((state) => state.requirements);
  const getStoreById = useAppStore((state) => state.getStoreById);
  const getUserById = useAppStore((state) => state.getUserById);
  const getVersionById = useAppStore((state) => state.getVersionById);
  const getBatchOperationById = useAppStore((state) => state.getBatchOperationById);
  const getTimelineEvents = useAppStore((state) => state.getTimelineEvents);

  const requirement = useMemo(() => {
    if (!requirementId) return null;
    return requirements.find((r) => r.id === requirementId) || null;
  }, [requirementId, requirements]);

  const timelineEvents = useMemo(() => {
    if (!requirementId) return [];
    return getTimelineEvents(requirementId);
  }, [requirementId, getTimelineEvents]);

  const store = requirement ? getStoreById(requirement.storeId) : null;
  const assignee = requirement?.assigneeId ? getUserById(requirement.assigneeId) : null;
  const version = requirement?.versionId ? getVersionById(requirement.versionId) : null;
  const submitter = requirement ? getUserById(requirement.submitterId) : null;

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'create':
        return <Package className="w-4 h-4" />;
      case 'statusChange':
        return <TrendingUp className="w-4 h-4" />;
      case 'review':
        return event.reviewConclusion === 'approved' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : event.reviewConclusion === 'rejected' ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <PauseCircle className="w-4 h-4" />
        );
      case 'batchReview':
        return <ClipboardCheck className="w-4 h-4" />;
      case 'merge':
        return <GitMerge className="w-4 h-4" />;
      case 'schedule':
        return <Calendar className="w-4 h-4" />;
      case 'update':
        return <Edit2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'create':
        return 'bg-blue-500 text-white';
      case 'statusChange':
        return 'bg-indigo-500 text-white';
      case 'review':
        return event.reviewConclusion === 'approved'
          ? 'bg-emerald-500 text-white'
          : event.reviewConclusion === 'rejected'
          ? 'bg-rose-500 text-white'
          : 'bg-amber-500 text-white';
      case 'batchReview':
        return 'bg-purple-500 text-white';
      case 'merge':
        return 'bg-violet-500 text-white';
      case 'schedule':
        return 'bg-cyan-500 text-white';
      case 'update':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getEventBgColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'create':
        return 'bg-blue-50 border-blue-200';
      case 'statusChange':
        return 'bg-indigo-50 border-indigo-200';
      case 'review':
        return event.reviewConclusion === 'approved'
          ? 'bg-emerald-50 border-emerald-200'
          : event.reviewConclusion === 'rejected'
          ? 'bg-rose-50 border-rose-200'
          : 'bg-amber-50 border-amber-200';
      case 'batchReview':
        return 'bg-purple-50 border-purple-200';
      case 'merge':
        return 'bg-violet-50 border-violet-200';
      case 'schedule':
        return 'bg-cyan-50 border-cyan-200';
      case 'update':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="需求详情" size="xl">
      {requirement && (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{requirement.title}</h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={requirement.status} />
                  <ModuleTag module={requirement.module} />
                  <PriorityBadge priority={requirement.priority} />
                  <Tag colorClass={BUSINESS_VALUE_COLORS[requirement.businessValue]}>
                    {BUSINESS_VALUE_LABELS[requirement.businessValue]}
                  </Tag>
                  {requirement.mergedFromIds && requirement.mergedFromIds.length > 0 && (
                    <Tag colorClass="bg-purple-100 text-purple-700">
                      <GitMerge className="w-3.5 h-3.5 mr-1" />
                      已合并 {requirement.mergedFromIds.length} 项
                    </Tag>
                  )}
                  {version && (
                    <Tag colorClass="bg-cyan-100 text-cyan-700">
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      {version.name}
                    </Tag>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {onEditDraft && requirement.status === 'draft' && (
                  <button
                    onClick={() => onEditDraft(requirement)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    继续编辑
                  </button>
                )}
                {onEdit && requirement.status !== 'draft' && (
                  <button
                    onClick={() => onEdit(requirement)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-gray-400" />
                需求描述
              </h5>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {requirement.description || '暂无描述'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  提交门店
                </h5>
                <p className="text-sm text-gray-900 font-medium">{store?.name || '-'}</p>
                <p className="text-xs text-gray-500">{store?.region || '-'}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  提交人
                </h5>
                <p className="text-sm text-gray-900 font-medium">{submitter?.name || '-'}</p>
                <p className="text-xs text-gray-500">{submitter?.role || '-'}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  负责人
                </h5>
                <p className="text-sm text-gray-900 font-medium">{assignee?.name || '未分配'}</p>
                <p className="text-xs text-gray-500">{assignee?.role || '-'}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  期望上线
                </h5>
                <p className="text-sm text-gray-900 font-medium">{requirement.expectedDate || '未设置'}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  创建时间
                </h5>
                <p className="text-sm text-gray-900 font-medium">{formatDateTime(requirement.createdAt)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  更新时间
                </h5>
                <p className="text-sm text-gray-900 font-medium">{formatDateTime(requirement.updatedAt)}</p>
              </div>
            </div>

            {version && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-cyan-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  排期版本
                </h5>
                <div className="bg-white rounded-lg p-3 border border-cyan-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{version.name}</span>
                    <Tag colorClass="bg-cyan-100 text-cyan-700">{version.status}</Tag>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>开始时间: {version.startDate}</div>
                    <div>发布时间: {version.releaseDate}</div>
                  </div>
                </div>
              </div>
            )}

            {requirement.mergedFromIds && requirement.mergedFromIds.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-purple-900 mb-3 flex items-center gap-2">
                  <GitMerge className="w-4 h-4" />
                  合并来源 ({requirement.mergedFromIds.length} 项)
                </h5>
                <div className="space-y-2">
                  {requirement.mergedFromIds.map((mergedId) => {
                    const mergedReq = requirements.find((r) => r.id === mergedId);
                    if (!mergedReq) return null;
                    const mergedStore = getStoreById(mergedReq.storeId);
                    return (
                      <div key={mergedId} className="bg-white rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-purple-600">{mergedId.toUpperCase()}</span>
                          <StatusBadge status={mergedReq.status} size="sm" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{mergedReq.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {mergedStore?.name || '-'} · {formatDateTime(mergedReq.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h5 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              处理时间线
            </h5>

            {timelineEvents.length > 0 ? (
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                {timelineEvents.map((event, index) => {
                  const operator = event.operatorId ? getUserById(event.operatorId) : null;
                  const batchOp = event.batchOperationId ? getBatchOperationById(event.batchOperationId) : null;
                  const isLast = index === timelineEvents.length - 1;

                  return (
                    <div key={event.id} className={`relative ${isLast ? '' : 'mb-4'}`}>
                      <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center ${getEventColor(event)} shadow-sm z-10`}>
                        {getEventIcon(event)}
                      </div>

                      <div className={`rounded-lg border p-3 ${getEventBgColor(event)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{event.title}</span>
                            {event.fromStatus && event.toStatus && event.fromStatus !== event.toStatus && (
                              <span className="text-xs text-gray-500">
                                {STATUS_LABELS[event.fromStatus]} → {STATUS_LABELS[event.toStatus]}
                              </span>
                            )}
                            {event.reviewConclusion && (
                              <Tag
                                colorClass={
                                  event.reviewConclusion === 'approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : event.reviewConclusion === 'rejected'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                                }
                              >
                                {event.reviewConclusion === 'approved' ? '通过' : event.reviewConclusion === 'rejected' ? '驳回' : '暂缓'}
                              </Tag>
                            )}
                            {event.versionId && (
                              <Tag colorClass="bg-cyan-100 text-cyan-700">
                                {getVersionById(event.versionId)?.name || '版本排期'}
                              </Tag>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDateTime(event.timestamp)}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{event.description}</p>
                        )}

                        {operator && (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {operator.name}
                            <span className="text-gray-400">({operator.role})</span>
                          </p>
                        )}

                        {batchOp && (
                          <div className="mt-2 pt-2 border-t border-gray-200/50">
                            <p className="text-xs text-purple-600 flex items-center gap-1">
                              <ClipboardCheck className="w-3 h-3" />
                              批量操作: {batchOp.summary}
                              <span className="text-purple-400 ml-1">(共 {batchOp.totalCount} 项)</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">暂无处理记录</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
