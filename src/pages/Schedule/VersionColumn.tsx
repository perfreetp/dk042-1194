import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Settings, MoreVertical, Megaphone } from 'lucide-react';
import type { Requirement, Version } from '@/types';
import { DraggableCard } from './DraggableCard';
import { VERSION_STATUS_LABELS, VERSION_STATUS_COLORS } from '@/utils/constants';
import { Tag } from '@/components/ui/Tag';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface VersionColumnProps {
  version: Version | null;
  requirements: Requirement[];
  onEdit?: (version: Version) => void;
  onAnnounce?: (versionId: string) => void;
  isUnscheduled?: boolean;
}

export function VersionColumn({ version, requirements, onEdit, onAnnounce, isUnscheduled }: VersionColumnProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const { setNodeRef, isOver } = useDroppable({
    id: version ? version.id : 'unscheduled',
  });
  
  const requirementIds = requirements.map(r => r.id);
  
  const headerClass = isUnscheduled
    ? 'bg-gray-50 border-b border-gray-200'
    : version?.status === 'released'
    ? 'bg-emerald-50 border-b border-emerald-200'
    : version?.status === 'testing'
    ? 'bg-amber-50 border-b border-amber-200'
    : version?.status === 'developing'
    ? 'bg-blue-50 border-b border-blue-200'
    : 'bg-indigo-50 border-b border-indigo-200';
  
  return (
    <div className="w-72 flex-shrink-0">
      <div className={`flex items-center gap-2 p-3 rounded-t-lg ${headerClass}`}>
        {isUnscheduled ? (
          <>
            <h3 className="font-semibold text-gray-900">待排期池</h3>
            <span className="ml-auto px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-700">
              {requirements.length}
            </span>
          </>
        ) : version && (
          <>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{version.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Tag colorClass={VERSION_STATUS_COLORS[version.status]}>
                  {VERSION_STATUS_LABELS[version.status]}
                </Tag>
                <span className="text-xs text-gray-500">
                  {version.startDate} ~ {version.releaseDate}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-700">
                {requirements.length}
              </span>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => { onEdit?.(version); setShowMenu(false); }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        编辑版本
                      </button>
                      {version.status !== 'released' && (
                        <button
                          onClick={() => { onAnnounce?.(version.id); setShowMenu(false); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          发布公告
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div
        ref={setNodeRef}
        className={`bg-gray-100 rounded-b-lg p-3 min-h-[500px] space-y-3 transition-colors ${
          isOver ? 'bg-[#1e3a5f]/10 ring-2 ring-[#1e3a5f]/30' : ''
        }`}
      >
        {requirements.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">暂无需求</p>
            <p className="text-xs mt-1">拖拽需求到此处</p>
          </div>
        ) : (
          <SortableContext items={requirementIds} strategy={verticalListSortingStrategy}>
            {requirements.map((req) => (
              <DraggableCard key={req.id} requirement={req} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
