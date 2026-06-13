import { Search, Filter, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { STATUS_LABELS, MODULE_LABELS, PRIORITY_LABELS, REGIONS } from '@/utils/constants';
import type { RequirementStatus, ModuleType, Priority, FilterOptions } from '@/types';

export function FilterBar() {
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const users = useAppStore((state) => state.users);

  const getFilterValue = (val: FilterOptions['status'] | FilterOptions['module'] | FilterOptions['region'] | FilterOptions['priority'] | FilterOptions['assigneeId']): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val[0] || '';
    return val;
  };

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
  const moduleOptions = Object.entries(MODULE_LABELS).map(([value, label]) => ({ value, label }));
  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
  const regionOptions = REGIONS.map((r) => ({ value: r, label: r }));
  const userOptions = users.filter(u => u.role === 'product_manager').map(u => ({ value: u.id, label: u.name }));

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== ''));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">筛选条件</span>
          {hasActiveFilters && (
            <span className="text-xs text-[#1e3a5f] bg-[#1e3a5f]/10 px-2 py-0.5 rounded-full">
              已应用筛选
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <RotateCcw className="w-4 h-4" />
          重置
        </Button>
      </div>
      
      <div className="grid grid-cols-6 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索需求..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9"
          />
        </div>
        
        <Select
          placeholder="选择状态"
          value={getFilterValue(filters.status)}
          onChange={(e) => setFilters({ status: e.target.value ? [e.target.value as RequirementStatus] : undefined })}
          options={statusOptions}
        />
        
        <Select
          placeholder="选择模块"
          value={getFilterValue(filters.module)}
          onChange={(e) => setFilters({ module: e.target.value ? [e.target.value as ModuleType] : undefined })}
          options={moduleOptions}
        />
        
        <Select
          placeholder="选择区域"
          value={getFilterValue(filters.region)}
          onChange={(e) => setFilters({ region: e.target.value ? [e.target.value] : undefined })}
          options={regionOptions}
        />
        
        <Select
          placeholder="选择优先级"
          value={getFilterValue(filters.priority)}
          onChange={(e) => setFilters({ priority: e.target.value ? [e.target.value as Priority] : undefined })}
          options={priorityOptions}
        />
        
        <Select
          placeholder="负责人"
          value={getFilterValue(filters.assigneeId)}
          onChange={(e) => setFilters({ assigneeId: e.target.value ? [e.target.value] : undefined })}
          options={userOptions}
        />
      </div>
    </div>
  );
}
