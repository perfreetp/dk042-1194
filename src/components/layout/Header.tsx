import { Bell, Search, User, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';

const pageTitles: Record<string, string> = {
  '/': '需求看板',
  '/submit': '提交需求',
  '/review': '评审会议',
  '/schedule': '版本排期',
  '/statistics': '统计报表',
};

export function Header() {
  const location = useLocation();
  const currentUser = useAppStore((state) => state.currentUser);
  
  const currentPath = Object.keys(pageTitles).find(
    (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  ) || '/';
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">首页</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{pageTitles[currentPath]}</span>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索需求..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] w-64 transition-colors"
          />
        </div>
        
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
            <User className="w-5 h-5 text-[#1e3a5f]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{currentUser?.name || '用户'}</p>
            <p className="text-xs text-gray-500">产品经理</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
