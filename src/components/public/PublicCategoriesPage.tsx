import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  Bookmark,
  BookOpen,
  GraduationCap,
  Layers,
  ArrowRight,
  ArrowLeft,
  BookCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Book, Category, Member, Admin } from '../../types';
import { PublicHeader, PublicPage } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PublicBookModal } from './PublicBookModal';
import { BookCoverView } from '../common/BookCoverView';

interface PublicCategoriesPageProps {
  books: Book[];
  categories: Category[];
  memberUser: Member | null;
  adminUser: Admin | null;
  initialCategoryId?: number | null;
  onNavigatePage: (page: PublicPage) => void;
  onOpenMemberAuth: () => void;
  onOpenAdminAuth: () => void;
  onOpenDefense: () => void;
  onGoToMemberPortal?: () => void;
  onGoToAdminPanel?: () => void;
}

export const PublicCategoriesPage: React.FC<PublicCategoriesPageProps> = ({
  books,
  categories,
  memberUser,
  adminUser,
  initialCategoryId = null,
  onNavigatePage,
  onOpenMemberAuth,
  onOpenAdminAuth,
  onOpenDefense,
  onGoToMemberPortal,
  onGoToAdminPanel,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<number | null>(initialCategoryId);
  const [previewBook, setPreviewBook] = useState<Book | null>(null);

  const categoryThemes: Record<number, { sub: string; icon: any; bg: string; accent: string }> = {
    1: { sub: 'Python, AI, Algorithms & Systems', icon: Code2, bg: 'from-[#17263c] to-[#0f172a]', accent: 'text-blue-300' },
    2: { sub: 'Physics, Cosmology & Mathematics', icon: Sparkles, bg: 'from-[#064e3b] to-[#022c22]', accent: 'text-emerald-300' },
    3: { sub: 'Economics, Value Investing & Strategy', icon: Bookmark, bg: 'from-[#78350f] to-[#451a03]', accent: 'text-amber-300' },
    4: { sub: 'Classical Prose & African Literature', icon: BookOpen, bg: 'from-[#881337] to-[#4c0519]', accent: 'text-rose-300' },
    5: { sub: 'Civilizations, Politics & Modern History', icon: GraduationCap, bg: 'from-[#292524] to-[#1c1917]', accent: 'text-stone-300' },
  };

  const handleBorrow = (book: Book) => {
    setPreviewBook(null);
    if (memberUser && onGoToMemberPortal) {
      onGoToMemberPortal();
    } else {
      onOpenMemberAuth();
    }
  };

  const activeCategory = categories.find((c) => c.category_id === selectedCatId);
  const categoryBooks = selectedCatId
    ? books.filter((b) => b.category_id === selectedCatId)
    : [];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans flex flex-col">
      {/* 1. Global Public Header */}
      <PublicHeader
        activePage="categories"
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
        onGoToMemberPortal={onGoToMemberPortal}
        onGoToAdminPanel={onGoToAdminPanel}
        memberUser={memberUser}
        adminUser={adminUser}
      />

      {/* 2. Main Page Content */}
      <main className="flex-1">
        {selectedCatId !== null && activeCategory ? (
          /* ==============================================================
             A. DEDICATED CATEGORY VIEW (Shows all books in selected category)
             Requirement: Leads to a page containing that category and books
             not directly logging them in!
             ============================================================== */
          <div>
            {/* Category Header Banner */}
            <div className="bg-[#1C2622] text-white py-12 border-b border-stone-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                  onClick={() => setSelectedCatId(null)}
                  className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 mb-4 transition-colors uppercase tracking-wider font-mono"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to All Categories</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                      ACADEMIC DISCIPLINE
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
                      {activeCategory.category_name} Collection
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
                      {activeCategory.description}
                    </p>
                  </div>

                  <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shrink-0">
                    {categoryBooks.length} {categoryBooks.length === 1 ? 'Title' : 'Titles'} in this Category
                  </div>
                </div>

                {/* Quick Switch Pills to Jump Between Categories */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-stone-400 mr-2">
                    Switch Category:
                  </span>
                  <button
                    onClick={() => setSelectedCatId(null)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.category_id}
                      onClick={() => setSelectedCatId(c.category_id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        c.category_id === selectedCatId
                          ? 'bg-amber-400 text-stone-900 font-bold shadow-xs'
                          : 'bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {c.category_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Books in this Category */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {categoryBooks.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-stone-200 max-w-md mx-auto shadow-2xs">
                  <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h3 className="text-base font-serif font-bold text-stone-800">
                    No books in this category currently
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Check back soon as acquisitions are processed.
                  </p>
                  <button
                    onClick={() => setSelectedCatId(null)}
                    className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-[#1C2622] rounded-lg"
                  >
                    View Other Categories
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryBooks.map((book) => (
                    <div
                      key={book.book_id}
                      className="bg-white rounded-xl border border-stone-200 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Actual Real Book Cover Image */}
                        <BookCoverView
                          book={book}
                          aspect="portrait"
                          showOverlayInfo={true}
                          className="mb-4"
                        />

                        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                          <span className="font-mono">{book.isbn}</span>
                          <span>Year {book.publication_year}</span>
                        </div>

                        <h3 className="text-sm font-bold text-stone-900 leading-snug">
                          {book.title}
                        </h3>

                        <p className="text-xs text-stone-600 mt-1">
                          By {book.authors?.join(', ') || 'Academic Faculty'}
                        </p>

                        <p className="text-xs text-stone-500 mt-3 line-clamp-2 leading-relaxed">
                          {book.description || 'Core university library reference text.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            book.available_copies > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {book.available_copies} of {book.total_copies} available
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewBook(book)}
                            className="px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleBorrow(book)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-[#1C2622] hover:bg-[#121A17] rounded shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <BookCheck className="w-3.5 h-3.5 text-amber-300" />
                            <span>Borrow</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==============================================================
             B. CATEGORIES OVERVIEW PAGE (Lists all categories)
             ============================================================== */
          <div>
            <div className="bg-[#1C2622] text-white py-12 border-b border-stone-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 font-mono">
                  CURRICULUM DISCIPLINES
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
                  Browse by Category
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-2xl leading-relaxed">
                  Select any academic discipline below to explore all course texts and holdings in that area without signing in.
                </p>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat) => {
                  const theme = categoryThemes[cat.category_id] || {
                    sub: 'Academic Curriculum',
                    icon: Layers,
                    bg: 'from-[#1c1917] to-[#0c0a09]',
                    accent: 'text-amber-200',
                  };
                  const IconComp = theme.icon;
                  const booksInCat = books.filter((b) => b.category_id === cat.category_id);

                  return (
                    <div
                      key={cat.category_id}
                      className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Top Header Card */}
                      <div className={`p-6 bg-gradient-to-br ${theme.bg} text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <IconComp className={`w-6 h-6 ${theme.accent} stroke-[1.8]`} />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-white">
                          {cat.category_name}
                        </h3>
                        <p className="text-xs text-stone-300 mt-1 line-clamp-1">
                          {theme.sub}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-mono text-amber-200">
                          <span>{booksInCat.length} Titles Available</span>
                        </div>
                      </div>

                      {/* Description & Sample Books */}
                      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {cat.description}
                        </p>

                        {/* Sample Titles */}
                        {booksInCat.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                              Notable Titles:
                            </span>
                            <ul className="space-y-1.5 text-xs text-stone-700">
                              {booksInCat.slice(0, 3).map((b) => (
                                <li key={b.book_id} className="flex items-center gap-1.5 truncate">
                                  <ChevronRight className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span className="truncate font-medium">{b.title}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedCatId(cat.category_id)}
                          className="w-full mt-4 py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#1C2622] hover:bg-[#121A17] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs group-hover:bg-[#25332C]"
                        >
                          <span>Explore {cat.category_name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Public Footer */}
      <PublicFooter
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
        onSelectCategory={(id) => setSelectedCatId(id)}
      />

      {/* 4. Public Book Modal */}
      <PublicBookModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onBorrow={handleBorrow}
      />
    </div>
  );
};
