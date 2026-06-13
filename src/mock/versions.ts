import type { Version, Announcement } from '@/types';

export const mockVersions: Version[] = [
  {
    id: 'v001',
    name: 'V2.1.0 收银优化版',
    status: 'released',
    startDate: '2026-05-01',
    releaseDate: '2026-06-10',
    description: '主要优化收银模块性能和会员集成功能',
  },
  {
    id: 'v002',
    name: 'V2.2.0 库存管理版',
    status: 'testing',
    startDate: '2026-06-01',
    releaseDate: '2026-07-15',
    description: '库存预警、智能补货、批次管理',
  },
  {
    id: 'v003',
    name: 'V2.3.0 会员营销版',
    status: 'developing',
    startDate: '2026-06-15',
    releaseDate: '2026-08-01',
    description: '会员等级、积分商城、营销活动',
  },
  {
    id: 'v004',
    name: 'V2.4.0 数据分析版',
    status: 'planning',
    startDate: '2026-07-15',
    releaseDate: '2026-09-01',
    description: '多维度报表、实时看板、智能分析',
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'a001',
    versionId: 'v001',
    title: 'V2.1.0 版本正式上线公告',
    content: 'V2.1.0 版本已于今日正式上线，包含以下功能：1. 收银速度提升30%；2. 会员扫码快速识别；3. 支持多种支付方式组合。如有问题请联系技术支持。',
    publishedAt: '2026-06-10 10:00:00',
  },
];
