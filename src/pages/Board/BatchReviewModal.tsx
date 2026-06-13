import { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, AlertCircle, Users, Flag, MessageSquare, Layers, MapPin, AlignLeft, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Requirement, RequirementStatus, Priority, ReviewGroup, GroupByType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { Tag } from '@/components/ui/Tag';
import { PRIORITY_LABELS, STATUS_LABELS, MODULE_LABELS } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';

interface BatchReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess?: () => void;
}

export function BatchReviewModal({ isOpen, onClose, selectedIds, onSuccess }: BatchReviewModalProps) {
  const requirements = useAppStore((state) => state.requirements);
  const users = useAppStore((state) => state.users);
  const groupRequirements = useAppStore((state) => state.groupRequirements);
  const batchReviewGrouped = useAppStore((state) => state.batchReviewGrouped);
  const batchReview = useAppStore((state) => state.batchReview);

  const [groupBy, setGroupBy] = useState<GroupByType | 'none'>('none');
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setGroupBy('none');
      setGroups([]);
      setExpandedGroupId(null);
      setError('');
    }
  }, [isOpen, selectedIds]);

  useEffect(() => {
    if (groupBy !== 'none' && selectedIds.length > 0) {
      const newGroups = groupRequirements(selectedIds, groupBy as GroupByType);
      setGroups(newGroups);
      setExpandedGroupId(newGroups[0]?.id || null);
    } else {
      setGroups([]);
    }
  }, [groupBy, selectedIds, groupRequirements]);

  const selectedRequirements = useMemo(() => {
    return requirements.filter((r) => selectedIds.includes(r.id));
  }, [requirements, selectedIds]);

  const userOptions = users.filter(u => u.role === 'product_manager' || u.role === 'admin').map(u => ({
    value: u.id,
    label: u.name,
  }));
  userOptions.unshift({ value: '', label: '不修改负责人' });

  const priorityOptions = [
    { value: '', label: '不修改优先级' },
    ...(Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))),
  ];

  const batchStatusOptions = [
    { value: '', label: '不修改状态' },
    { value: 'reviewing', label: STATUS_LABELS.reviewing },
    { value: 'approved', label: STATUS_LABELS.approved },
    { value: 'deferred', label: STATUS_LABELS.deferred },
    { value: 'rejected', label: STATUS_LABELS.rejected },
  ];

  const groupByOptions = [
    { value: 'none', label: '不分组，统一设置' },
    { value: 'module', label: '按模块分组' },
    { value: 'region', label: '按区域分组' },
    { value: 'titleSimilarity', label: '按相似标题分组' },
  ];

  const updateGroup = (groupId: string, updates: Partial<ReviewGroup>) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const hasAnyChange = useMemo(() => {
    if (groupBy === 'none') return false;
    return groups.some(g => g.assigneeId || g.priority || g.status || g.reviewComment?.trim());
  }, [groups, groupBy]);

  const handleConfirm = () => {
    if (groupBy === 'none') {
      setError('请选择分组方式或使用统一设置');
      return;
    }
    if (!hasAnyChange) {
      setError('请至少为一个分组设置评审操作：负责人、优先级、状态或评审备注');
      return;
    }
    batchReviewGrouped(groups, selectedIds);
    onSuccess?.();
    onClose();
  };

  const handleNoGroupConfirm = () => {
    const assigneeId = (document.getElementById('batch-assignee') as HTMLSelectElement)?.value || '';
    const priority = (document.getElementById('batch-priority') as HTMLSelectElement)?.value || '';
    const status = (document.getElementById('batch-status') as HTMLSelectElement)?.value || '';
    const reviewComment = (document.getElementById('batch-comment') as HTMLTextAreaElement)?.value || '';

    if (!assigneeId && !priority && !status && !reviewComment.trim()) {
      setError('请至少设置一项评审操作：负责人、优先级、状态或评审备注');
      return;
    }
    batchReview(selectedIds, {
      assigneeId: assigneeId || undefined,
      priority: priority as Priority || undefined,
      status: status as RequirementStatus || undefined,
      reviewComment: reviewComment.trim() || undefined,
    });
    onSuccess?.();
    onClose();
  };

  const getGroupIcon = (type: GroupByType) => {
    if (type === 'module') return <Layers className="w-4 h-4 text-purple-500" />;
    if (type === 'region') return <MapPin className="w-4 h-4 text-blue-500" />;
    return <AlignLeft className="w-4 h-4 text-amber-500" />;
  };

  const SummaryCard = ({ req }: { req: Requirement }) => (
    <div className="border border-gray-200 rounded-lg bg-white p-2.5">
      <div className="flex items-start gap-2">
        <span className="text-xs text-gray-400 font-mono mt-0.5 flex-shrink-0">{req.id.toUpperCase()}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium truncate">{req.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <ModuleTag module={req.module} />
            <StatusBadge status={req.status} size="sm" />
            <PriorityBadge priority={req.priority} />
          </div>
        </div>
      </div>
    </div>
  );

  const GroupCard = ({ group }: { group: ReviewGroup }) => {
    const groupReqs = requirements.filter(r => group.requirementIds.includes(r.id));
    const groupHasChange = group.assigneeId || group.priority || group.status || group.reviewComment?.trim();
    const isExpanded = expandedGroupId === group.id;

    return (
      <div className={`border rounded-lg overflow-hidden transition-all ${groupHasChange ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            {getGroupIcon(group.type)}
            <span className="font-medium text-gray-900">{group.name}</span>
            <Tag colorClass="bg-gray-100 text-gray-600">{group.requirementIds.length} 项</Tag>
            {groupHasChange && (
              <Tag colorClass="bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> 已设置
              </Tag>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 border-t border-gray-200 bg-white space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label={<span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" />负责人</span>}
                value={group.assigneeId || ''}
                onChange={(e) => updateGroup(group.id, { assigneeId: e.target.value || undefined })}
                options={userOptions}
              />
              <Select
                label={<span className="flex items-center gap-1.5"><Flag className="w-4 h-4 text-gray-400" />优先级</span>}
                value={group.priority || ''}
                onChange={(e) => updateGroup(group.id, { priority: (e.target.value as Priority) || undefined })}
                options={priorityOptions}
              />
            </div>

            <Select
              label={<span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-gray-400" />评审结论 / 状态变更</span>}
              value={group.status || ''}
              onChange={(e) => updateGroup(group.id, { status: (e.target.value as RequirementStatus) || undefined })}
              options={batchStatusOptions}
            />

            <Textarea
              label={<span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-gray-400" />评审备注</span>}
              placeholder={`为「${group.name}」分组设置评审备注...`}
              value={group.reviewComment || ''}
              onChange={(e) => updateGroup(group.id, { reviewComment: e.target.value })}
              rows={2}
            />

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs text-gray-500 font-medium mb-1">分组内需求：</p>
              {groupReqs.map(req => (
                <SummaryCard key={req.id} req={req} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#1e3a5f]" />
          <span>批量评审工作台</span>
          <Tag colorClass="bg-[#1e3a5f]/10 text-[#1e3a5f]">{selectedIds.length} 项需求</Tag>
        </div>
      }
      size="xl"
      footer={
        <div className="flex justify-between items-center gap-3">
          <div>
            {error && (
              <p className="text-sm text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>取消</Button>
            {groupBy === 'none' ? (
              <Button onClick={handleNoGroupConfirm}>
                <ClipboardCheck className="w-4 h-4" />
                执行统一批量评审
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={!hasAnyChange}>
                <ClipboardCheck className="w-4 h-4" />
                执行分组批量评审
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              选择分组方式按模块、区域或相似标题自动分组，分别设置负责人、优先级和备注。
              所有操作将生成批量处理记录，可在需求详情和评审页查看。
            </p>
          </div>

          <Select
            label={<span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-gray-400" />分组方式</span>}
            value={groupBy}
            onChange={(e) => { setGroupBy(e.target.value as GroupByType | 'none'); setError(''); }}
            options={groupByOptions}
          />

          {groupBy === 'none' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  id="batch-assignee"
                  label={<span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" />负责人</span>}
                  value=""
                  options={userOptions}
                />
                <Select
                  id="batch-priority"
                  label={<span className="flex items-center gap-1.5"><Flag className="w-4 h-4 text-gray-400" />优先级</span>}
                  value=""
                  options={priorityOptions}
                />
              </div>

              <Select
                id="batch-status"
                label={<span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-gray-400" />评审结论 / 状态变更</span>}
                value=""
                options={batchStatusOptions}
              />

              <Textarea
                id="batch-comment"
                label={<span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-gray-400" />评审备注</span>}
                placeholder="例如：这批需求涉及会员体系重构，统一由张经理跟进..."
                rows={4}
              />
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {groups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}

          {groupBy !== 'none' && hasAnyChange && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-800 mb-1.5 font-medium">即将执行以下批量操作：</p>
              <ul className="text-xs text-emerald-700 space-y-1">
                {groups.filter(g => g.assigneeId || g.priority || g.status || g.reviewComment?.trim()).map(g => (
                  <li key={g.id}>
                    • <span className="font-medium">{g.name}</span>：
                    {g.assigneeId && ` 负责人:${users.find(u => u.id === g.assigneeId)?.name}`}
                    {g.priority && ` 优先级:${PRIORITY_LABELS[g.priority]}`}
                    {g.status && ` 状态:${STATUS_LABELS[g.status]}`}
                    {g.reviewComment?.trim() && ' 含评审备注'}
                    <span className="text-emerald-500"> ({g.requirementIds.length}项)</span>
                  </li>
                ))}
                <li>• <span className="font-medium">总计：</span>{groups.filter(g => g.assigneeId || g.priority || g.status || g.reviewComment?.trim()).length} 个分组，{selectedIds.length} 项需求</li>
              </ul>
            </div>
          )}
        </div>

        <div className="col-span-2">
          <div className="bg-gray-50 rounded-lg p-3 h-full border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
              <ClipboardCheck className="w-3.5 h-3.5" />
              全部待处理需求 ({selectedRequirements.length})
            </p>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {selectedRequirements.map((req) => (
                <SummaryCard key={req.id} req={req} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
