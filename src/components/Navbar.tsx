import React, { useState } from 'react';
import { Book, Search, LogOut, ShieldCheck, User, Code2, ArrowLeftRight, X, Phone, Mail, Clock, MapPin, Info } from 'lucide-react';
import { Admin, Member } from '../types';

interface NavbarProps {
  currentView: 'catalogue' | 'issue-return' | 'admin' | 'member-portal' | 'presentation' | 'home';
  onNavigate: (view: any) => void;
  adminUser: Admin | null;
  memberUser: Member | null;
  onOpenMemberAuth: () => void;
  onOpenAdminAuth: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onSelectCategory?: (categoryId: number | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  adminUser,
  memberUser,
  onOpenMemberAuth,
  onOpenAdminAuth,
  onLogout,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
}) => {
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'catalogue' | 'categories' | 'about' | 'contact'>(
    currentView === 'home' ? 'home' : 'catalogue'
  );

  // Informational modals
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);

  const handleNavClick = (tab: 'home' | 'catalogue' | 'categories' | 'about' | 'contact') => {
    setActiveNavTab(tab);
    if (tab === 'home') {
      onNavigate('home');
    } else if (tab === 'catalogue') {
      onNavigate('catalogue');
    } else if (tab === 'categories') {
      setIsCategoriesDropdownOpen(true);
    } else if (tab === 'about') {
      setIsAboutOpen(true);
    } else if (tab === 'contact') {
      setIsContactOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
      if (currentView !== 'catalogue') {
        onNavigate('catalogue');
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Top utility row from Deliverable 2 Page 1 wireframe */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 mb-2 border-b border-slate-100">
          <span className="font-normal italic text-slate-400 hidden sm:inline-block">
            online library system
          </span>

          <div className="flex items-center gap-3 ml-auto text-xs">
            {/* Quick access to Circulation Desk and Marking Defense */}
            <button
              onClick={() => onNavigate('issue-return')}
              className="text-slate-600 hover:text-blue-600 transition-colors hidden md:flex items-center gap-1 font-medium"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
              <span>Issue & Return Desk</span>
            </button>

            <button
              onClick={() => onNavigate('presentation')}
              className="text-amber-700 hover:text-amber-800 transition-colors hidden md:flex items-center gap-1 font-semibold"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>CMT210 Marking Defense</span>
            </button>

            {adminUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => onNavigate('admin')}
                  className="font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin: {adminUser.full_name}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : memberUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => onNavigate('member-portal')}
                  className="font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>{memberUser.full_name}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenMemberAuth}
                  className="px-2.5 py-1 text-slate-700 hover:text-blue-600 font-medium transition-colors border border-slate-200 rounded hover:bg-slate-50"
                >
                  Login
                </button>
                <button
                  onClick={onOpenMemberAuth}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors shadow-2xs"
                >
                  Register
                </button>
                <button
                  onClick={onOpenAdminAuth}
                  className="px-2.5 py-1 text-slate-700 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 text-[11px]"
                >
                  Staff
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Exact Header Bar matching image_81093cb3.png */}
        <div className="flex items-center justify-between gap-6 py-1">
          {/* Left Brand: [📖] E-library in blue */}
          <button
            onClick={() => {
              setActiveNavTab('catalogue');
              onNavigate('catalogue');
            }}
            className="flex items-center gap-2 text-left focus:outline-none group"
          >
            <Book className="w-5 h-5 text-blue-500 stroke-[2.2] group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-blue-500 group-hover:text-blue-600 transition-colors">
              E-library
            </span>
          </button>

          {/* Right Nav Links: Home  Catalogue  Categories  About  Contact */}
          <nav className="flex items-center gap-6 sm:gap-8 text-sm">
            <button
              onClick={() => handleNavClick('home')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeNavTab === 'home' && currentView === 'home'
                  ? 'text-blue-500 font-semibold border-b-2 border-blue-500'
                  : 'text-slate-700 hover:text-blue-600 font-medium'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNavClick('catalogue')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeNavTab === 'catalogue' && currentView === 'catalogue'
                  ? 'text-blue-500 font-semibold border-b-2 border-blue-500'
                  : 'text-slate-700 hover:text-blue-600 font-medium'
              }`}
            >
              Catalogue
            </button>

            <button
              onClick={() => handleNavClick('categories')}
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap shrink-0 pb-1"
            >
              Categories
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap shrink-0 pb-1"
            >
              About
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className="text-slate-700 hover:text-blue-600 font-medium transition-colors whitespace-nowrap shrink-0 pb-1"
            >
              Contact
            </button>
          </nav>
        </div>

        {/* Exact Search Bar matching image_81093cb3.png */}
        <div className="mt-3 mb-1">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="search"
              className="w-full pl-9 pr-20 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-2xs text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  onSearchSubmit();
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                onSearchSubmit();
                if (currentView !== 'catalogue') onNavigate('catalogue');
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Categories Quick Filter Dropdown */}
      {isCategoriesDropdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsCategoriesDropdownOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">
              Select Book Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Browse academic classifications directly from the relational database:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: null, name: 'All Categories' },
                { id: 1, name: 'Technology' },
                { id: 2, name: 'Science' },
                { id: 3, name: 'Business' },
                { id: 4, name: 'Literature' },
                { id: 5, name: 'History' },
              ].map((c) => (
                <button
                  key={String(c.id)}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(c.id);
                    setIsCategoriesDropdownOpen(false);
                    onNavigate('catalogue');
                  }}
                  className="p-3 text-left border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg transition-colors text-xs font-semibold text-slate-800"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Book className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-bold text-slate-900">
                About Berzowanley E-library
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              A comprehensive online library management system with member portal, catalog search, and administrative tools.
            </p>
            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Architecture:</span>
                <span className="font-semibold text-slate-900 font-mono">Python 3.10 OOP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DBMS:</span>
                <span className="font-semibold text-slate-900 font-mono">SQLite3 (10 Relational Schemas)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Default Loan Period:</span>
                <span className="font-semibold text-slate-900">14 Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overdue Penalty:</span>
                <span className="font-semibold text-slate-900">KES 50.00 / day</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAboutOpen(false);
                onNavigate('presentation');
              }}
              className="mt-4 w-full py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              View CMT210 Marking Defense & OOP Architecture &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Contact Library Desk
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              For loan extensions, catalog inquiries, or overdue fine disputes:
            </p>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>librarian@library.ac.ke</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>+254 20 123 4567 / +254 712 345 678</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Monday – Friday: 08:00 AM – 09:00 PM</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Main Campus Complex, Block C Stacks</span>
              </div>
            </div>
            <button
              onClick={() => setIsContactOpen(false)}
              className="mt-5 w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
