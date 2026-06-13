import type { User } from '@/types';

export const mockUsers: User[] = [
  { id: 'u001', name: '张伟', role: 'store_manager', email: 'zhangwei@store1.com', storeId: 's001' },
  { id: 'u002', name: '李娜', role: 'store_manager', email: 'lina@store5.com', storeId: 's005' },
  { id: 'u003', name: '王芳', role: 'store_manager', email: 'wangfang@store7.com', storeId: 's007' },
  { id: 'u004', name: '陈明', role: 'product_manager', email: 'chenming@hq.com' },
  { id: 'u005', name: '刘海', role: 'product_manager', email: 'liuhai@hq.com' },
  { id: 'u006', name: '赵丽', role: 'reviewer', email: 'zhaoli@hq.com' },
  { id: 'u007', name: '孙强', role: 'version_manager', email: 'sunqiang@hq.com' },
  { id: 'u008', name: '周杰', role: 'developer', email: 'zhoujie@tech.com' },
  { id: 'u009', name: '吴敏', role: 'tester', email: 'wumin@tech.com' },
  { id: 'u010', name: '郑凯', role: 'executive', email: 'zhengkai@hq.com' },
];
