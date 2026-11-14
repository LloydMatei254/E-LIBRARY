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
import { mockBooks, mockCategories } from './data/mockBooks';
import { ArrowLeft, ShieldAlert, BookOpen, Code2 } from 'lucide-react';
import { getSupabaseClient, isDemoMode, isSupabaseConfigured } from './services/supabaseClient';

const OfflineFallbackNotice = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleFallbackChange = (event: Event) => {
      if (event instanceof CustomEvent) setActive(event.detail === true);
    };
    window.addEventListener('library:offline-fallback', handleFallbackChange);
    return () => window.removeEventListener('library:offline-fallback', handleFallbackChange);
  }, []);

  if (!active) return null;
  return (
    <div role="status" className="sticky top-0 z-[60] bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
      {isDemoMode
        ? 'Demo data is active. Borrowing, reservations, and staff changes need a live connection.'
        : 'You are viewing previously saved Supabase data. Borrowing, reservations, and staff changes need an internet connection.'}
    </div>
  );
};

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
  const [returnToMemberPortal, setReturnToMemberPortal] = useState(false);

  // Global books and categories state - initialized with mock data for demo
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [categories, setCategories] = useState<Category[]>(mockCategories);

  // Search and category filter state shared with Navbar and CatalogueView
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Authenticated states (initially null or patrons can log in / sign up)
  const [adminUser, setAdminUser] = useState<Admin | null>(null);
  const [memberUser, setMemberUser] = useState<Member | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Modals
  const [isMemberAuthOpen, setIsMemberAuthOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);

  useEffect(() => {
    if (isDemoMode || !isSupabaseConfigured) return;
    const { data: { subscription } } = getSupabaseClient().auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setIsMemberAuthOpen(true);
      }
    });
    if (window.location.hash.includes('type=recovery')) {
      setIsPasswordRecovery(true);
      setIsMemberAuthOpen(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDemoMode) return;
    let active = true;
    Promise.all([api.getBooks(), api.getCategories(), api.getCurrentAccount()])
      .then(([liveBooks, liveCategories, account]) => {
        if (!active) return;
        setBooks(liveBooks);
        setCategories(liveCategories);
        setMemberUser(account.member);
        setAdminUser(account.admin);
        if (account.member) setCurrentView('member-portal');
        if (account.admin) setCurrentView('admin');
      })
      .catch((error: unknown) => {
        console.error('Could not initialize the live library connection.', error);
        if (active) {
          setStartupError(error instanceof Error ? error.message : 'The live library could not be initialized.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePublicNavigate = (page: PublicPage) => {
    setReturnToMemberPortal(false);
    if (page === 'home') setCurrentView('landing');
    else if (page === 'catalogue') setCurrentView('public-catalogue');
    else if (page === 'categories') setCurrentView('public-categories');
    else if (page === 'bestsellers') setCurrentView('public-bestsellers');
  };

  const openMemberPortal = () => {
    if (memberUser) {
      setReturnToMemberPortal(false);
      setCurrentView('member-portal');
    } else {
      setIsMemberAuthOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await api.signOut();
    } catch (error) {
      console.error('Could not sign out of the library account.', error);
      alert(error instanceof Error ? error.message : 'Sign out failed.');
      return;
    }
    setReturnToMemberPortal(false);
    if (currentView === 'admin') {
      setAdminUser(null);
      setCurrentView('landing');
    } else {
      setMemberUser(null);
      setCurrentView('landing');
    }
  };

  const handleNavigate = (view: any) => {
    if (view !== 'catalogue' && view !== 'member-portal') {
      setReturnToMemberPortal(false);
    }
    if (view === 'home' || view === 'landing') {
      setCurrentView('landing');
    } else if (view === 'member-portal') {
      openMemberPortal();
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
      const result = await api.issueBook(String(memberUser.member_id), String(book.book_id));
      alert(`Successfully borrowed "${book.title}"! Due date: ${String(result.due_date ?? '14 days from today')}.`);
      
      setBooks((currentBooks) => currentBooks.map((currentBook) =>
        currentBook.book_id === book.book_id
          ? { ...currentBook, available_copies: Math.max(0, currentBook.available_copies - 1) }
          : currentBook,
      ));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Borrow failed.');
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
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Reservation failed.');
    }
  };

  // If in Admin Mode, render the dedicated AdminLayout with exact dark purple sidebar!
  if (currentView === 'admin') {
    if (!adminUser) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
          <OfflineFallbackNotice />
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
      <>
        <OfflineFallbackNotice />
        <AdminLayout
          adminUser={adminUser}
          initialTab={adminInitialTab}
          onLogout={handleLogout}
          onExitToCatalogue={() => setCurrentView('catalogue')}
          onOpenDefense={() => setCurrentView('presentation')}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 flex flex-col font-sans">
      <OfflineFallbackNotice />
      {startupError && (
        <div role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-xs text-rose-800">
          Live library connection unavailable: {startupError}
        </div>
      )}
      {/* 1. Public Pages (Zero forced auth - visitors browse freely) */}
      {currentView === 'landing' ? (
        <LandingPage
          onNavigatePage={handlePublicNavigate}
          onOpenMemberAuth={() => setIsMemberAuthOpen(true)}
          onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
          onOpenDefense={() => setCurrentView('presentation')}
          onGoToMemberPortal={openMemberPortal}
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
          onGoToMemberPortal={openMemberPortal}
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
          onGoToMemberPortal={openMemberPortal}
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
          onGoToMemberPortal={openMemberPortal}
          onGoToAdminPanel={() => setCurrentView('admin')}
        />
      ) : (
        <>
          {currentView !== 'member-portal' && (
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
              memberPortalCatalogue={currentView === 'catalogue' && returnToMemberPortal}
            />
          )}

          {/* Main Content Body */}
          <main className="flex-1">
            {currentView === 'catalogue' && returnToMemberPortal && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setReturnToMemberPortal(false);
                    setCurrentView('member-portal');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to member overview
                </button>
              </div>
            )}
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
                onNavigateToCatalog={() => {
                  setReturnToMemberPortal(true);
                  setCurrentView('catalogue');
                }}
                onLogout={handleLogout}
              />
            )}

            {currentView === 'presentation' && (
              <PresentationMode />
            )}
          </main>

          {currentView !== 'member-portal' && (
            <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-slate-800">Berzowanley Online Library System</span>
                  <span aria-hidden="true">·</span>
                  <span>Professional Library Management Platform</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentView('landing')}
                    className="hover:text-slate-800"
                  >
                    Return to Landing Page
                  </button>
                </div>
              </div>
            </footer>
          )}
        </>
      )}

      {/* Modals available everywhere */}
      <MemberAuthModal
        isOpen={isMemberAuthOpen}
        onClose={() => setIsMemberAuthOpen(false)}
        isPasswordRecovery={isPasswordRecovery}
        onPasswordResetComplete={() => {
          setIsPasswordRecovery(false);
          setMemberUser(null);
          setCurrentView('landing');
        }}
        onSuccess={(member) => {
          setMemberUser(member);
          setReturnToMemberPortal(false);
          setCurrentView('member-portal');
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
