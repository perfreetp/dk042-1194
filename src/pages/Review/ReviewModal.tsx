import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Plus, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { formatDateTime } from '@/utils/format';
import type { ReviewConclusion, Requirement } from '@/types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirement: Requirement | null;
}

const conclusionOptions = [
  { value: 'approved', label: '通过' },
  { value: 'rejected', label: '退回' },
  { value: 'deferred', label: '暂缓' },
];

export function ReviewModal({ isOpen, onClose, requirement }: ReviewModalProps) {
  const addReview = useAppStore((state) => state.addReview);
  const currentUser = useAppStore((state) => state.currentUser);
  const getStoreById = useAppStore((state) => state.getStoreById);
  const getReviewsByRequirementId = useAppStore((state) => state.getReviewsByRequirementId);
  
  const [conclusion, setConclusion] = useState<ReviewConclusion>('approved');
  const [comment, setComment] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [materialsNeeded, setMaterialsNeeded] = useState<string[]>([]);
  const [newMaterial, setNewMaterial] = useState('');
  
  const handleSubmit = () => {
    if (!requirement || !currentUser) return;
    
    addReview({
      requirementId: requirement.id,
      conclusion,
      comment,
      returnReason: conclusion === 'rejected' ? returnReason : undefined,
      materialsNeeded: conclusion === 'rejected' ? materialsNeeded : undefined,
      reviewerId: currentUser.id,
    });
    
    handleClose();
  };
  
  const handleClose = () => {
    setConclusion('approved');
    setComment('');
    setReturnReason('');
    setMaterialsNeeded([]);
    setNewMaterial('');
    onClose();
  };
  
  const handleAddMaterial = () => {
    if (newMaterial.trim()) {
      setMaterialsNeeded([...materialsNeeded, newMaterial.trim()]);
      setNewMaterial('');
    }
  };
  
  const handleRemoveMaterial = (index: number) => {
    setMaterialsNeeded(materialsNeeded.filter((_, i) => i !== index));
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMaterial();
    }
  };
  
  if (!requirement) return null;
  
  const store = getStoreById(requirement.storeId);
  const reviews = getReviewsByRequirementId(requirement.id);
  
  const conclusionColors: Record<ReviewConclusion, string> = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    deferred: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  
  const conclusionIcons: Record<ReviewConclusion, typeof CheckCircle> = {
    approved: CheckCircle,
    rejected: XCircle,
    deferred: Clock,
  };
  
  const conclusionLabels: Record<ReviewConclusion, string> = {
    approved: '评审通过',
    rejected: '退回补充',
    deferred: '暂缓处理',
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="需求评审"
      size="xl"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            评审结论将自动更新需求状态
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose}>取消</Button>
            <Button onClick={handleSubmit} disabled={!comment.trim()}>
              提交评审结论
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">需求信息</h4>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{requirement.title}</h3>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={requirement.status} />
              <ModuleTag module={requirement.module} />
              <PriorityBadge priority={requirement.priority} />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{requirement.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">提交门店</p>
              <p className="font-medium text-gray-900">{store?.name}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">所属区域</p>
              <p className="font-medium text-gray-900">{store?.region}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">期望上线</p>
              <p className="font-medium text-gray-900">{requirement.expectedDate}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">创建时间</p>
              <p className="font-medium text-gray-900">{formatDateTime(requirement.createdAt)}</p>
            </div>
          </div>
          
          {reviews.length > 0 && (
            <div className="border-t border-gray-200 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">历史评审记录</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {reviews.map((review) => {
                  const Icon = conclusionIcons[review.conclusion];
                  return (
                    <div
                      key={review.id}
                      className={`p-3 rounded-lg border ${conclusionColors[review.conclusion]}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{conclusionLabels[review.conclusion]}</span>
                        <span className="text-xs opacity-70 ml-auto">
                          {formatDateTime(review.reviewedAt)}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{review.comment}</p>
                      {review.returnReason && (
                        <p className="text-sm mt-2 pt-2 border-t border-current/20">
                          <span className="font-medium">退回原因：</span>
                          {review.returnReason}
                        </p>
                      )}
                      {review.materialsNeeded && review.materialsNeeded.length > 0 && (
                        <div className="text-sm mt-2 pt-2 border-t border-current/20">
                          <p className="font-medium mb-1">待补材料：</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {review.materialsNeeded.map((material, i) => (
                              <li key={i}>{material}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              评审结论
            </label>
            <div className="grid grid-cols-3 gap-3">
              {conclusionOptions.map((opt) => {
                const Icon = conclusionIcons[opt.value as ReviewConclusion];
                const isActive = conclusion === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setConclusion(opt.value as ReviewConclusion)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isActive
                        ? `border-[#1e3a5f] bg-[#1e3a5f]/5`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mx-auto mb-2 ${
                        isActive ? 'text-[#1e3a5f]' : 'text-gray-400'
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        isActive ? 'text-[#1e3a5f]' : 'text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <Textarea
              label="评审意见"
              placeholder="请输入评审意见..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
            />
          </div>
          
          {conclusion === 'rejected' && (
            <div className="space-y-5 animate-in slide-in-from-top-2 duration-200">
              <div>
                <Textarea
                  label="退回原因"
                  placeholder="请详细说明退回原因..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  待补材料
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入需要补充的材料..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddMaterial}
                    disabled={!newMaterial.trim()}
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </Button>
                </div>
                
                {materialsNeeded.length > 0 && (
                  <div className="space-y-2">
                    {materialsNeeded.map((material, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{material}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
