import { useMemo, useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Clock, Target, FileText, Filter, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { RegionChart } from './RegionChart';
import { ModuleChart } from './ModuleChart';
import { StatusChart } from './StatusChart';
import { ResponseTimeChart } from './ResponseTimeChart';
import { StatsTable } from './StatsTable';
import { formatPercent } from '@/utils/format';
import type { ModuleType, RequirementStatus } from '@/types';
import { MODULE_LABELS } from '@/utils/constants';

interface ChartFilters {
  region: string;
  module: string;
  period: string;
}

interface DrillDownFilter {
  region?: string[];
  module?: ModuleType[];
  status?: RequirementStatus[];
}

export default function Statistics() {
  const navigate = useNavigate();
  const requirements = useAppStore((state) => state.requirements);
  const stores = useAppStore((state) => state.stores);
  const versions = useAppStore((state) => state.versions);
  const users = useAppStore((state) => state.users);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);

  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const regions = Array.from(new Set(stores.map(s => s.region)));
  const regionOptions = [
    { value: 'all', label: '全部区域' },
    ...regions.map(r => ({ value: r, label: r })),
  ];

  const moduleOptions = [
    { value: 'all', label: '全部模块' },
    { value: 'pos', label: '收银' },
    { value: 'inventory', label: '库存' },
    { value: 'member', label: '会员' },
    { value: 'report', label: '报表' },
    { value: 'other', label: '其他' },
  ];

  const periodOptions = [
    { value: 'all', label: '全部时间' },
    { value: '7d', label: '近7天' },
    { value: '30d', label: '近30天' },
    { value: '90d', label: '近90天' },
  ];

  const chartFilters: ChartFilters = {
    region: selectedRegion,
    module: selectedModule,
    period: selectedPeriod,
  };

  const { totalCount, pendingCount, closedCount, avgResponseTime, avgCloseRate, topModule } = useMemo(() => {
    const filtered = requirements.filter(r => {
      if (selectedRegion !== 'all') {
        const store = stores.find(s => s.id === r.storeId);
        if (!store || store.region !== selectedRegion) return false;
      }
      if (selectedModule !== 'all' && r.module !== selectedModule) return false;

      if (selectedPeriod !== 'all') {
        const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (new Date(r.createdAt) < cutoff) return false;
      }

      return true;
    });

    const total = filtered.length;
    const pending = filtered.filter(r => r.status !== 'released' && r.status !== 'rejected').length;
    const closed = filtered.filter(r => r.status === 'released').length;

    const reviewed = filtered.filter(r => r.reviewTime);
    const avgResponse = reviewed.length > 0
      ? Math.round(reviewed.reduce((sum, r) => {
          if (!r.reviewTime) return sum;
          return sum + (new Date(r.reviewTime).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / reviewed.length * 10) / 10
      : 0;

    const closeRate = total > 0 ? Math.round(closed / total * 100) : 0;

    const modules = ['pos', 'inventory', 'member', 'report', 'other'];
    const moduleCounts = modules.map(m => ({
      module: m,
      count: filtered.filter(r => r.module === m).length,
    }));
    const top = moduleCounts.sort((a, b) => b.count - a.count)[0];

    return {
      totalCount: total,
      pendingCount: pending,
      closedCount: closed,
      avgResponseTime: avgResponse,
      avgCloseRate: closeRate,
      topModule: top,
    };
  }, [requirements, stores, selectedRegion, selectedModule, selectedPeriod]);

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      pos: '收银',
      inventory: '库存',
      member: '会员',
      report: '报表',
      other: '其他',
    };
    return labels[module] || module;
  };

  const handleDrillDown = (filter: DrillDownFilter) => {
    resetFilters();
    setTimeout(() => {
      setFilters(filter);
      navigate('/board');
    }, 0);
  };

  const StatusLabelsMap: Record<string, RequirementStatus> = {
    '待处理': 'pending',
    '评审中': 'reviewing',
    '已通过': 'approved',
    '已排期': 'scheduled',
    '开发中': 'developing',
    '测试中': 'testing',
    '已上线': 'released',
    '已拒绝': 'rejected',
  };

  const onRegionChartClick = (params: any) => {
    if (params.componentType === 'xAxis') {
      handleDrillDown({ region: [params.value] });
    } else if (params.name && regions.includes(params.name)) {
      handleDrillDown({ region: [params.name] });
    }
  };

  const onModuleChartClick = (params: any) => {
    if (params.name) {
      const moduleKey = Object.entries(MODULE_LABELS).find(([_, l]) => l === params.name)?.[0] as ModuleType;
      if (moduleKey) {
        handleDrillDown({ module: [moduleKey] });
      }
    }
  };

  const onStatusChartClick = (params: any) => {
    if (params.componentType === 'xAxis' || params.name) {
      const statusLabel = params.value || params.name;
      const statusKey = StatusLabelsMap[statusLabel];
      if (statusKey) {
        handleDrillDown({ status: [statusKey] });
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计报表</h1>
          <p className="text-sm text-gray-500 mt-1">多维度分析门店诉求，跟踪闭环效果 · 点击图表可跳转看板查看明细</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={periodOptions}
              className="w-28 h-9 text-sm"
            />
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              options={regionOptions}
              className="w-28 h-9 text-sm"
            />
            <Select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              options={moduleOptions}
              className="w-28 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-1.5" />
            导出报表
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                <p className="text-xs text-gray-500">需求总数</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-500">待完成</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{closedCount}</p>
                <p className="text-xs text-gray-500">已上线</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgCloseRate}%</p>
                <p className="text-xs text-gray-500">完成率</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{avgResponseTime || '-'}</p>
                <p className="text-xs text-gray-500">平均响应(天)</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{getModuleLabel(topModule?.module || '')}</p>
                <p className="text-xs text-gray-500">热门模块 ({topModule?.count || 0})</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">各区域需求分布</h3>
              <p className="text-xs text-indigo-600 flex items-center gap-1 opacity-75 hover:opacity-100">
                点击下钻 <ArrowRight className="w-3 h-3" />
              </p>
            </div>
            <RegionChart
              filters={chartFilters}
              onChartClick={onRegionChartClick}
            />
          </CardBody>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">模块需求占比</h3>
              <p className="text-xs text-indigo-600 flex items-center gap-1 opacity-75 hover:opacity-100">
                点击下钻 <ArrowRight className="w-3 h-3" />
              </p>
            </div>
            <ModuleChart
              filters={chartFilters}
              onChartClick={onModuleChartClick}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">各区域状态分布</h3>
              <p className="text-xs text-indigo-600 flex items-center gap-1 opacity-75 hover:opacity-100">
                点击下钻 <ArrowRight className="w-3 h-3" />
              </p>
            </div>
            <StatusChart
              filters={chartFilters}
              onChartClick={onStatusChartClick}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-900 mb-4">响应时长分析</h3>
            <ResponseTimeChart filters={chartFilters} />
          </CardBody>
        </Card>
      </div>

      <StatsTable />
    </div>
  );
}

