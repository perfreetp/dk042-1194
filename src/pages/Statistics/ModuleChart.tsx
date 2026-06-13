import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import { MODULE_LABELS, MODULE_COLORS } from '@/utils/constants';

interface ModuleChartProps {
  height?: number;
}

export function ModuleChart({ height = 350 }: ModuleChartProps) {
  const requirements = useAppStore((state) => state.requirements);
  
  const option = useMemo(() => {
    const modules = Object.entries(MODULE_LABELS);
    
    const data = modules.map(([key, label]) => ({
      value: requirements.filter(r => r.module === key).length,
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
          },
          labelLine: {
            show: false,
          },
          data: data,
          color: modules.map(([key]) => MODULE_COLORS[key as keyof typeof MODULE_COLORS]),
        },
      ],
    };
  }, [requirements]);
  
  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
