import { useMemo } from 'react';
import { Gauge, ShieldAlert, AlertTriangle, Calendar, CheckCircle, X } from 'lucide-react';
import { useAppStore } from '@/store';
import type { CapacityPreview } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { VERSION_STATUS_LABELS, VERSION_STATUS_COLORS, PRIORITY_LABELS } from '@/utils/constants';

interface CapacitySandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  versionId: string;
  requirementIdsToAdd: string[];
  onConfirm: () => void;
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
const RISK_ICONS: Record<string, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
};

export function CapacitySandboxModal({ isOpen, onClose, versionId, requirementIdsToAdd, onConfirm }: CapacitySandboxModalProps) {
  const versions = useAppStore((state) => state.versions);
  const requirements = useAppStore((state) => state.requirements);
  const calculateCapacityPreview = useAppStore((state) => state.calculateCapacityPreview);
  const getVersionById = useAppStore((state) => state.getVersionById);

  const version = getVersionById(versionId);

  const preview: CapacityPreview | null = useMemo(() => {
    if (!versionId || requirementIdsToAdd.length === 0) return null;
    return calculateCapacityPreview(versionId, requirementIdsToAdd);
  }, [versionId, requirementIdsToAdd, calculateCapacityPreview]);

  const addedReqs = useMemo(() => {
    return requirements.filter(r => requirementIdsToAdd.includes(r.id));
  }, [requirements, requirementIdsToAdd]);

  if (!version || !preview) return null;

  const isDelayed = version.status !== 'released' && version.releaseDate
    ? new Date(version.releaseDate) < new Date()
    : false;

  const capacityIncrease = preview.newWorkload - preview.currentWorkload;
  const riskChanged = preview.riskLevel !== preview.newRiskLevel;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-[#1e3a5f]" />
          <span>容量沙盘 · 拖入预估</span>
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-between items-center gap-3">
          <div className="text-xs text-gray-500">
            确认后需求将移入版本，容量、风险、延期提醒同步更新
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
              取消
            </Button>
            <Button onClick={onConfirm}>
              <CheckCircle className="w-4 h-4" />
              确认拖入
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            将 <strong>{addedReqs.length}</strong> 项需求拖入 <strong>{version.name}</strong> 版本，
            预计对容量、风险和排期产生以下影响：
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">容量变化</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {preview.currentWorkload}
              <span className="text-emerald-600 text-lg"> +{capacityIncrease} </span>
              <span className="text-gray-400 text-lg">= {preview.newWorkload}/{preview.capacity}</span>
            </div>
            <div className="mt-2">
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    preview.isOverloaded ? 'bg-rose-500' : preview.isNearCapacity ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(preview.utilizationPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-gray-500">占用率</span>
                <span className={`font-medium ${
                  preview.isOverloaded ? 'text-rose-600' : preview.isNearCapacity ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {preview.utilizationPercent}%
                </span>
              </div>
            </div>
            {preview.isOverloaded && (
              <div className="mt-2 text-xs text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                容量超载 {preview.newWorkload - preview.capacity} 点
              </div>
            )}
            {preview.isNearCapacity && !preview.isOverloaded && (
              <div className="mt-2 text-xs text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                接近容量上限
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">风险等级</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_COLORS[preview.riskLevel]}`}>
                {RISK_ICONS[preview.riskLevel]} {RISK_LABELS[preview.riskLevel]}
              </span>
              <span className="text-gray-400">→</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_COLORS[preview.newRiskLevel]}`}>
                {RISK_ICONS[preview.newRiskLevel]} {RISK_LABELS[preview.newRiskLevel]}
              </span>
            </div>
            {riskChanged && (
              <div className={`mt-2 text-xs flex items-center gap-1 px-2 py-1 rounded ${
                preview.newRiskLevel === 'high' ? 'text-rose-600 bg-rose-50' :
                preview.newRiskLevel === 'medium' ? 'text-amber-600 bg-amber-50' :
                'text-emerald-600 bg-emerald-50'
              }`}>
                <ShieldAlert className="w-3.5 h-3.5" />
                {preview.newRiskLevel === 'high' ? '风险升高至 高风险' :
                 preview.newRiskLevel === 'medium' ? '风险升高至 中风险' : '风险降低至 低风险'}
              </div>
            )}
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>P0 数量</span>
                <span className="font-medium">
                  {preview.p0Count} <span className="text-rose-500">+{preview.newP0Count - preview.p0Count}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>P1 数量</span>
                <span className="font-medium">
                  {preview.p1Count} <span className="text-orange-500">+{preview.newP1Count - preview.p1Count}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">排期影响</span>
            </div>
            <div className={`text-lg font-bold ${isDelayed ? 'text-rose-600' : 'text-gray-900'}`}>
              {version.releaseDate}
            </div>
            {version.originalReleaseDate && isDelayed && (
              <div className="text-xs text-gray-500 line-through">
                原计划: {version.originalReleaseDate}
              </div>
            )}
            {preview.estimatedDelayDays > 0 && (
              <div className="mt-2 text-xs text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                预计延期约 {preview.estimatedDelayDays} 天
              </div>
            )}
            {version.mitigationPlan && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded">
                <span className="font-medium">处理计划：</span>
                {version.mitigationPlan.length > 30 ? version.mitigationPlan.slice(0, 30) + '...' : version.mitigationPlan}
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700">待拖入需求清单 ({addedReqs.length})</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {addedReqs.map(req => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                <span className="text-xs text-gray-400 font-mono w-12">{req.id.toUpperCase()}</span>
                <span className="flex-1 text-sm text-gray-900 truncate">{req.title}</span>
                <PriorityBadge priority={req.priority} />
                <StatusBadge status={req.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
