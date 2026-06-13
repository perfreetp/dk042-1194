import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';

interface ChartFilters {
  region: string;
  module: string;
  period: string;
}

interface StatusChartProps {
  height?: number;
  filters?: ChartFilters;
  onChartClick?: (params: any) => void;
}

export function StatusChart({ height = 350, filters, onChartClick }: StatusChartProps) {
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
    const statuses = Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[];

    const statusList = ['pending', 'reviewing', 'approved', 'scheduled', 'developing', 'testing', 'released', 'rejected'];

    let regions = Array.from(new Set(stores.map(s => s.region)));
    if (filters?.region && filters.region !== 'all') {
      regions = regions.filter(r => r === filters.region);
    }

    const series = regions.map(region => {
      const regionStores = stores.filter(s => s.region === region).map(s => s.id);
      const regionReqs = filteredRequirements.filter(r => regionStores.includes(r.storeId));

      return {
        name: region,
        type: 'bar',
        barGap: '10%',
        data: statusList.map(status =>
          regionReqs.filter(r => r.status === status).length
        ),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: regions,
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
        data: statusList.map(s => STATUS_LABELS[s]),
        axisLabel: {
          fontSize: 11,
          rotate: 30,
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
      series: series.length > 0 ? series : [{
        name: '暂无数据',
        type: 'bar',
        data: statusList.map(() => 0),
        itemStyle: { color: '#e5e7eb' },
      }],
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

