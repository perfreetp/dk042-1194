import { useState } from 'react';
import { Plus, GitMerge, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatsCards } from './StatsCards';
import { FilterBar } from './FilterBar';
import { RequirementTable } from './RequirementTable';
import { MergeModal } from './MergeModal';
import { BatchReviewModal } from './BatchReviewModal';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store';

export default function Board() {
  const navigate = useNavigate();
  const getFilteredRequirements = useAppStore((state) => state.getFilteredRequirements);
  const requirements = getFilteredRequirements();
  
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [showMerge, setShowMerge] = useState(false);
  const [showBatchReview, setShowBatchReview] = useState(false);
  
  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRowIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(requirements.map(r => r.id));
    } else {
      setSelectedRowIds([]);
    }
  };
  
  const filteredSelectedIds = selectedRowIds.filter(id =>
    requirements.some(r => r.id === id)
  );
  
  const canMerge = filteredSelectedIds.length >= 2;
  const canBatchReview = filteredSelectedIds.length >= 1;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">需求看板</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有门店提交的需求，支持多维度筛选和搜索</p>
        </div>
        <div className="flex items-center gap-3">
          {canBatchReview && (
            <Button variant="outline" onClick={() => setShowBatchReview(true)}>
              <ClipboardCheck className="w-4 h-4" />
              批量评审{filteredSelectedIds.length > 1 ? ` (${filteredSelectedIds.length})` : ''}
            </Button>
          )}
          {canMerge && (
            <Button variant="secondary" onClick={() => setShowMerge(true)}>
              <GitMerge className="w-4 h-4" />
              合并 ({filteredSelectedIds.length})
            </Button>
          )}
          <Button onClick={() => navigate('/submit')}>
            <Plus className="w-4 h-4" />
            新建需求
          </Button>
        </div>
      </div>
      
      <StatsCards />
      <FilterBar />
      <RequirementTable
        selectedRowIds={filteredSelectedIds}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        onOpenMerge={() => setShowMerge(true)}
      />
      
      <MergeModal
        isOpen={showMerge}
        onClose={() => setShowMerge(false)}
        selectedIds={filteredSelectedIds}
        onSuccess={() => {
          setSelectedRowIds([]);
          setShowMerge(false);
        }}
      />

      <BatchReviewModal
        isOpen={showBatchReview}
        onClose={() => setShowBatchReview(false)}
        selectedIds={filteredSelectedIds}
        onSuccess={() => {
          setSelectedRowIds([]);
          setShowBatchReview(false);
        }}
      />
    </div>
  );
}
