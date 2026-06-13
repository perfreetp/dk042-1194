import { useMemo } from 'react';
import { Clock, Search, GitPullRequest, Rocket } from 'lucide-react';
import { useAppStore } from '@/store';
import { Card, CardBody } from '@/components/ui/Card';

export function StatsCards() {
  const getFilteredRequirements = useAppStore((state) => state.getFilteredRequirements);
  const requirements = getFilteredRequirements();
  
  const { pendingCount, reviewingCount, scheduledCount, releasedCount, draftCount } = useMemo(() => {
    let pending = 0;
    let reviewing = 0;
    let scheduled = 0;
    let released = 0;
    let draft = 0;
    
    requirements.forEach((r) => {
      switch (r.status) {
        case 'draft':
          draft++;
          break;
        case 'pending':
          pending++;
          break;
        case 'reviewing':
          reviewing++;
          break;
        case 'approved':
        case 'scheduled':
        case 'developing':
        case 'testing':
          scheduled++;
          break;
        case 'released':
          released++;
          break;
      }
    });
    
    return {
      pendingCount: pending + draft,
      reviewingCount: reviewing,
      scheduledCount: scheduled,
      releasedCount: released,
      draftCount: draft,
    };
  }, [requirements]);
  
  const cards = [
    {
      title: '待处理',
      value: pendingCount,
      icon: <Clock className="w-6 h-6" />,
      bgClass: 'bg-gray-50',
      borderClass: 'border-gray-200',
      iconBgClass: 'bg-gray-100 text-gray-600',
      valueClass: 'text-gray-700',
      subtitle: draftCount > 0 ? `包含${draftCount}个草稿` : '',
    },
    {
      title: '评审中',
      value: reviewingCount,
      icon: <Search className="w-6 h-6" />,
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
      iconBgClass: 'bg-blue-100 text-blue-600',
      valueClass: 'text-blue-700',
    },
    {
      title: '排期中',
      value: scheduledCount,
      icon: <GitPullRequest className="w-6 h-6" />,
      bgClass: 'bg-indigo-50',
      borderClass: 'border-indigo-200',
      iconBgClass: 'bg-indigo-100 text-indigo-600',
      valueClass: 'text-indigo-700',
    },
    {
      title: '已上线',
      value: releasedCount,
      icon: <Rocket className="w-6 h-6" />,
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      iconBgClass: 'bg-emerald-100 text-emerald-600',
      valueClass: 'text-emerald-700',
    },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title} className={`${card.bgClass} ${card.borderClass}`}>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.iconBgClass} flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${card.valueClass}`}>{card.value}</p>
                  <p className="text-sm text-gray-500">{card.title}</p>
                </div>
                {card.subtitle && <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
