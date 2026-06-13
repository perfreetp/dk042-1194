import { useState, useMemo } from 'react';
import { Eye, Edit2, Trash2, MoreHorizontal, User, MapPin, Calendar, GitMerge, FileEdit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { formatDateTime, truncateText } from '@/utils/format';
import { BUSINESS_VALUE_LABELS, BUSINESS_VALUE_COLORS, PRIORITY_LABELS } from '@/utils/constants';
import { Tag } from '@/components/ui/Tag';
import type { Priority, BusinessValue, Requirement } from '@/types';
import { MergeModal } from './MergeModal';
import { RequirementDetail } from './RequirementDetail';

interface RequirementTableProps {
  selectedRowIds: string[];
  onRowSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onOpenMerge: () => void;
}

export function RequirementTable({ selectedRowIds, onRowSelect, onSelectAll, onOpenMerge }: RequirementTableProps) {
  const navigate = useNavigate();
  const getFilteredRequirements = useAppStore((state) => state.getFilteredRequirements);
  const getStoreById = useAppStore((state) => state.getStoreById);
  const getUserById = useAppStore((state) => state.getUserById);
  const updateRequirement = useAppStore((state) => state.updateRequirement);
  const updateRequirementStatus = useAppStore((state) => state.updateRequirementStatus);
  const deleteRequirement = useAppStore((state) => state.deleteRequirement);
  
  const requirements = getFilteredRequirements();
  const users = useAppStore((state) => state.users);
  const allRequirements = useAppStore((state) => state.requirements);
  const productManagers = users.filter(u => u.role === 'product_manager');
  
  const [selectedReq, setSelectedReq] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editBizValue, setEditBizValue] = useState<BusinessValue>('medium');
  const [editAssignee, setEditAssignee] = useState('');
  const [showMerge, setShowMerge] = useState(false);
  
  const allVisibleIds = useMemo(() => requirements.map(r => r.id), [requirements]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedRowIds.includes(id));
  const someSelected = selectedRowIds.length > 0 && !allSelected;
  
  const selectedRequirement = allRequirements.find(r => r.id === selectedReq);
  
  const handleOpenEdit = (req: Requirement) => {
    setSelectedReq(req.id);
    setEditPriority(req.priority);
    setEditBizValue(req.businessValue);
    setEditAssignee(req.assigneeId || '');
    setShowEdit(true);
  };
  
  const handleEditDraft = (req: Requirement) => {
    navigate(`/submit?draftId=${req.id}`);
  };
  
  const handleSaveEdit = () => {
    if (selectedReq) {
      updateRequirement(selectedReq, {
        priority: editPriority,
        businessValue: editBizValue,
        assigneeId: editAssignee || undefined,
      });
      if (editAssignee) {
        updateRequirementStatus(selectedReq, 'reviewing', '已分配负责人，进入评审流程');
      }
      setShowEdit(false);
    }
  };
  
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个需求吗？')) {
      deleteRequirement(id);
    }
  };
  
  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
  const bizValueOptions = Object.entries(BUSINESS_VALUE_LABELS).map(([value, label]) => ({ value, label }));
  const assigneeOptions = productManagers.map(u => ({ value: u.id, label: u.name }));
  
  const mergedFromList = useMemo(() => {
    if (!selectedRequirement?.mergedFromIds || selectedRequirement.mergedFromIds.length === 0) return [];
    return allRequirements.filter(r => selectedRequirement.mergedFromIds?.includes(r.id));
  }, [selectedRequirement, allRequirements]);
  
  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {selectedRowIds.length > 0 && (
          <div className="bg-[#1e3a5f]/5 border-b border-[#1e3a5f]/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                />
                <span className="text-sm font-medium text-[#1e3a5f]">
                  已选择 {selectedRowIds.length} 项
                </span>
              </div>
              <div className="h-5 w-px bg-[#1e3a5f]/20" />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={selectedRowIds.length < 2}
                  onClick={onOpenMerge}
                >
                  <GitMerge className="w-4 h-4" />
                  合并需求
                </Button>
                <Button variant="outline" size="sm" onClick={() => onSelectAll(false)}>
                  取消选择
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">需求ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-64">需求标题</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">模块</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">优先级</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">业务价值</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">门店</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">负责人</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">创建时间</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requirements.map((req) => {
                const store = getStoreById(req.storeId);
                const assignee = req.assigneeId ? getUserById(req.assigneeId) : null;
                const isChecked = selectedRowIds.includes(req.id);
                const hasMerged = req.mergedFromIds && req.mergedFromIds.length > 0;
                
                return (
                  <tr key={req.id} className={`hover:bg-gray-50 transition-colors group ${isChecked ? 'bg-[#1e3a5f]/[0.03]' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onRowSelect(req.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {req.id.toUpperCase()}
                      {hasMerged && (
                        <Tag colorClass="bg-purple-100 text-purple-700 ml-2" title={`已合并${req.mergedFromIds!.length}项`}>
                          <GitMerge className="w-3 h-3 mr-0.5" />
                          {req.mergedFromIds!.length}
                        </Tag>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900" title={req.title}>
                        {truncateText(req.title, 30)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5" title={req.description}>
                        {truncateText(req.description, 40)}
                      </p>
                      {hasMerged && (
                        <p className="text-[10px] text-purple-600 mt-1">
                          含 {req.mergedFromIds!.length} 项合并来源
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ModuleTag module={req.module} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <Tag colorClass={BUSINESS_VALUE_COLORS[req.businessValue]}>
                        {BUSINESS_VALUE_LABELS[req.businessValue]}
                      </Tag>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{store?.name || '-'}</span>
                      </div>
                      {store && <p className="text-xs text-gray-400 ml-5">{store.region}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {assignee ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未分配</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDateTime(req.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5"
                          onClick={() => { setSelectedReq(req.id); setShowDetail(true); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {req.status === 'draft' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 text-amber-600 hover:text-amber-700"
                            onClick={() => handleEditDraft(req)}
                            title="继续编辑"
                          >
                            <FileEdit className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5"
                            onClick={() => handleOpenEdit(req)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 text-rose-500 hover:text-rose-600"
                          onClick={() => handleDelete(req.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1.5">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {requirements.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MoreHorizontal className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无符合条件的需求</p>
            <p className="text-sm text-gray-400 mt-1">尝试调整筛选条件</p>
          </div>
        )}
      </div>
      
      <RequirementDetail
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        requirementId={selectedReq}
        onEdit={handleOpenEdit}
        onEditDraft={handleEditDraft}
      />
      
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="编辑需求"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEdit(false)}>取消</Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="优先级"
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as Priority)}
            options={priorityOptions}
          />
          <Select
            label="业务价值"
            value={editBizValue}
            onChange={(e) => setEditBizValue(e.target.value as BusinessValue)}
            options={bizValueOptions}
          />
          <Select
            label="负责人"
            value={editAssignee}
            onChange={(e) => setEditAssignee(e.target.value)}
            options={assigneeOptions}
            placeholder="选择负责人"
          />
          <p className="text-xs text-gray-500">
            分配负责人后，需求将自动进入"评审中"状态
          </p>
        </div>
      </Modal>
      
      <MergeModal
        isOpen={showMerge}
        onClose={() => setShowMerge(false)}
        selectedIds={selectedRowIds}
        onSuccess={() => {
          onSelectAll(false);
          setShowMerge(false);
        }}
      />
    </>
  );
}
