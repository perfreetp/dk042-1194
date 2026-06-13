import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';

interface StatusChartProps {
  height?: number;
}

export function StatusChart({ height = 350 }: StatusChartProps) {
  const requirements = useAppStore((state) => state.requirements);
  const stores = useAppStore((state) => state.stores);
  
  const option = useMemo(() => {
    const statuses = Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[];
    
    const statusList = ['pending', 'reviewing', 'approved', 'scheduled', 'developing', 'testing', 'released', 'rejected'];
    
    const regions = Array.from(new Set(stores.map(s => s.region)));
    
    const series = regions.map(region => {
      const regionStores = stores.filter(s => s.region === region).map(s => s.id);
      const regionReqs = requirements.filter(r => regionStores.includes(r.storeId));
      
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
      series: series,
    };
  }, [requirements, stores]);
  
  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
