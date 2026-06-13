import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatsCards } from './StatsCards';
import { FilterBar } from './FilterBar';
import { RequirementTable } from './RequirementTable';
import { Button } from '@/components/ui/Button';

export default function Board() {
  const navigate = useNavigate();
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">需求看板</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有门店提交的需求，支持多维度筛选和搜索</p>
        </div>
        <Button onClick={() => navigate('/submit')}>
          <Plus className="w-4 h-4" />
          新建需求
        </Button>
      </div>
      
      <StatsCards />
      <FilterBar />
      <RequirementTable />
    </div>
  );
}
