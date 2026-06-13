import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import type { Version, VersionStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { VERSION_STATUS_LABELS } from '@/utils/constants';
import { AlertTriangle } from 'lucide-react';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editVersion?: Version | null;
}

export function VersionModal({ isOpen, onClose, editVersion }: VersionModalProps) {
  const addVersion = useAppStore((state) => state.addVersion);
  const updateVersion = useAppStore((state) => state.updateVersion);
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState<VersionStatus>('planning');
  const [startDate, setStartDate] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [originalReleaseDate, setOriginalReleaseDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const isDelayed = editVersion?.status !== 'released' && editVersion?.releaseDate
    ? new Date(editVersion.releaseDate) < new Date()
    : false;
  
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
      } else {
        setName('');
        setStatus('planning');
        setStartDate('');
        setReleaseDate('');
        setDescription('');
        setDelayReason('');
        setOriginalReleaseDate('');
      }
      setErrors({});
    }
  }, [isOpen, editVersion]);
  
  const statusOptions = Object.entries(VERSION_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  
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
    setErrors({});
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editVersion ? '编辑版本' : '新建版本'}
      size="lg"
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
        
        <Select
          label="版本状态"
          value={status}
          onChange={(e) => setStatus(e.target.value as VersionStatus)}
          options={statusOptions}
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
