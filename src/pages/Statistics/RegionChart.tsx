import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { MODULE_LABELS } from '@/utils/constants';

interface ChartFilters {
  region: string;
  module: string;
  period: string;
}

interface RegionChartProps {
  height?: number;
  filters?: ChartFilters;
  onChartClick?: (params: any) => void;
}

export function RegionChart({ height = 350, filters, onChartClick }: RegionChartProps) {
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
    if (filters?.module && filters.module !== 'all') {
      result = result.filter(r => r.module === filters.module);
    }
    return result;
  }, [requirements, filters]);

  const option = useMemo(() => {
    const regionSet = new Set(stores.map(s => s.region));
    let regions = Array.from(regionSet);
    if (filters?.region && filters.region !== 'all') {
      regions = regions.filter(r => r === filters.region);
    }

    const modules = Object.keys(MODULE_LABELS);

    const seriesData = modules.map(module => ({
      name: MODULE_LABELS[module as keyof typeof MODULE_LABELS],
      type: 'bar',
      stack: 'total',
      emphasis: {
        focus: 'series',
      },
      data: regions.map(region => {
        const regionStores = stores.filter(s => s.region === region).map(s => s.id);
        return filteredRequirements.filter(r =>
          regionStores.includes(r.storeId) && r.module === module
        ).length;
      }),
    }));

    const totalByRegion = regions.map(region => {
      const regionStores = stores.filter(s => s.region === region).map(s => s.id);
      return filteredRequirements.filter(r => regionStores.includes(r.storeId)).length;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: modules.map(m => MODULE_LABELS[m as keyof typeof MODULE_LABELS]),
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: regions.map(r => r),
        axisLabel: {
          rotate: 0,
          fontSize: 12,
          color: '#1e3a5f',
        },
        axisLine: {
          lineStyle: {
            color: '#1e3a5f',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '需求数',
        nameTextStyle: {
          fontSize: 12,
          color: '#666',
        },
      },
      series: [
        ...seriesData,
        {
          name: '总计',
          type: 'line',
          data: totalByRegion,
          smooth: true,
          lineStyle: {
            width: 2,
            color: '#1e3a5f',
          },
          itemStyle: {
            color: '#1e3a5f',
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 11,
          },
        },
      ],
    };
  }, [filteredRequirements, stores, filters]);

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

