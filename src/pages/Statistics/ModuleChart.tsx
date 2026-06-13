import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { MODULE_LABELS, MODULE_COLORS } from '@/utils/constants';

interface ChartFilters {
  region: string;
  module: string;
  period: string;
}

interface ModuleChartProps {
  height?: number;
  filters?: ChartFilters;
  onChartClick?: (params: any) => void;
}

export function ModuleChart({ height = 350, filters, onChartClick }: ModuleChartProps) {
  const requirements = useAppStore((state) => state.requirements);
  const stores = useAppStore((state) => state.stores);

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
    return result;
  }, [requirements, stores, filters]);

  const option = useMemo(() => {
    const modules = Object.entries(MODULE_LABELS);

    let filteredModules = modules;
    if (filters?.module && filters.module !== 'all') {
      filteredModules = modules.filter(([k]) => k === filters.module);
    }

    const data = filteredModules.map(([key, label]) => ({
      value: filteredRequirements.filter(r => r.module === key).length,
      name: label,
    })).filter(d => d.value > 0);

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}个 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: '模块分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}\n{c}个',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          labelLine: {
            show: false,
          },
          data: data.length > 0 ? data : [{ value: 1, name: '暂无数据' }],
          color: data.length > 0 ? filteredModules.map(([key]) => MODULE_COLORS[key as keyof typeof MODULE_COLORS]) : ['#e5e7eb'],
        },
      ],
    };
  }, [filteredRequirements, filters]);

  const onEvents = onChartClick ? {
    click: onChartClick,
  } : undefined;

  return (
    <ReactECharts
      option={option}
      style={{ height, cursor: onChartClick ? 'pointer' : 'default' }}
      opts={{ renderer: 'canvas' }}
      onEvents={onEvents}
    />
  );
}

