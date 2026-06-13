import { useState } from 'react';
import { useAppStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import type { Version } from '@/types';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: Version[];
  selectedVersionId?: string;
}

export function AnnouncementModal({ isOpen, onClose, versions, selectedVersionId }: AnnouncementModalProps) {
  const addAnnouncement = useAppStore((state) => state.addAnnouncement);
  const updateVersion = useAppStore((state) => state.updateVersion);
  
  const [versionId, setVersionId] = useState(selectedVersionId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const versionOptions = versions
    .filter(v => v.status !== 'released')
    .map(v => ({ value: v.id, label: v.name }));
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!versionId) newErrors.versionId = '请选择版本';
    if (!title.trim()) newErrors.title = '请输入公告标题';
    if (!content.trim()) newErrors.content = '请输入公告内容';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (!validate()) return;
    
    addAnnouncement({ versionId, title, content });
    updateVersion(versionId, { status: 'released' });
    
    handleClose();
  };
  
  const handleClose = () => {
    setVersionId(selectedVersionId || '');
    setTitle('');
    setContent('');
    setErrors({});
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="发布上线公告"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit}>发布公告</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="发布版本"
          value={versionId}
          onChange={(e) => setVersionId(e.target.value)}
          options={versionOptions}
          error={errors.versionId}
          required
          disabled={!!selectedVersionId}
        />
        
        <Input
          label="公告标题"
          placeholder="例如：V2.5.0 版本正式上线公告"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />
        
        <Textarea
          label="公告内容"
          placeholder="请详细描述本版本包含的功能、优化内容和注意事项..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          error={errors.content}
          required
        />
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-700">
            <strong>提示：</strong>发布公告后，该版本状态将自动更新为"已发布"。
          </p>
        </div>
      </div>
    </Modal>
  );
}
