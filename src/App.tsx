import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { PublicCataloguePage } from './components/public/PublicCataloguePage';
import { PublicCategoriesPage } from './components/public/PublicCategoriesPage';
import { PublicBestsellersPage } from './components/public/PublicBestsellersPage';
import { PublicPage } from './components/public/PublicHeader';
import { CatalogueView } from './components/CatalogueView';
import { IssueReturnDesk } from './components/IssueReturnDesk';
import { MemberPortal } from './components/MemberPortal';
import { PresentationMode } from './components/PresentationMode';
import { MemberAuthModal } from './components/MemberAuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { BookDetailsModal } from './components/BookDetailsModal';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminTab } from './components/admin/AdminSidebar';
import { Book, Category, Admin, Member } from './types';
import { api } from './services/api';
import { ShieldAlert, BookOpen, Code2 } from 'lucide-react';

export default function App() {
  // Public pages ('landing', 'public-catalogue', 'public-categories', 'public-bestsellers')
  // Internal authenticated views ('catalogue', 'issue-return', 'admin', 'member-portal', 'presentation')
  const [currentView, setCurrentView] = useState<
    | 'landing'
    | 'public-catalogue'
    | 'public-categories'
    | 'public-bestsellers'
    | 'catalogue'
    | 'issue-return'
    | 'admin'
    | 'member-portal'
    | 'presentation'
  >('landing');

  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('dashboard');

  // Global books and categories state
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search and category filter state shared with Navbar and CatalogueView
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Authenticated states (initially null or patrons can log in / sign up)
  const [adminUser, setAdminUser] = useState<Admin | null>(null);
  const [memberUser, setMemberUser] = useState<Member | null>(null);

  // Modals
  const [isMemberAuthOpen, setIsMemberAuthOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [bList, cList] = await Promise.all([api.getBooks(), api.getCategories()]);
        setBooks(bList);
        setCategories(cList);
      } catch (err) {
        console.error('Error fetching initial library data:', err);
      }
    };
    init();
  }, []);

  const handlePublicNavigate = (page: PublicPage) => {
    if (page === 'home') setCurrentView('landing');
    else if (page === 'catalogue') setCurrentView('public-catalogue');
    else if (page === 'categories') setCurrentView('public-categories');
    else if (page === 'bestsellers') setCurrentView('public-bestsellers');
  };

  const handleLogout = () => {
    if (currentView === 'admin') {
      setAdminUser(null);
      setCurrentView('landing');
    } else {
      setMemberUser(null);
      setCurrentView('landing');
    }
  };

  const handleNavigate = (view: any) => {
    if (view === 'home' || view === 'landing') {
      setCurrentView('landing');
    } else if (view === 'admin-dashboard' || view === 'admin') {
      if (adminUser) {
        setAdminInitialTab('dashboard');
        setCurrentView('admin');
      } else {
        setIsAdminAuthOpen(true);
      }
    } else if (view === 'admin-books') {
      if (adminUser) {
        setAdminInitialTab('books');
        setCurrentView('admin');
      } else {
        setIsAdminAuthOpen(true);
      }
    } else if (view === 'admin-members') {
      if (adminUser) {
        setAdminInitialTab('members');
        setCurrentView('admin');
      } else {
        setIsAdminAuthOpen(true);
      }
    } else {
      setCurrentView(view);
    }
  };

  const handleBorrowBook = async (book: Book) => {
    if (!memberUser) {
      setIsMemberAuthOpen(true);
      return;
    }
    try {
      await api.issueBook(String(memberUser.member_id), String(book.book_id));
      alert(`Successfully borrowed "${book.title}"! Due date: 14 days from today.`);
      const updated = await api.getBooks();
      setBooks(updated);
    } catch (err: any) {
      alert(err.message || 'Borrow failed');
    }
  };

  const handleReserveBook = async (book: Book) => {
    if (!memberUser) {
      setIsMemberAuthOpen(true);
      return;
    }
    try {
      await api.createReservation(memberUser.member_id, book.book_id);
      alert(`Reservation placed for "${book.title}".`);
    } catch (err: any) {
      alert(err.message || 'Reservation failed');
    }
  };

  // If in Admin Mode, render the dedicated AdminLayout with exact dark purple sidebar!
  if (currentView === 'admin') {
    if (!adminUser) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
          <Navbar
            currentView="admin"
            onNavigate={handleNavigate}
            adminUser={null}
            memberUser={memberUser}
            onOpenMemberAuth={() => setIsMemberAuthOpen(true)}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => setCurrentView('catalogue')}
            onSelectCategory={setSelectedCategory}
          />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center max-w-md w-full">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Staff Authentication Required
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Sign in to access the E-library Admin Panel and manage circulation, books, and members.
              </p>
              <button
                onClick={() => setIsAdminAuthOpen(true)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Sign in as Admin J. Mwangi
              </button>
            </div>
          </div>
          <AdminLoginModal
            isOpen={isAdminAuthOpen}
            onClose={() => setIsAdminAuthOpen(false)}
            onSuccess={(admin) => {
              setAdminUser(admin);
              setCurrentView('admin');
            }}
          />
        </div>
      );
    }

    return (
      <AdminLayout
        adminUser={adminUser}
        initialTab={adminInitialTab}
        onLogout={handleLogout}
        onExitToCatalogue={() => setCurrentView('catalogue')}
        onOpenDefense={() => setCurrentView('presentation')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col font-sans">
      {/* 1. Public Pages (Zero forced auth - visitors browse freely) */}
      {currentView === 'landing' ? (
        <LandingPage
          onNavigatePage={handlePublicNavigate}
          onOpenMemberAuth={() => setIsMemberAuthOpen(true)}
          onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
          onOpenDefense={() => setCurrentView('presentation')}
          onGoToMemberPortal={() => setCurrentView('member-portal')}
          onGoToAdminPanel={() => setCurrentView('admin')}
          books={books}
          categories={categories}
          memberUser={memberUser}
          adminUser={adminUser}
        />
      ) : currentView === 'public-catalogue' ? (
        <PublicCataloguePage
          books={books}
          categories={categories}
          memberUser={memberUser}
          adminUser={adminUser}
          onNavigatePage={handlePublicNavigate}
          onOpenMemberAuth={() => setIsMemberAuthOpen(true)}
          onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
          onOpenDefense={() => setCurrentView('presentation')}
          onGoToMemberPortal={() => setCurrentView('member-portal')}
          onGoToAdminPanel={() => setCurrentView('admin')}
        />
      ) : currentView === 'public-categories' ? (
        <PublicCategoriesPage
          books={books}
          categories={categories}
          memberUser={memberUser}
          adminUser={adminUser}
          onNavigatePage={handlePublicNavigate}
          onOpenMemberAuth={() => setIsMemberAuthOpen(true)}
          onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
          onOpenDefense={() => setCurrentView('presentation')}
          onGoToMemberPortal={() => setCurrentView('member-portal')}
          onGoToAdminPanel={() => setCurrentView('admin')}
        />
      ) : currentView === 'public-bestsellers' ? (
        <PublicBestsellersPage
          books={books}
          categories={categories}
          memberUser={memberUser}
          adminUser={adminUser}
          onNavigatePage={handlePublicNavigate}
          onOpenMemberAuth={() => setIsMemberAuthOpen(true)}
          onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
          onOpenDefense={() => setCurrentView('presentation')}
          onGoToMemberPortal={() => setCurrentView('member-portal')}
          onGoToAdminPanel={() => setCurrentView('admin')}
        />
      ) : (
        <>
          {/* Top 3-Zone Navigation Header for Internal Views */}
          <Navbar
            currentView={currentView}
            onNavigate={handleNavigate}
            adminUser={adminUser}
            memberUser={memberUser}
            onOpenMemberAuth={() => setIsMemberAuthOpen(true)}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => setCurrentView('catalogue')}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              setCurrentView('catalogue');
            }}
          />

          {/* Main Content Body */}
          <main className="flex-1">
            {currentView === 'catalogue' && (
              <CatalogueView
                currentMember={memberUser}
                onRequireMemberAuth={() => setIsMemberAuthOpen(true)}
                onQuickNavigateToIssue={() => setCurrentView('issue-return')}
                externalSearchQuery={searchQuery}
                selectedCategoryId={selectedCategory}
              />
            )}

            {currentView === 'issue-return' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <IssueReturnDesk />
              </div>
            )}

            {currentView === 'member-portal' && memberUser && (
              <MemberPortal
                member={memberUser}
                onNavigateToCatalog={() => setCurrentView('catalogue')}
              />
            )}

            {currentView === 'presentation' && (
              <PresentationMode />
            )}
          </main>

          {/* Footer for Internal Views */}
          <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-slate-800">Berzowanley Online Library System</span>
                <span aria-hidden="true">·</span>
                <span>CMT210 Object-Oriented Programming (Python 3.10 & SQLite3)</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView('presentation')}
                  className="text-amber-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Lecturer Marking Defense (40 Marks)</span>
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="hover:text-slate-800"
                >
                  Return to Landing Page
                </button>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Modals available everywhere */}
      <MemberAuthModal
        isOpen={isMemberAuthOpen}
        onClose={() => setIsMemberAuthOpen(false)}
        onSuccess={(member) => {
          setMemberUser(member);
          setCurrentView('catalogue');
        }}
      />

      <AdminLoginModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={(admin) => {
          setAdminUser(admin);
          setCurrentView('admin');
        }}
      />

      <BookDetailsModal
        book={selectedBookForDetails}
        isOpen={!!selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
        onBorrow={handleBorrowBook}
        onReserve={handleReserveBook}
        currentMember={memberUser}
      />
    </div>
  );
}
