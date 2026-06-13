import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import type { Version } from '@/types';
import { Megaphone, CheckCircle2 } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: Version[];
  selectedVersionId?: string;
}

export function AnnouncementModal({ isOpen, onClose, versions, selectedVersionId }: AnnouncementModalProps) {
  const addAnnouncement = useAppStore((state) => state.addAnnouncement);
  const getVersionById = useAppStore((state) => state.getVersionById);
  
  const [versionId, setVersionId] = useState(selectedVersionId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      const newVersionId = selectedVersionId || '';
      setVersionId(newVersionId);
      if (newVersionId) {
        const version = getVersionById(newVersionId);
        if (version) {
          setTitle(`${version.name} 版本正式上线公告`);
          setContent(`${version.name} 版本已于今日正式上线，包含以下功能：\n\n${version.description}\n\n如有问题请联系技术支持。`);
        }
      } else {
        setTitle('');
        setContent('');
      }
      setErrors({});
      setShowSuccess(false);
    }
  }, [isOpen, selectedVersionId, getVersionById]);
  
  const versionOptions = versions
    .filter(v => v.status !== 'released')
    .map(v => ({ value: v.id, label: v.name }));
  
  const selectedVersion = versionId ? getVersionById(versionId) : null;
  
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
    
    setShowSuccess(true);
    setTimeout(() => {
      handleClose();
    }, 800);
  };
  
  const handleClose = () => {
    setVersionId('');
    setTitle('');
    setContent('');
    setErrors({});
    setShowSuccess(false);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#1e3a5f]" />
          <span>发布上线公告</span>
        </div>
      }
      size="lg"
      footer={
        <div className="flex justify-between items-center gap-3">
          <div>
            {showSuccess && (
              <p className="text-sm text-emerald-600 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                公告发布成功！版本已更新为"已发布"状态
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>取消</Button>
            <Button onClick={handleSubmit} disabled={!versionId || showSuccess}>
              <Megaphone className="w-4 h-4" />
              发布公告
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="发布版本"
          value={versionId}
          onChange={(e) => {
            const newId = e.target.value;
            setVersionId(newId);
            if (newId) {
              const version = getVersionById(newId);
              if (version) {
                setTitle(`${version.name} 版本正式上线公告`);
                setContent(`${version.name} 版本已于今日正式上线，包含以下功能：\n\n${version.description}\n\n如有问题请联系技术支持。`);
              }
            }
          }}
          options={versionOptions}
          error={errors.versionId}
          required
          disabled={!!selectedVersionId}
          placeholder="请选择要发布的版本..."
        />
        
        {selectedVersion && (
          <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">版本信息</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-700">
                <strong>开始：</strong>{selectedVersion.startDate}
              </span>
              <span className="text-gray-700">
                <strong>计划发布：</strong>{selectedVersion.releaseDate}
              </span>
              <span className="text-gray-700">
                <strong>包含需求数：</strong>
                {useAppStore.getState().getRequirementsByVersion(selectedVersion.id).length}
              </span>
            </div>
          </div>
        )}
        
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
            <strong>提示：</strong>发布公告后，该版本状态将自动更新为"已发布"，并在首页和排期页顶部公告列表显示。
          </p>
        </div>
      </div>
    </Modal>
  );
}
