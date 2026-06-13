import { Clock, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, CardBody } from '@/components/ui/Card';

const stats = [
  { key: 'pending', label: '待处理', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  { key: 'reviewing', label: '评审中', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'scheduled', label: '排期中', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { key: 'online', label: '已上线', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

export function StatsCards() {
  const getRequirementsByStatus = useAppStore((state) => state.getRequirementsByStatus);
  
  return (
    <div className="grid grid-cols-4 gap-5 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const count = getRequirementsByStatus(stat.key as any).length;
        return (
          <Card key={stat.key} className={`${stat.bg} ${stat.border} hover:shadow-md transition-all`}>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{count}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
