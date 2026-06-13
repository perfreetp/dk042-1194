import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store';
import type { Requirement } from '@/types';

interface ChartFilters {
  region: string;
  module: string;
  period: string;
}

interface ResponseTimeChartProps {
  height?: number;
  filters?: ChartFilters;
}

function calculateResponseTime(req: Requirement): number {
  if (!req.reviewTime) return -1;
  const start = new Date(req.createdAt).getTime();
  const end = new Date(req.reviewTime).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export function ResponseTimeChart({ height = 350, filters }: ResponseTimeChartProps) {
  const requirements = useAppStore((state) => state.requirements);
  const stores = useAppStore((state) => state.stores);

  const filteredRequirements = useMemo(() => {
    let result = requirements.filter(r => !r.isHidden && r.reviewTime);
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
    return result;
  }, [requirements, stores, filters]);
  
  const option = useMemo(() => {
    const reviewedReqs = filteredRequirements;
    
    const timeRanges = [
      { min: 0, max: 1, label: '1天内' },
      { min: 1, max: 3, label: '1-3天' },
      { min: 3, max: 7, label: '3-7天' },
      { min: 7, max: 14, label: '7-14天' },
      { min: 14, max: 30, label: '14-30天' },
      { min: 30, max: Infinity, label: '30天以上' },
    ];
    
    const filteredRegions = filters?.region && filters.region !== 'all'
      ? [filters.region]
      : Array.from(new Set(stores.map(s => s.region)));
    
    const avgTimeByRegion = filteredRegions.map(region => {
      const regionStores = stores.filter(s => s.region === region).map(s => s.id);
      const regionReqs = reviewedReqs.filter(r => regionStores.includes(r.storeId));
      
      if (regionReqs.length === 0) return { region, avg: 0, count: 0 };
      
      const totalDays = regionReqs.reduce((sum, r) => sum + calculateResponseTime(r), 0);
      return {
        region,
        avg: Math.round(totalDays / regionReqs.length * 10) / 10,
        count: regionReqs.length,
      };
    });
    
    const distribution = timeRanges.map(range => ({
      ...range,
      count: reviewedReqs.filter(r => {
        const days = calculateResponseTime(r);
        return days >= range.min && days < range.max;
      }).length,
    }));
    
    const avgTime = reviewedReqs.length > 0
      ? Math.round(reviewedReqs.reduce((sum, r) => sum + calculateResponseTime(r), 0) / reviewedReqs.length * 10) / 10
      : 0;
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          if (Array.isArray(params)) {
            return params.map((p: any) => `${p.seriesName}: ${p.value}${p.seriesName.includes('平均') ? '天' : '个'}`).join('<br/>');
          }
          return '';
        },
      },
      legend: {
        data: ['响应时长分布', '各区域平均响应时长'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: distribution.map(d => d.label),
          axisLabel: {
            fontSize: 11,
          },
        },
        {
          type: 'category',
          data: avgTimeByRegion.map(d => d.region),
          axisLabel: {
            fontSize: 11,
          },
          position: 'top',
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: '需求数',
          nameTextStyle: {
            fontSize: 12,
            color: '#666',
          },
        },
        {
          type: 'value',
          name: '天数',
          nameTextStyle: {
            fontSize: 12,
            color: '#666',
          },
        },
      ],
      series: [
        {
          name: '响应时长分布',
          type: 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: distribution.map(d => d.count),
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '40%',
        },
        {
          name: '各区域平均响应时长',
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: avgTimeByRegion.map(d => d.avg),
          smooth: true,
          lineStyle: {
            width: 2,
            color: '#f59e0b',
          },
          itemStyle: {
            color: '#f59e0b',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.05)' },
              ],
            },
          },
          markLine: {
            silent: true,
            data: [
              {
                yAxis: avgTime,
                label: {
                  formatter: `平均: ${avgTime}天`,
                  fontSize: 11,
                },
                lineStyle: {
                  type: 'dashed',
                  color: '#ef4444',
                },
              },
            ],
          },
        },
      ],
    };
  }, [filteredRequirements, stores, filters]);
  
  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
