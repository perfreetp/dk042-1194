import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModuleTag } from '@/components/common/ModuleTag';
import { formatDate, formatDuration } from '@/utils/format';
import { ArrowUpRight, Clock } from 'lucide-react';
import { formatPercent } from '@/utils/format';

interface ChartFilters {
  region: string;
  module: string;
  status: string;
  period: string;
}

interface StatsTableProps {
  filters?: ChartFilters;
}

export function StatsTable({ filters }: StatsTableProps) {
  const requirements = useAppStore((state) => state.requirements);
  const stores = useAppStore((state) => state.stores);
  const users = useAppStore((state) => state.users);
  const getStoreById = useAppStore((state) => state.getStoreById);
  const getUserById = useAppStore((state) => state.getUserById);

  const filteredRequirements = useMemo(() => {
    let result = requirements.filter(r => !r.isHidden);
    if (filters?.period && filters.period !== 'all') {
      const days = filters.period === '7d' ? 7 : filters.period === '30d' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(r => new Date(r.createdAt) >= cutoff);
    }
    if (filters?.region && filters.region !== 'all') {
      const regionStores = stores.filter(s => s.region === filters.region).map(s => s.id);
      result = result.filter(r => regionStores.includes(r.storeId));
    }
    if (filters?.module && filters.module !== 'all') {
      result = result.filter(r => r.module === filters.module);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter(r => r.status === filters.status);
    }
    return result;
  }, [requirements, stores, filters]);
  
  const storeStats = useMemo(() => {
    return stores.map(store => {
      const storeReqs = filteredRequirements.filter(r => r.storeId === store.id);
      const total = storeReqs.length;
      const closed = storeReqs.filter(r => r.status === 'released').length;
      const avgResponse = total > 0
        ? Math.round(storeReqs.reduce((sum, r) => {
            if (!r.reviewTime) return sum;
            return sum + (new Date(r.reviewTime).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / total * 10) / 10
        : 0;
      
      const latestReq = storeReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      return {
        store,
        total,
        closed,
        rate: total > 0 ? Math.round(closed / total * 100) : 0,
        avgResponse,
        latestReq,
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredRequirements, stores]);
  
  const moduleStats = useMemo(() => {
    const modules = ['pos', 'inventory', 'member', 'report', 'other'];
    return modules.map(module => {
      const moduleReqs = filteredRequirements.filter(r => r.module === module);
      const total = moduleReqs.length;
      const closed = moduleReqs.filter(r => r.status === 'released').length;
      const avgResponse = total > 0
        ? Math.round(moduleReqs.reduce((sum, r) => {
            if (!r.reviewTime) return sum;
            return sum + (new Date(r.reviewTime).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / total * 10) / 10
        : 0;
      
      return {
        module,
        total,
        closed,
        rate: total > 0 ? Math.round(closed / total * 100) : 0,
        avgResponse,
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredRequirements]);
  
  const regionStats = useMemo(() => {
    const regions = Array.from(new Set(stores.map(s => s.region)));
    return regions.map(region => {
      const regionStores = stores.filter(s => s.region === region).map(s => s.id);
      const regionReqs = filteredRequirements.filter(r => regionStores.includes(r.storeId));
      const total = regionReqs.length;
      const closed = regionReqs.filter(r => r.status === 'released').length;
      const avgResponse = total > 0
        ? Math.round(regionReqs.reduce((sum, r) => {
            if (!r.reviewTime) return sum;
            return sum + (new Date(r.reviewTime).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / total * 10) / 10
        : 0;
      
      return {
        region,
        total,
        closed,
        rate: total > 0 ? Math.round(closed / total * 100) : 0,
        avgResponse,
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredRequirements, stores]);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="font-semibold text-gray-900 mb-4">按门店统计</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">门店</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">区域</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">需求总数</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">已上线</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">完成率</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">平均响应</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">最新需求</th>
                </tr>
              </thead>
              <tbody>
                {storeStats.slice(0, 10).map((stat, idx) => (
                  <tr key={stat.store.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{stat.store.name}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{stat.store.region}</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">{stat.total}</td>
                    <td className="py-3 px-4 text-center text-emerald-600">{stat.closed}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${stat.rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{stat.rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {stat.avgResponse > 0 ? `${stat.avgResponse}天` : '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {stat.latestReq ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge status={stat.latestReq.status} size="sm" />
                          <span className="text-gray-700 truncate max-w-[150px]" title={stat.latestReq.title}>
                            {stat.latestReq.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-900 mb-4">按模块统计</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">模块</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">总数</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">已上线</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">完成率</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">平均响应</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleStats.map((stat) => (
                    <tr key={stat.module} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <ModuleTag module={stat.module as any} />
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900">{stat.total}</td>
                      <td className="py-3 px-4 text-center text-emerald-600">{stat.closed}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${stat.rate >= 60 ? 'text-emerald-600' : stat.rate >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                          {stat.rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {stat.avgResponse > 0 ? `${stat.avgResponse}天` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-900 mb-4">按区域统计</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">区域</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">门店数</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">需求数</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">完成率</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">平均响应</th>
                  </tr>
                </thead>
                <tbody>
                  {regionStats.map((stat) => (
                    <tr key={stat.region} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{stat.region}</td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {stores.filter(s => s.region === stat.region).length}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900">{stat.total}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${stat.rate >= 60 ? 'text-emerald-600' : stat.rate >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                          {stat.rate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {stat.avgResponse > 0 ? `${stat.avgResponse}天` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
