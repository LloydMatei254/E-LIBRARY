import React from 'react';
import { BookOpen, ShieldCheck, User, LogIn, UserPlus } from 'lucide-react';
import { Member, Admin } from '../../types';

export type PublicPage = 'home' | 'catalogue' | 'categories' | 'bestsellers';

interface PublicHeaderProps {
  activePage: PublicPage;
  onNavigate: (page: PublicPage) => void;
  onOpenMemberAuth: () => void;
  onOpenAdminAuth: () => void;
  onOpenDefense: () => void;
  onGoToMemberPortal?: () => void;
  onGoToAdminPanel?: () => void;
  memberUser: Member | null;
  adminUser: Admin | null;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activePage,
  onNavigate,
  onOpenMemberAuth,
  onOpenAdminAuth,
  onOpenDefense,
  onGoToMemberPortal,
  onGoToAdminPanel,
  memberUser,
  adminUser,
}) => {
  return (
    <>
      {/* 1. Top Utility Announcement Bar */}
      <div className="bg-[#18211E] text-slate-200 text-[11px] py-1.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <span className="hidden sm:inline-block font-medium text-amber-200/90">
            Free borrowing & digital hold service for all registered students
          </span>
          <span className="mx-auto font-serif italic text-slate-300">
            Books that inspire, scholarship that endures.
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Desk: +254 712 345 678</span>
            <span className="text-white/20">|</span>
            <button
              onClick={onOpenDefense}
              className="text-amber-300 hover:text-white font-medium transition-colors"
            >
              CMT210 Defense (40 Marks)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header matching Page & Pine Luxury Layout */}
      <header className="bg-[#FAF8F5] border-b border-stone-200/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          {/* Brand Logo with Book Emblem */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus:outline-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2D3A34] text-amber-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-amber-300 stroke-[1.8]" />
            </div>
            <div>
              <span className="font-serif tracking-wider text-base font-bold text-[#1C2622] uppercase block">
                PAGE & PINE
              </span>
              <span className="text-[10px] tracking-widest text-stone-500 font-mono uppercase block -mt-1">
                E-LIBRARY & BOOKSHOP
              </span>
            </div>
          </button>

          {/* Navigation Links — Switch dedicated public pages without leaving webpage or logging in! */}
          <nav className="hidden lg:flex items-center gap-7 text-[12px] font-semibold tracking-wider text-stone-700 uppercase">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors pb-0.5 ${
                activePage === 'home'
                  ? 'text-[#1C2622] border-b-2 border-[#1C2622] font-bold'
                  : 'hover:text-[#1C2622]'
              }`}
            >
              HOME
            </button>
            <button
              onClick={() => onNavigate('catalogue')}
              className={`transition-colors pb-0.5 ${
                activePage === 'catalogue'
                  ? 'text-[#1C2622] border-b-2 border-[#1C2622] font-bold'
                  : 'hover:text-[#1C2622]'
              }`}
            >
              CATALOGUE
            </button>
            <button
              onClick={() => onNavigate('categories')}
              className={`transition-colors pb-0.5 ${
                activePage === 'categories'
                  ? 'text-[#1C2622] border-b-2 border-[#1C2622] font-bold'
                  : 'hover:text-[#1C2622]'
              }`}
            >
              CATEGORIES
            </button>
            <button
              onClick={() => onNavigate('bestsellers')}
              className={`transition-colors pb-0.5 ${
                activePage === 'bestsellers'
                  ? 'text-[#1C2622] border-b-2 border-[#1C2622] font-bold'
                  : 'hover:text-[#1C2622]'
              }`}
            >
              BESTSELLERS
            </button>
            <button
              onClick={onOpenDefense}
              className="hover:text-amber-800 transition-colors pb-0.5 text-amber-800 font-bold"
            >
              CMT210 DEFENSE
            </button>
          </nav>

          {/* User Sign In / Account Actions — Only path into authenticated internal system */}
          <div className="flex items-center gap-3 shrink-0">
            {memberUser ? (
              <button
                onClick={onGoToMemberPortal || onOpenMemberAuth}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-emerald-300 hover:border-emerald-400 text-xs font-semibold text-stone-800 bg-emerald-50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Patron: {memberUser.full_name}</span>
              </button>
            ) : adminUser ? (
              <button
                onClick={onGoToAdminPanel || onOpenAdminAuth}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1B1035] hover:bg-[#251747] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Panel</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenMemberAuth}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-800 hover:text-stone-900 border border-stone-300 hover:border-stone-400 rounded-lg transition-colors bg-white shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-600" />
                  <span>Member Login</span>
                </button>
                <button
                  onClick={onOpenMemberAuth}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#25332C] hover:bg-[#1A2520] rounded-lg transition-colors shadow-xs whitespace-nowrap flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Create Account</span>
                </button>
                <button
                  onClick={onOpenAdminAuth}
                  className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-100 whitespace-nowrap hidden sm:inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Staff Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
