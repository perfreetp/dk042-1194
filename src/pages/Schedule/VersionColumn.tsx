import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Settings, MoreVertical, Megaphone, AlertTriangle, CalendarX, Gauge, ShieldAlert, ClipboardList } from 'lucide-react';
import type { Requirement, Version } from '@/types';
import { DraggableCard } from './DraggableCard';
import { VERSION_STATUS_LABELS, VERSION_STATUS_COLORS, PRIORITY_LABELS } from '@/utils/constants';
import { Tag } from '@/components/ui/Tag';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { truncateText } from '@/utils/format';

interface VersionColumnProps {
  version: Version | null;
  requirements: Requirement[];
  onEdit?: (version: Version) => void;
  onAnnounce?: (versionId: string) => void;
  isUnscheduled?: boolean;
}

const RISK_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};
const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

export function VersionColumn({ version, requirements, onEdit, onAnnounce, isUnscheduled }: VersionColumnProps) {
  const [showMenu, setShowMenu] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: version ? version.id : 'unscheduled',
  });

  const requirementIds = requirements.map(r => r.id);

  const isDelayed = version && version.status !== 'released' && version.releaseDate
    ? new Date(version.releaseDate) < new Date()
    : false;

  const workload = requirements.reduce((sum, r) => {
    const priorityWeight = r.priority === 'critical' ? 5 : r.priority === 'high' ? 3 : r.priority === 'medium' ? 2 : 1;
    return sum + priorityWeight;
  }, 0);

  const capacity = version?.capacity || 0;
  const usageRatio = capacity > 0 ? workload / capacity : 0;
  const isOverloaded = capacity > 0 && workload > capacity;
  const isNearCapacity = capacity > 0 && !isOverloaded && usageRatio >= 0.8;

  const criticalCount = requirements.filter(r => r.priority === 'critical').length;
  const highCount = requirements.filter(r => r.priority === 'high').length;

  const headerClass = isUnscheduled
    ? 'bg-gray-50 border-b border-gray-200'
    : isDelayed
    ? 'bg-rose-50 border-b border-rose-200'
    : version?.status === 'released'
    ? 'bg-emerald-50 border-b border-emerald-200'
    : version?.status === 'testing'
    ? 'bg-amber-50 border-b border-amber-200'
    : version?.status === 'developing'
    ? 'bg-blue-50 border-b border-blue-200'
    : 'bg-indigo-50 border-b border-indigo-200';

  const affectedReqsPreview = requirements.slice(0, 3);

  return (
    <div className="w-72 flex-shrink-0">
      <div className={`flex items-start gap-2 p-3 rounded-t-lg ${headerClass}`}>
        {isUnscheduled ? (
          <>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">待排期池</h3>
              <p className="text-xs text-gray-500 mt-0.5">已通过评审，等待分配版本</p>
            </div>
            <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-gray-700">
              {requirements.length}
            </span>
          </>
        ) : version && (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{version.name}</h3>
                {isDelayed && (
                  <span className="flex-shrink-0" title="已延期">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </span>
                )}
                {version.riskLevel && (
                  <span className="flex-shrink-0" title={`风险等级：${RISK_LABELS[version.riskLevel]}`}>
                    <ShieldAlert className={`w-4 h-4 ${version.riskLevel === 'high' ? 'text-rose-500' : version.riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </span>
                )}
                {isOverloaded && (
                  <span className="flex-shrink-0" title="容量超载">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Tag colorClass={VERSION_STATUS_COLORS[version.status]}>
                  {VERSION_STATUS_LABELS[version.status]}
                </Tag>
                {version.riskLevel && (
                  <Tag colorClass={RISK_COLORS[version.riskLevel]}>
                    <ShieldAlert className="w-3 h-3 mr-0.5" />
                    {RISK_LABELS[version.riskLevel]}
                  </Tag>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {version.originalReleaseDate && isDelayed ? (
                    <>
                      <CalendarX className="w-3 h-3 text-rose-500" />
                      <span className="text-rose-600 line-through">{version.originalReleaseDate}</span>
                      <span className="mx-0.5">→</span>
                    </>
                  ) : null}
                  <span className={isDelayed ? 'text-rose-600 font-medium' : ''}>
                    {version.releaseDate}
                  </span>
                </div>
              </div>

              {capacity > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Gauge className="w-3 h-3" />
                      容量 {workload}/{capacity}
                      {criticalCount > 0 && <span className="text-rose-600">·P0×{criticalCount}</span>}
                      {highCount > 0 && <span className="text-orange-600">·P1×{highCount}</span>}
                    </span>
                    <span className={`font-medium ${isOverloaded ? 'text-rose-600' : isNearCapacity ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {Math.round(usageRatio * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverloaded ? 'bg-rose-500' : isNearCapacity ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(usageRatio * 100, 100)}%` }}
                    />
                  </div>
                  {isOverloaded && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      超载 {workload - capacity} 点，建议移出
                    </p>
                  )}
                </div>
              )}

              {isDelayed && version.mitigationPlan && (
                <div className="mt-2 p-2 bg-blue-100/60 rounded-md border border-blue-200/60">
                  <p className="text-[11px] text-blue-800 leading-relaxed flex items-start gap-1">
                    <ClipboardList className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong className="font-medium">处理计划：</strong>
                      {truncateText(version.mitigationPlan, 50)}
                    </span>
                  </p>
                </div>
              )}

              {isDelayed && requirements.length > 0 && (
                <div className="mt-2 p-2 bg-white/70 rounded-md border border-gray-200/60">
                  <p className="text-[11px] text-gray-600 mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    受影响需求 ({requirements.length})：
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {affectedReqsPreview.map(r => (
                      <span key={r.id} className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-700 max-w-[120px] truncate">
                        {PRIORITY_LABELS[r.priority]} {r.title}
                      </span>
                    ))}
                    {requirements.length > 3 && (
                      <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">
                        +{requirements.length - 3} 更多
                      </span>
                    )}
                  </div>
                </div>
              )}

              {version.delayReason && (
                <div className="mt-2 p-2 bg-rose-100/50 rounded-md border border-rose-200/60">
                  <p className="text-[11px] text-rose-700 leading-relaxed" title={version.delayReason}>
                    <strong className="font-medium">延期原因：</strong>
                    {truncateText(version.delayReason, 40)}
                  </p>
                </div>
              )}
              {version.description && !version.delayReason && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={version.description}>
                  {truncateText(version.description, 40)}
                </p>
              )}
            </div>
            <div className="flex items-start gap-1">
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

