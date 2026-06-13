import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Users } from 'lucide-react';
import { useAppStore } from '@/store';
import { ReviewColumn } from './ReviewColumn';
import { ReviewModal } from './ReviewModal';
import { RequirementDetail } from '@/pages/Board/RequirementDetail';
import type { Requirement } from '@/types';

const columns = [
  {
    key: 'reviewing',
    title: '待评审',
    status: ['reviewing'] as const,
    icon: <Clock className="w-5 h-5 text-blue-600" />,
    color: 'bg-blue-50 border-b border-blue-100',
  },
  {
    key: 'completed',
    title: '已评审',
    status: ['approved', 'scheduled', 'developing', 'testing', 'released'] as const,
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    color: 'bg-emerald-50 border-b border-emerald-100',
  },
  {
    key: 'returned',
    title: '已退回/暂缓',
    status: ['rejected', 'deferred', 'pending'] as const,
    icon: <XCircle className="w-5 h-5 text-rose-600" />,
    color: 'bg-rose-50 border-b border-rose-100',
  },
];

export default function Review() {
  const requirements = useAppStore((state) => state.requirements);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailReqId, setDetailReqId] = useState<string>('');
  
  const getRequirementsByStatuses = (statuses: readonly Requirement['status'][]) => {
    return requirements.filter(r => statuses.includes(r.status));
  };
  
  const handleReview = (req: Requirement) => {
    setSelectedReq(req);
    setShowModal(true);
  };
  
  const handleViewDetail = (reqId: string) => {
    setDetailReqId(reqId);
    setShowDetail(true);
  };
  
  const totalCount = requirements.length;
  const reviewingCount = getRequirementsByStatuses(['reviewing']).length;
  const completedCount = getRequirementsByStatuses(['approved', 'scheduled', 'developing', 'testing', 'released']).length;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">评审会议</h1>
          <p className="text-sm text-gray-500 mt-1">对需求进行评审，记录评审结论和意见</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
            <Users className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">评审委员</p>
              <p className="text-sm font-medium text-gray-900">赵丽、陈明、刘海</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">需求总数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-600">待评审</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{reviewingCount}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
          <p className="text-sm text-emerald-600">已评审通过</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
        </div>
        <div className="bg-rose-50 rounded-lg border border-rose-200 p-4">
          <p className="text-sm text-rose-600">退回/暂缓</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">
            {totalCount - reviewingCount - completedCount}
          </p>
        </div>
      </div>
      
      <div className="flex gap-4">
        {columns.map((col) => (
          <ReviewColumn
            key={col.key}
            title={col.title}
            status={[...col.status]}
            icon={col.icon}
            color={col.color}
            requirements={getRequirementsByStatuses(col.status)}
            onReview={handleReview}
            onViewDetail={handleViewDetail}
          />
        ))}
      </div>
      
      <ReviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        requirement={selectedReq}
      />
      
      <RequirementDetail
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        requirementId={detailReqId}
      />
    </div>
  );
}
