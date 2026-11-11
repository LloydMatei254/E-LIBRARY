import React, { useState } from 'react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminDashboard } from '../AdminDashboard';
import { ManageBooks } from '../ManageBooks';
import { ManageMembers } from '../ManageMembers';
import { IssueReturnDesk } from '../IssueReturnDesk';
import { CategoriesView } from './CategoriesView';
import { AuthorsView } from './AuthorsView';
import { ReservationsView } from './ReservationsView';
import { FinesView } from './FinesView';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';
import { Admin } from '../../types';
import { LogOut, UserCheck } from 'lucide-react';

interface AdminLayoutProps {
  adminUser: Admin;
  initialTab?: AdminTab;
  onLogout: () => void;
  onExitToCatalogue: () => void;
  onOpenDefense: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  adminUser,
  initialTab = 'dashboard',
  onLogout,
  onExitToCatalogue,
  onOpenDefense,
}) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>(initialTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Exact Dark Purple Sidebar from image_fce03829.png */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onExitToCatalogue={onExitToCatalogue}
        onOpenDefense={onOpenDefense}
      />

      {/* Main Admin Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar strictly matching Deliverable 2 Section 3 Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="text-slate-400">https://www.e-library.com/admin/{currentTab}</span>
          </div>

          {/* Right Header Zone: Admin Name + Logout button matching Deliverable 2 */}
          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-slate-700">
              Admin: {adminUser.full_name}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <AdminDashboard
              adminUser={adminUser}
              onNavigateSubview={(subview) => {
                if (subview === 'books') setCurrentTab('books');
                else if (subview === 'members') setCurrentTab('members');
                else if (subview === 'circulation') setCurrentTab('circulation');
              }}
            />
          )}

          {currentTab === 'books' && <ManageBooks />}

          {currentTab === 'categories' && <CategoriesView />}

          {currentTab === 'authors' && <AuthorsView />}

          {currentTab === 'members' && <ManageMembers />}

          {currentTab === 'circulation' && <IssueReturnDesk />}

          {currentTab === 'reservations' && <ReservationsView />}

          {currentTab === 'fines' && <FinesView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};
