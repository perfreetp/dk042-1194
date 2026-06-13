import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, Calendar, MoreHorizontal } from 'lucide-react';
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
}

export function DraggableCard({ requirement, onStatusChange }: DraggableCardProps) {
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
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-opacity ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card hoverable className="group">
        <CardBody className="p-3">
          <div className="flex items-start gap-2 mb-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0"
            >
              <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-2" title={requirement.title}>
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
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              {showStatusMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(opt.value as RequirementStatus)}
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
