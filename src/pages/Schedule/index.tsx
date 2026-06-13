import { useState, useMemo } from 'react';
import { Plus, Calendar, CheckCircle2, AlertTriangle, ClipboardList } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppStore } from '@/store';
import { VersionColumn } from './VersionColumn';
import { VersionModal } from './VersionModal';
import { AnnouncementModal } from './AnnouncementModal';
import { CapacitySandboxModal } from './CapacitySandboxModal';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Version, RequirementStatus } from '@/types';
import { formatDate } from '@/utils/format';
import { VERSION_STATUS_LABELS } from '@/utils/constants';

export default function Schedule() {
  const versions = useAppStore((state) => state.versions);
  const requirements = useAppStore((state) => state.requirements);
  const announcements = useAppStore((state) => state.announcements);
  const updateRequirement = useAppStore((state) => state.updateRequirement);
  const updateRequirementStatus = useAppStore((state) => state.updateRequirementStatus);
  const getVersionById = useAppStore((state) => state.getVersionById);
  
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [editVersion, setEditVersion] = useState<Version | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>();
  const [sandboxVersionId, setSandboxVersionId] = useState<string>('');
  const [sandboxReqIds, setSandboxReqIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDrag, setPendingDrag] = useState<{ reqId: string; targetVersionId: string | undefined } | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [versions]);
  
  const unscheduledRequirements = useMemo(() => {
    return requirements.filter(r => !r.versionId && (r.status === 'approved' || r.status === 'scheduled'));
  }, [requirements]);
  
  const getRequirementsByVersion = (versionId: string) => {
    return requirements.filter(r => r.versionId === versionId);
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragOver = (event: DragOverEvent) => {
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;
    
    const activeVersion = getVersionById(activeId);
    const overVersion = getVersionById(overId);
    
    if (activeVersion || overVersion || overId === 'unscheduled') {
      if (overVersion || overId === 'unscheduled') {
        const activeRequirement = requirements.find(r => r.id === activeId);
        if (!activeRequirement) return;
        
        const targetVersionId = overId === 'unscheduled' ? undefined : overId;
        
        if (targetVersionId && activeRequirement.versionId !== targetVersionId) {
          setSandboxVersionId(targetVersionId);
          setSandboxReqIds([activeId]);
          setPendingDrag({ reqId: activeId, targetVersionId });
          setShowSandbox(true);
          return;
        }
        
        if (!targetVersionId && activeRequirement.versionId) {
          updateRequirement(activeId, { versionId: undefined });
          updateRequirementStatus(activeId, 'approved' as RequirementStatus, '已移出版本');
        }
      }
      return;
    }
    
    const activeReq = requirements.find(r => r.id === activeId);
    const overReq = requirements.find(r => r.id === overId);
    
    if (activeReq && overReq && activeReq.versionId === overReq.versionId) {
      const versionReqs = getRequirementsByVersion(activeReq.versionId || '');
      const oldIndex = versionReqs.findIndex(r => r.id === activeId);
      const newIndex = versionReqs.findIndex(r => r.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        arrayMove(versionReqs, oldIndex, newIndex);
      }
    }
  };

  const handleSandboxConfirm = () => {
    if (!pendingDrag) return;
    const { reqId, targetVersionId } = pendingDrag;
    
    if (targetVersionId) {
      updateRequirement(reqId, { versionId: targetVersionId });
      updateRequirementStatus(reqId, 'scheduled' as RequirementStatus, '已排入版本');
    }
    
    setShowSandbox(false);
    setPendingDrag(null);
    setSandboxReqIds([]);
    setSandboxVersionId('');
  };

  const handleSandboxCancel = () => {
    setShowSandbox(false);
    setPendingDrag(null);
    setSandboxReqIds([]);
    setSandboxVersionId('');
  };
  
  const handleCreateVersion = () => {
    setEditVersion(null);
    setShowVersionModal(true);
  };
  
  const handleEditVersion = (version: Version) => {
    setEditVersion(version);
    setShowVersionModal(true);
  };
  
  const handleAnnounce = (versionId: string) => {
    setSelectedVersionId(versionId);
    setShowAnnouncementModal(true);
  };
  
  const plannedCount = versions.filter(v => v.status === 'planning').length;
  const developingCount = versions.filter(v => v.status === 'developing').length;
  const testingCount = versions.filter(v => v.status === 'testing').length;
  const releasedCount = versions.filter(v => v.status === 'released').length;
  
  const delayedVersions = versions.filter(v => {
    if (v.status === 'released') return false;
    return new Date(v.releaseDate) < new Date();
  });
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">版本排期</h1>
          <p className="text-sm text-gray-500 mt-1">拖拽需求到对应版本进行排期管理</p>
        </div>
        <div className="flex items-center gap-3">
          {delayedVersions.length > 0 && (
            <Badge variant="warning" dot>
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {delayedVersions.length} 个版本延期
            </Badge>
          )}
          <Button onClick={handleCreateVersion}>
            <Plus className="w-4 h-4" />
            新建版本
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardBody className="text-center">
            <Calendar className="w-6 h-6 mx-auto text-gray-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{versions.length}</p>
            <p className="text-sm text-gray-500">总版本数</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="w-6 h-6 mx-auto mb-2 rounded bg-indigo-100 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">{plannedCount}</p>
            <p className="text-sm text-gray-500">规划中</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="w-6 h-6 mx-auto mb-2 rounded bg-blue-100 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{developingCount}</p>
            <p className="text-sm text-gray-500">开发中</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="w-6 h-6 mx-auto mb-2 rounded bg-amber-100 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{testingCount}</p>
            <p className="text-sm text-gray-500">测试中</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{releasedCount}</p>
            <p className="text-sm text-gray-500">已发布</p>
          </CardBody>
        </Card>
      </div>
      
      {announcements.length > 0 && (
        <div className="mb-6 space-y-3">
          {announcements.slice(0, 2).map((ann) => {
            const version = getVersionById(ann.versionId);
            return (
              <Card key={ann.id} className="bg-emerald-50 border-emerald-200">
                <CardBody className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-emerald-900">{ann.title}</h4>
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                        {version?.name}
                      </span>
                      <span className="text-xs text-emerald-600 ml-auto">
                        {formatDate(ann.publishedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-700 line-clamp-2">{ann.content}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
      
      {delayedVersions.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            延期版本提醒 ({delayedVersions.length})
          </h3>
          {delayedVersions.map((version) => {
            const reqCount = getRequirementsByVersion(version.id).length;
            const delayDays = Math.ceil((new Date().getTime() - new Date(version.releaseDate).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={version.id} className="bg-rose-50 border-rose-200">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-rose-900">{version.name}</h4>
                        <span className="text-xs text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                          已延期 {delayDays} 天
                        </span>
                        <span className="text-xs text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded">
                          {reqCount} 个需求
                        </span>
                        {version.originalReleaseDate && (
                          <span className="text-xs text-gray-500">
                            原计划: {version.originalReleaseDate} → 现计划: {version.releaseDate}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto !border-rose-300 !text-rose-600 hover:!bg-rose-100 !py-1 !px-3 text-xs"
                          onClick={() => handleEditVersion(version)}
                        >
                          调整排期
                        </Button>
                      </div>
                      {version.delayReason ? (
                        <div className="mt-2 p-2 bg-white/70 rounded-md border border-rose-200/60">
                          <p className="text-xs text-rose-700 leading-relaxed">
                            <strong className="font-medium">延期原因：</strong>
                            {version.delayReason}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          请点击"调整排期"填写延期原因
                        </p>
                      )}
                      {version.mitigationPlan && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200/60">
                          <p className="text-xs text-blue-700 leading-relaxed flex items-start gap-1">
                            <ClipboardList className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong className="font-medium">处理计划：</strong>
                              {version.mitigationPlan.length > 60 ? version.mitigationPlan.slice(0, 60) + '...' : version.mitigationPlan}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <VersionColumn
            version={null}
            requirements={unscheduledRequirements}
            isUnscheduled
          />
          
          {sortedVersions.map((version) => (
            <VersionColumn
              key={version.id}
              version={version}
              requirements={getRequirementsByVersion(version.id)}
              onEdit={handleEditVersion}
              onAnnounce={handleAnnounce}
            />
          ))}
        </div>
      </DndContext>
      
      <VersionModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        editVersion={editVersion}
      />
      
      <AnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        versions={versions}
        selectedVersionId={selectedVersionId}
      />
      
      <CapacitySandboxModal
        isOpen={showSandbox}
        onClose={handleSandboxCancel}
        versionId={sandboxVersionId}
        requirementIdsToAdd={sandboxReqIds}
        onConfirm={handleSandboxConfirm}
      />
    </div>
  );
}
