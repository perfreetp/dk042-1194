import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, Calendar, MoreHorizontal, Check } from 'lucide-react';
import type { Requirement, RequirementStatus } from '@/types';
import { useAppStore } from '@/store';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { truncateText, formatDate } from '@/utils/format';
import { STATUS_LABELS } from '@/utils/constants';
import { useState } from 'react';
import { Select } from '@/components/ui/Select';

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

interface DraggableCardProps {
  requirement: Requirement;
  onStatusChange?: (id: string, status: RequirementStatus) => void;
  isSelected?: boolean;
  onSelect?: (reqId: string, e: React.MouseEvent) => void;
}

export function DraggableCard({ requirement, onStatusChange, isSelected, onSelect }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: requirement.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const getStoreById = useAppStore((state) => state.getStoreById);
  const getUserById = useAppStore((state) => state.getUserById);
  const updateRequirementStatus = useAppStore((state) => state.updateRequirementStatus);
  
  const store = getStoreById(requirement.storeId);
  const assignee = requirement.assigneeId ? getUserById(requirement.assigneeId) : null;
  
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const handleStatusChange = (newStatus: RequirementStatus) => {
    updateRequirementStatus(requirement.id, newStatus);
    onStatusChange?.(requirement.id, newStatus);
    setShowStatusMenu(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect && (e.ctrlKey || e.metaKey)) {
      onSelect(requirement.id, e);
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-opacity ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleClick}
    >
      <Card hoverable className={`group ${isSelected ? 'ring-2 ring-[#1e3a5f] ring-offset-1' : ''}`}>
        <CardBody className="p-3">
          <div className="flex items-start gap-2 mb-2">
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center z-10">
                <Check className="w-3 h-3" />
              </div>
            )}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0"
            >
              <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-2 pr-6" title={requirement.title}>
                {truncateText(requirement.title, 25)}
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <ModuleTag module={requirement.module} />
                <PriorityBadge priority={requirement.priority} />
              </div>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2" title={requirement.description}>
                {truncateText(requirement.description, 40)}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{truncateText(store?.name || '', 8)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(requirement.createdAt)}</span>
                </div>
              </div>
              {assignee && (
                <p className="text-xs text-gray-500 mt-1">
                  负责人：{assignee.name}
                </p>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              {showStatusMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={(e) => { e.stopPropagation(); setShowStatusMenu(false); }}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(opt.value as RequirementStatus); }}
                        className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 transition-colors ${
                          requirement.status === opt.value ? 'bg-[#1e3a5f]/5 text-[#1e3a5f]' : 'text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <StatusBadge status={requirement.status} />
            <Select
              value={requirement.status}
              onChange={(e) => handleStatusChange(e.target.value as RequirementStatus)}
              options={statusOptions}
              className="h-7 text-xs py-0"
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
