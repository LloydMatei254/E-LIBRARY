import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  UserCheck,
  Users,
  RotateCcw,
  Calendar,
  Banknote,
  FileText,
  Settings,
  ArrowLeft,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'books'
  | 'categories'
  | 'authors'
  | 'members'
  | 'circulation'
  | 'reservations'
  | 'fines'
  | 'reports'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitToCatalogue: () => void;
  onOpenDefense: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onExitToCatalogue,
  onOpenDefense,
}) => {
  return (
    <aside className="w-64 bg-[#1b1035] text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-indigo-950/60 select-none">
      {/* Exact Header matching image_fce03829.png */}
      <div className="pt-6 pb-5 px-6">
        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span>E-library Admin</span>
        </h1>
      </div>

      {/* Navigation List strictly formatted as shown in image_fce03829.png */}
      <nav className="flex-1 px-3 space-y-1 text-xs">
        {/* Item 1: Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'dashboard'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Dashboard</span>
        </button>

        {/* Item 2: Manage books */}
        <button
          onClick={() => onSelectTab('books')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'books'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Manage books</span>
        </button>

        {/* Item 3: Categories */}
        <button
          onClick={() => onSelectTab('categories')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'categories'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Categories</span>
        </button>

        {/* Item 4: Authors */}
        <button
          onClick={() => onSelectTab('authors')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'authors'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Authors</span>
        </button>

        {/* Item 5: Members */}
        <button
          onClick={() => onSelectTab('members')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'members'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Members</span>
        </button>

        {/* Operations Section Header */}
        <div className="pt-6 pb-2 px-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/60">
            OPERATIONS
          </span>
        </div>

        {/* Item 6: Issue/Return */}
        <button
          onClick={() => onSelectTab('circulation')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'circulation'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <RotateCcw className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Issue/Return</span>
        </button>

        {/* Item 7: Reservations */}
        <button
          onClick={() => onSelectTab('reservations')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'reservations'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Reservations</span>
        </button>

        {/* Item 8: Fines */}
        <button
          onClick={() => onSelectTab('fines')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'fines'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <Banknote className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Fines</span>
        </button>

        {/* Item 9: Reports */}
        <button
          onClick={() => onSelectTab('reports')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'reports'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Reports</span>
        </button>

        {/* Item 10: Settings */}
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-colors font-medium ${
            currentTab === 'settings'
              ? 'bg-[#311f5e] text-white shadow-xs'
              : 'text-indigo-100/75 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0 text-indigo-300" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Return to the public catalogue */}
      <div className="p-3 border-t border-indigo-950/80 space-y-1.5 text-xs">
        <button
          onClick={onExitToCatalogue}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-indigo-200/70 hover:text-white hover:bg-white/5 transition-colors font-medium text-[11px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Public Catalogue View</span>
        </button>
      </div>
    </aside>
  );
};
