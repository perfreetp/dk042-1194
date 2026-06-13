import { useMemo, useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Clock, Target, FileText, Filter, ArrowRight, BookmarkPlus, Bookmark, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { RegionChart } from './RegionChart';
import { ModuleChart } from './ModuleChart';
import { StatusChart } from './StatusChart';
import { ResponseTimeChart } from './ResponseTimeChart';
import { StatsTable } from './StatsTable';
import { formatPercent, formatDateTime } from '@/utils/format';
import type { ModuleType, RequirementStatus, FilterOptions, SavedView } from '@/types';
import { MODULE_LABELS, STATUS_LABELS } from '@/utils/constants';

interface ChartFilters {
  region: string;
  module: string;
  status: string;
  period: string;
}

interface DrillDownFilter {
  region?: string;
  module?: ModuleType;
  status?: RequirementStatus;
}

export default function Statistics() {
  const navigate = useNavigate();
  const requirements = useAppStore((state) => state.requirements);
  const stores = useAppStore((state) => state.stores);
  const versions = useAppStore((state) => state.versions);
  const users = useAppStore((state) => state.users);
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const savedViews = useAppStore((state) => state.savedViews);
  const saveView = useAppStore((state) => state.saveView);
  const deleteView = useAppStore((state) => state.deleteView);
  const applyView = useAppStore((state) => state.applyView);
  const getUserById = useAppStore((state) => state.getUserById);

  const [selectedRegion, setSelectedRegion] = useState<string>(filters.region ? (Array.isArray(filters.region) ? filters.region[0] : filters.region) : 'all');
  const [selectedModule, setSelectedModule] = useState<string>(filters.module ? (Array.isArray(filters.module) ? filters.module[0] : filters.module) : 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(filters.status ? (Array.isArray(filters.status) ? filters.status[0] : filters.status) : 'all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>((filters.period as string) || 'all');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [selectedViewId, setSelectedViewId] = useState<string>('');

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

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: STATUS_LABELS.pending },
    { value: 'reviewing', label: STATUS_LABELS.reviewing },
    { value: 'approved', label: STATUS_LABELS.approved },
    { value: 'scheduled', label: STATUS_LABELS.scheduled },
    { value: 'developing', label: STATUS_LABELS.developing },
    { value: 'testing', label: STATUS_LABELS.testing },
    { value: 'released', label: STATUS_LABELS.released },
    { value: 'rejected', label: STATUS_LABELS.rejected },
    { value: 'deferred', label: STATUS_LABELS.deferred },
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
    status: selectedStatus,
    period: selectedPeriod,
  };

  const { filteredRequirements, totalCount, pendingCount, closedCount, avgResponseTime, avgCloseRate, topModule } = useMemo(() => {
    const filtered = requirements.filter(r => {
      if (selectedRegion !== 'all') {
        const store = stores.find(s => s.id === r.storeId);
        if (!store || store.region !== selectedRegion) return false;
      }
      if (selectedModule !== 'all' && r.module !== selectedModule) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;

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
      filteredRequirements: filtered,
      totalCount: total,
      pendingCount: pending,
      closedCount: closed,
      avgResponseTime: avgResponse,
      avgCloseRate: closeRate,
      topModule: top,
    };
  }, [requirements, stores, selectedRegion, selectedModule, selectedStatus, selectedPeriod]);

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
    const newFilters: Partial<FilterOptions> = {
      period: selectedPeriod === 'all' ? undefined : (selectedPeriod as FilterOptions['period']),
    };

    if (selectedRegion !== 'all') {
      newFilters.region = selectedRegion;
    }
    if (selectedModule !== 'all') {
      newFilters.module = selectedModule as ModuleType;
    }
    if (selectedStatus !== 'all') {
      newFilters.status = selectedStatus as RequirementStatus;
    }

    if (filter.region) {
      newFilters.region = filter.region;
    }
    if (filter.module) {
      newFilters.module = filter.module;
    }
    if (filter.status) {
      newFilters.status = filter.status;
    }

    setFilters(newFilters);
    setTimeout(() => {
      navigate('/board');
    }, 0);
  };

  const handleSaveView = () => {
    if (!viewName.trim()) return;

    const currentFilters: FilterOptions = {};
    if (selectedRegion !== 'all') currentFilters.region = selectedRegion;
    if (selectedModule !== 'all') currentFilters.module = selectedModule as ModuleType;
    if (selectedStatus !== 'all') currentFilters.status = selectedStatus as RequirementStatus;
    if (selectedPeriod !== 'all') currentFilters.period = selectedPeriod as FilterOptions['period'];

    setFilters(currentFilters);
    saveView(viewName.trim(), viewDescription.trim() || undefined);
    setViewName('');
    setViewDescription('');
    setShowSaveViewModal(false);
  };

  const handleApplyView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      applyView(viewId);
      setSelectedRegion(view.filters.region ? (Array.isArray(view.filters.region) ? view.filters.region[0] : view.filters.region) : 'all');
      setSelectedModule(view.filters.module ? (Array.isArray(view.filters.module) ? view.filters.module[0] : view.filters.module) : 'all');
      setSelectedStatus(view.filters.status ? (Array.isArray(view.filters.status) ? view.filters.status[0] : view.filters.status) : 'all');
      setSelectedPeriod((view.filters.period as string) || 'all');
      setSelectedViewId(viewId);
    }
  };

  const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个分析视角吗？')) {
      deleteView(viewId);
      if (selectedViewId === viewId) {
        setSelectedViewId('');
      }
    }
  };

  const buildFilterDescription = (view: SavedView) => {
    const parts: string[] = [];
    if (view.filters.period && view.filters.period !== 'all') {
      const periodLabels: Record<string, string> = { '7d': '近7天', '30d': '近30天', '90d': '近90天' };
      parts.push(periodLabels[view.filters.period] || '全部时间');
    }
    if (view.filters.region) {
      const r = Array.isArray(view.filters.region) ? view.filters.region[0] : view.filters.region;
      parts.push(`${r}区域`);
    }
    if (view.filters.module) {
      const m = Array.isArray(view.filters.module) ? view.filters.module[0] : view.filters.module;
      parts.push(MODULE_LABELS[m] || m);
    }
    if (view.filters.status) {
      const s = Array.isArray(view.filters.status) ? view.filters.status[0] : view.filters.status;
      parts.push(STATUS_LABELS[s] || s);
    }
    return parts.length > 0 ? parts.join(' · ') : '全部数据';
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
      handleDrillDown({ region: params.value });
    } else if (params.name && regions.includes(params.name)) {
      handleDrillDown({ region: params.name });
    }
  };

  const onModuleChartClick = (params: any) => {
    if (params.name) {
      const moduleKey = Object.entries(MODULE_LABELS).find(([_, l]) => l === params.name)?.[0] as ModuleType;
      if (moduleKey) {
        handleDrillDown({ module: moduleKey });
      }
    }
  };

  const onStatusChartClick = (params: any) => {
    if (params.componentType === 'xAxis' || params.name) {
      const statusLabel = params.value || params.name;
      const statusKey = StatusLabelsMap[statusLabel] || statusLabel;
      if (statusKey) {
        handleDrillDown({ status: statusKey as RequirementStatus });
      }
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计报表</h1>
          <p className="text-sm text-gray-500 mt-1">多维度分析门店诉求，跟踪闭环效果 · 点击图表可跳转看板查看明细，筛选条件自动保留</p>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <div className="flex items-center gap-3">
            {savedViews.length > 0 && (
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#1e3a5f]" />
                <Select
                  placeholder="选择分析视角"
                  value={selectedViewId}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleApplyView(e.target.value);
                    } else {
                      setSelectedViewId('');
                    }
                  }}
                  options={[
                    { value: '', label: '自定义' },
                    ...savedViews.map(v => ({ value: v.id, label: v.name })),
                  ]}
                  className="w-44 h-9 text-sm"
                />
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSaveViewModal(true)}
            >
              <BookmarkPlus className="w-4 h-4 mr-1.5" />
              保存视角
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-1.5" />
              导出报表
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select
              value={selectedPeriod}
              onChange={(e) => { setSelectedPeriod(e.target.value); setSelectedViewId(''); }}
              options={periodOptions}
              className="w-28 h-9 text-sm"
            />
            <Select
              value={selectedRegion}
              onChange={(e) => { setSelectedRegion(e.target.value); setSelectedViewId(''); }}
              options={regionOptions}
              className="w-28 h-9 text-sm"
            />
            <Select
              value={selectedModule}
              onChange={(e) => { setSelectedModule(e.target.value); setSelectedViewId(''); }}
              options={moduleOptions}
              className="w-28 h-9 text-sm"
            />
            <Select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setSelectedViewId(''); }}
              options={statusOptions}
              className="w-28 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {savedViews.length > 0 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {savedViews.map((view) => {
            const creator = getUserById(view.createdBy);
            const isActive = selectedViewId === view.id;
            return (
              <div
                key={view.id}
                onClick={() => handleApplyView(view.id)}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#1e3a5f]/10 border-[#1e3a5f]/30'
                    : 'bg-white border-gray-200 hover:border-[#1e3a5f]/30 hover:bg-gray-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isActive ? 'text-[#1e3a5f]' : 'text-gray-400'}`} />
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${isActive ? 'text-[#1e3a5f]' : 'text-gray-700'}`}>
                    {view.name}
                  </span>
                  <span className="text-xs text-gray-500">{buildFilterDescription(view)}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteView(e, view.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="删除"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

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

      <StatsTable filters={chartFilters} />

      <Modal
        isOpen={showSaveViewModal}
        onClose={() => setShowSaveViewModal(false)}
        title="保存分析视角"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSaveViewModal(false)}>取消</Button>
            <Button onClick={handleSaveView} disabled={!viewName.trim()}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Input
              label="视角名称"
              placeholder="如：华东区会员模块近30天"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Textarea
              label="描述说明（可选）"
              placeholder="描述这个分析视角的用途..."
              value={viewDescription}
              onChange={(e) => setViewDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">将保存当前筛选组合：</p>
            <p className="text-sm text-gray-700">
              {selectedPeriod !== 'all' && `${selectedPeriod === '7d' ? '近7天' : selectedPeriod === '30d' ? '近30天' : '近90天'} · `}
              {selectedRegion !== 'all' && `${selectedRegion}区域 · `}
              {selectedModule !== 'all' && `${MODULE_LABELS[selectedModule as keyof typeof MODULE_LABELS]} · `}
              {selectedStatus !== 'all' && `${STATUS_LABELS[selectedStatus as keyof typeof STATUS_LABELS]} · `}
              <span className="text-[#1e3a5f] font-medium">{totalCount} 条数据</span>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

