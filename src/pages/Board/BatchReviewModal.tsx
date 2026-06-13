import { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, AlertCircle, Users, Flag, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Requirement, RequirementStatus, Priority } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { Tag } from '@/components/ui/Tag';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/utils/constants';

interface BatchReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess?: () => void;
}

export function BatchReviewModal({ isOpen, onClose, selectedIds, onSuccess }: BatchReviewModalProps) {
  const requirements = useAppStore((state) => state.requirements);
  const users = useAppStore((state) => state.users);
  const batchReview = useAppStore((state) => state.batchReview);

  const [assigneeId, setAssigneeId] = useState<string>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [status, setStatus] = useState<RequirementStatus | ''>('');
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAssigneeId('');
      setPriority('');
      setStatus('');
      setReviewComment('');
      setError('');
    }
  }, [isOpen]);

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

  const hasAnyChange = assigneeId || priority || status || reviewComment.trim();

  const handleConfirm = () => {
    if (!hasAnyChange) {
      setError('请至少设置一项评审操作：负责人、优先级、状态或评审备注');
      return;
    }
    const updates: { assigneeId?: string; priority?: Priority; reviewComment?: string; status?: RequirementStatus } = {};
    if (assigneeId) updates.assigneeId = assigneeId;
    if (priority) updates.priority = priority;
    if (status) updates.status = status;
    if (reviewComment.trim()) updates.reviewComment = reviewComment.trim();

    batchReview(selectedIds, updates);
    onSuccess?.();
    onClose();
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
            <Button onClick={handleConfirm} disabled={!hasAnyChange}>
              <ClipboardCheck className="w-4 h-4" />
              执行批量评审
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              统一分配负责人、调整优先级、变更状态并添加评审备注。未选择的选项将保持原样。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={<span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" />负责人</span>}
              value={assigneeId}
              onChange={(e) => { setAssigneeId(e.target.value); setError(''); }}
              options={userOptions}
            />
            <Select
              label={<span className="flex items-center gap-1.5"><Flag className="w-4 h-4 text-gray-400" />优先级</span>}
              value={priority}
              onChange={(e) => { setPriority(e.target.value as Priority | ''); setError(''); }}
              options={priorityOptions}
            />
          </div>

          <Select
            label={<span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-gray-400" />评审结论 / 状态变更</span>}
            value={status}
            onChange={(e) => { setStatus(e.target.value as RequirementStatus | ''); setError(''); }}
            options={batchStatusOptions}
          />

          <Textarea
            label={<span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-gray-400" />评审备注（说明分配理由或处理意见）</span>}
            placeholder="例如：这批需求涉及会员体系重构，统一由张经理跟进，预计2周内完成评审..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
          />

          {hasAnyChange && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-800 mb-1.5 font-medium">即将执行以下批量操作：</p>
              <ul className="text-xs text-emerald-700 space-y-1">
                {assigneeId && <li>• 分配负责人：{users.find(u => u.id === assigneeId)?.name}</li>}
                {priority && <li>• 调整优先级：{PRIORITY_LABELS[priority]}</li>}
                {status && <li>• 变更状态：{STATUS_LABELS[status]}</li>}
                {reviewComment.trim() && <li>• 添加评审备注</li>}
                <li>• 处理需求数量：{selectedIds.length} 项</li>
              </ul>
            </div>
          )}
        </div>

        <div className="col-span-2">
          <div className="bg-gray-50 rounded-lg p-3 h-full border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
              <ClipboardCheck className="w-3.5 h-3.5" />
              待处理需求清单 ({selectedRequirements.length})
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
