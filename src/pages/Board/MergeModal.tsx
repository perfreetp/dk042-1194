import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, GitMerge, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Requirement } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { Tag } from '@/components/ui/Tag';
import { formatDateTime, truncateText } from '@/utils/format';

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess?: () => void;
}

export function MergeModal({ isOpen, onClose, selectedIds, onSuccess }: MergeModalProps) {
  const requirements = useAppStore((state) => state.requirements);
  const getStoreById = useAppStore((state) => state.getStoreById);
  const mergeRequirements = useAppStore((state) => state.mergeRequirements);
  
  const [primaryId, setPrimaryId] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPrimaryId('');
      setExpandedId(null);
      setError('');
    }
  }, [isOpen, selectedIds]);
  
  const selectedRequirements = useMemo(() => {
    return requirements.filter((r) => selectedIds.includes(r.id));
  }, [requirements, selectedIds]);
  
  const handleConfirm = () => {
    if (!primaryId) {
      setError('请选择保留的主需求');
      return;
    }
    const mergedIds = selectedIds.filter((id) => id !== primaryId);
    mergeRequirements(primaryId, mergedIds);
    onSuccess?.();
    onClose();
  };
  
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  const RequirementCard = ({ req, isPrimary }: { req: Requirement; isPrimary: boolean }) => (
    <div
      className={`border-2 rounded-lg transition-all cursor-pointer ${
        primaryId === req.id
          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => { setPrimaryId(req.id); setError(''); }}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
              primaryId === req.id
                ? 'border-[#1e3a5f] bg-[#1e3a5f]'
                : 'border-gray-300 bg-white'
            }`}
          >
            {primaryId === req.id && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-gray-900">{req.title}</h4>
                {isPrimary && <Tag colorClass="bg-[#1e3a5f]/10 text-[#1e3a5f]">保留主需求</Tag>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(req.id); }}
                className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                {expandedId === req.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-500 font-mono">{req.id.toUpperCase()}</span>
              <ModuleTag module={req.module} />
              <StatusBadge status={req.status} size="sm" />
              <PriorityBadge priority={req.priority} />
            </div>
            
            {expandedId === req.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fadeIn">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">需求描述</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {req.description || '-'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-xs font-medium text-gray-500">提交门店</p>
                    <p className="text-sm text-gray-700">{getStoreById(req.storeId)?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">创建时间</p>
                    <p className="text-sm text-gray-700">{formatDateTime(req.createdAt)}</p>
                  </div>
                </div>
                {req.mergedFromIds && req.mergedFromIds.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      已包含 {req.mergedFromIds.length} 个合并来源
                    </p>
                  </div>
                )}
              </div>
            )}
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
          <GitMerge className="w-5 h-5 text-[#1e3a5f]" />
          <span>合并需求</span>
          <Tag colorClass="bg-[#1e3a5f]/10 text-[#1e3a5f]">{selectedIds.length} 项</Tag>
        </div>
      }
      size="lg"
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
            <Button onClick={handleConfirm} disabled={!primaryId}>
              <GitMerge className="w-4 h-4" />
              确认合并
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            请选择要保留的主需求，其他需求的内容将合并到主需求中，被合并的需求将从列表中隐藏。
          </p>
        </div>
        
        <Select
          label="快捷选择主需求"
          value={primaryId}
          onChange={(e) => { setPrimaryId(e.target.value); setError(''); }}
          options={selectedRequirements.map((r) => ({
            value: r.id,
            label: `${r.id.toUpperCase()} - ${truncateText(r.title, 30)}`,
          }))}
          placeholder="选择保留的主需求..."
        />
        
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {selectedRequirements.map((req, index) => (
            <RequirementCard
              key={req.id}
              req={req}
              isPrimary={primaryId === req.id}
            />
          ))}
        </div>
        
        {primaryId && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-800">
              合并完成后，将保留主需求的基本信息，其他 {selectedIds.length - 1} 个需求的描述将追加到主需求中。
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
