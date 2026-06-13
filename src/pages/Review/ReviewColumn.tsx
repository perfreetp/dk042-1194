import { GripVertical, MapPin, Calendar } from 'lucide-react';
import type { Requirement } from '@/types';
import { useAppStore } from '@/store';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { truncateText, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';

interface ReviewColumnProps {
  title: string;
  status: Requirement['status'][];
  icon: React.ReactNode;
  color: string;
  requirements: Requirement[];
  onReview: (req: Requirement) => void;
}

export function ReviewColumn({ title, icon, color, requirements, onReview }: ReviewColumnProps) {
  const getStoreById = useAppStore((state) => state.getStoreById);
  const getUserById = useAppStore((state) => state.getUserById);
  
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center gap-2 p-3 rounded-t-lg ${color}`}>
        {icon}
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="ml-auto px-2 py-0.5 bg-white/80 rounded-full text-xs font-medium text-gray-700">
          {requirements.length}
        </span>
      </div>
      
      <div className="bg-gray-100 rounded-b-lg p-3 min-h-[500px] space-y-3">
        {requirements.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">暂无需求</p>
          </div>
        ) : (
          requirements.map((req) => {
            const store = getStoreById(req.storeId);
            const assignee = req.assigneeId ? getUserById(req.assigneeId) : null;
            
            return (
              <Card key={req.id} hoverable className="group">
                <CardBody className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-2" title={req.title}>
                        {truncateText(req.title, 25)}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <ModuleTag module={req.module} />
                        <PriorityBadge priority={req.priority} />
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2" title={req.description}>
                        {truncateText(req.description, 50)}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{truncateText(store?.name || '', 8)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(req.createdAt)}</span>
                        </div>
                      </div>
                      {assignee && (
                        <p className="text-xs text-gray-500 mt-1">
                          负责人：{assignee.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => onReview(req)}
                    >
                      开始评审
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
