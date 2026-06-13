import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '需求看板', icon: LayoutDashboard },
  { path: '/submit', label: '提交需求', icon: FilePlus },
  { path: '/review', label: '评审会议', icon: Users },
  { path: '/schedule', label: '版本排期', icon: Calendar },
  { path: '/statistics', label: '统计报表', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-[#1e3a5f] text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-5 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-wide">需求管理系统</h1>
        <p className="text-xs text-white/60 mt-1">连锁门店总部版</p>
      </div>
      
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full">
          <Settings className="w-5 h-5" />
          <span>系统设置</span>
        </button>
      </div>
    </aside>
  );
}
