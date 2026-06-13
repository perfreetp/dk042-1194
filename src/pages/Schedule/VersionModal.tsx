import { useState } from 'react';
import { useAppStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { VERSION_STATUS_LABELS } from '@/utils/constants';
import type { VersionStatus } from '@/types';
import { formatDate } from '@/utils/format';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editVersion?: { id: string; name: string; status: VersionStatus; startDate: string; releaseDate: string; description: string } | null;
}

const statusOptions = Object.entries(VERSION_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function VersionModal({ isOpen, onClose, editVersion }: VersionModalProps) {
  const addVersion = useAppStore((state) => state.addVersion);
  const updateVersion = useAppStore((state) => state.updateVersion);
  
  const isEdit = !!editVersion;
  
  const [name, setName] = useState(editVersion?.name || '');
  const [status, setStatus] = useState<VersionStatus>(editVersion?.status || 'planning');
  const [startDate, setStartDate] = useState(editVersion?.startDate || formatDate(new Date()));
  const [releaseDate, setReleaseDate] = useState(editVersion?.releaseDate || '');
  const [description, setDescription] = useState(editVersion?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
    
    if (isEdit && editVersion) {
      updateVersion(editVersion.id, { name, status, startDate, releaseDate, description });
    } else {
      addVersion({ name, status, startDate, releaseDate, description });
    }
    
    handleClose();
  };
  
  const handleClose = () => {
    setName('');
    setStatus('planning');
    setStartDate(formatDate(new Date()));
    setReleaseDate('');
    setDescription('');
    setErrors({});
    onClose();
  };
  

  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? '编辑版本' : '创建版本'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit}>{isEdit ? '保存修改' : '创建版本'}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="版本名称"
          placeholder="例如：V2.5.0 功能优化版"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="版本状态"
            value={status}
            onChange={(e) => setStatus(e.target.value as VersionStatus)}
            options={statusOptions}
          />
          
          <div />
          
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
        
        <Textarea
          label="版本描述"
          placeholder="描述本版本包含的主要功能..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}
