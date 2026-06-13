import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import type { Version, VersionStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { VERSION_STATUS_LABELS } from '@/utils/constants';
import { AlertTriangle, Gauge, ShieldAlert, ClipboardList } from 'lucide-react';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editVersion?: Version | null;
}

const RISK_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export function VersionModal({ isOpen, onClose, editVersion }: VersionModalProps) {
  const addVersion = useAppStore((state) => state.addVersion);
  const updateVersion = useAppStore((state) => state.updateVersion);
  const getRequirementsByVersion = useAppStore((state) => state.getRequirementsByVersion);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<VersionStatus>('planning');
  const [startDate, setStartDate] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [originalReleaseDate, setOriginalReleaseDate] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<'' | 'low' | 'medium' | 'high'>('');
  const [mitigationPlan, setMitigationPlan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentReqs = editVersion ? getRequirementsByVersion(editVersion.id) : [];

  const isDelayed = editVersion?.status !== 'released' && editVersion?.releaseDate
    ? new Date(editVersion.releaseDate) < new Date()
    : false;

  const currentWorkload = currentReqs.reduce((sum, r) => {
    const priorityWeight = r.priority === 'critical' ? 5 : r.priority === 'high' ? 3 : r.priority === 'medium' ? 2 : 1;
    return sum + priorityWeight;
  }, 0);

  const capacityNum = parseInt(capacity) || 0;
  const isOverloaded = capacityNum > 0 && currentWorkload > capacityNum;

  useEffect(() => {
    if (isOpen) {
      if (editVersion) {
        setName(editVersion.name);
        setStatus(editVersion.status);
        setStartDate(editVersion.startDate);
        setReleaseDate(editVersion.releaseDate);
        setDescription(editVersion.description);
        setDelayReason(editVersion.delayReason || '');
        setOriginalReleaseDate(editVersion.originalReleaseDate || '');
        setCapacity(editVersion.capacity ? String(editVersion.capacity) : '');
        setRiskLevel(editVersion.riskLevel || '');
        setMitigationPlan(editVersion.mitigationPlan || '');
      } else {
        setName('');
        setStatus('planning');
        setStartDate('');
        setReleaseDate('');
        setDescription('');
        setDelayReason('');
        setOriginalReleaseDate('');
        setCapacity('');
        setRiskLevel('');
        setMitigationPlan('');
      }
      setErrors({});
    }
  }, [isOpen, editVersion]);

  const statusOptions = Object.entries(VERSION_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  const capacityOptions = [
    { value: '', label: '不设置容量' },
    { value: '3', label: '小版本 (容量 3)' },
    { value: '6', label: '中版本 (容量 6)' },
    { value: '10', label: '大版本 (容量 10)' },
    { value: '15', label: '超大版本 (容量 15)' },
    { value: '20', label: '特大型 (容量 20)' },
  ];
  const riskOptions = [
    { value: '', label: '未评估' },
    { value: 'low', label: RISK_LABELS.low },
    { value: 'medium', label: RISK_LABELS.medium },
    { value: 'high', label: RISK_LABELS.high },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '请输入版本名称';
    if (!startDate) newErrors.startDate = '请选择开始日期';
    if (!releaseDate) newErrors.releaseDate = '请选择发布日期';
    if (startDate && releaseDate && new Date(startDate) > new Date(releaseDate)) {
      newErrors.releaseDate = '发布日期不能早于开始日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (editVersion) {
      const updates: Partial<Version> = {
        name,
        status,
        startDate,
        releaseDate,
        description,
      };

      if (editVersion.releaseDate !== releaseDate && new Date(releaseDate) > new Date(editVersion.releaseDate)) {
        updates.originalReleaseDate = editVersion.originalReleaseDate || editVersion.releaseDate;
        if (delayReason.trim()) {
          updates.delayReason = delayReason.trim();
        }
      } else if (delayReason.trim()) {
        updates.delayReason = delayReason.trim();
        if (!originalReleaseDate && editVersion.releaseDate !== releaseDate) {
          updates.originalReleaseDate = editVersion.releaseDate;
        }
      }

      if (capacity) updates.capacity = parseInt(capacity);
      else updates.capacity = undefined;
      if (riskLevel) updates.riskLevel = riskLevel;
      else updates.riskLevel = undefined;
      if (mitigationPlan.trim()) updates.mitigationPlan = mitigationPlan.trim();
      else updates.mitigationPlan = undefined;

      updateVersion(editVersion.id, updates);
    } else {
      addVersion({
        name,
        status,
        startDate,
        releaseDate,
        description,
        ...(delayReason.trim() ? { delayReason: delayReason.trim() } : {}),
        ...(originalReleaseDate ? { originalReleaseDate } : {}),
        ...(capacity ? { capacity: parseInt(capacity) } : {}),
        ...(riskLevel ? { riskLevel } : {}),
        ...(mitigationPlan.trim() ? { mitigationPlan: mitigationPlan.trim() } : {}),
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setName('');
    setStatus('planning');
    setStartDate('');
    setReleaseDate('');
    setDescription('');
    setDelayReason('');
    setOriginalReleaseDate('');
    setCapacity('');
    setRiskLevel('');
    setMitigationPlan('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editVersion ? '编辑版本' : '新建版本'}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit}>{editVersion ? '保存修改' : '创建版本'}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="版本名称"
          placeholder="例如：V2.5.0 优化增强版"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="开始日期"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.startDate}
            required
          />

          <Input
            type="date"
            label="计划发布日期"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            error={errors.releaseDate}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={<span className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-gray-400" />版本状态</span>}
            value={status}
            onChange={(e) => setStatus(e.target.value as VersionStatus)}
            options={statusOptions}
          />

          <Select
            label={<span className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-gray-400" />版本容量（工作量点数）</span>}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            options={capacityOptions}
          />
        </div>

        {editVersion && currentReqs.length > 0 && (
          <div className={`border rounded-lg p-3 ${isOverloaded ? 'bg-rose-50 border-rose-200' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <p className={`text-sm font-medium ${isOverloaded ? 'text-rose-800' : 'text-indigo-800'}`}>
                {isOverloaded && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                当前已分配 {currentReqs.length} 个需求 · 工作量 {currentWorkload} 点
                {capacityNum > 0 && ` · 容量 ${capacityNum} 点`}
              </p>
              {capacityNum > 0 && (
                <p className={`text-xs ${isOverloaded ? 'text-rose-600 font-bold' : 'text-indigo-600'}`}>
                  占用率 {Math.round(currentWorkload / capacityNum * 100)}%
                </p>
              )}
            </div>
            {capacityNum > 0 && (
              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isOverloaded ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(currentWorkload / capacityNum * 100, 100)}%` }}
                />
              </div>
            )}
            {isOverloaded && (
              <p className="text-xs text-rose-700 mt-2">
                ⚠️ 该版本已超载，建议降低优先级需求移出或增加容量设置
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={<span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-gray-400" />风险评估</span>}
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as 'low' | 'medium' | 'high' | '')}
            options={riskOptions}
          />
        </div>

        {riskLevel === 'high' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>标记为高风险的版本，建议在下方填写详细的风险应对计划。</span>
            </p>
          </div>
        )}

        <Textarea
          label={<span className="flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-gray-400" />风险应对 / 处理计划</span>}
          placeholder="高风险项应对策略、延期版本追赶计划、质量保障措施等..."
          value={mitigationPlan}
          onChange={(e) => setMitigationPlan(e.target.value)}
          rows={2}
        />

        <Textarea
          label="版本描述"
          placeholder="简要描述本版本包含的主要功能和目标..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {(isDelayed || delayReason || (editVersion && editVersion.releaseDate !== releaseDate)) && (
          <div className="space-y-3">
            {isDelayed && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <p className="text-sm text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>该版本的计划发布日期已过，建议填写延期原因。</span>
                </p>
              </div>
            )}

            {originalReleaseDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  原计划发布日期：<strong>{originalReleaseDate}</strong>
                </p>
              </div>
            )}

            <Textarea
              label="延期原因"
              placeholder="如延期请说明原因：例如需求范围扩大、开发遇到技术难点、依赖项延迟等..."
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

