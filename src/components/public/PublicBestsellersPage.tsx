import React, { useState } from 'react';
import { Star, ArrowRight, BookCheck, Sparkles, TrendingUp, Award, Bookmark } from 'lucide-react';
import { Book, Category, Member, Admin } from '../../types';
import { PublicHeader, PublicPage } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PublicBookModal } from './PublicBookModal';
import { BookCoverView } from '../common/BookCoverView';

interface PublicBestsellersPageProps {
  books: Book[];
  categories: Category[];
  memberUser: Member | null;
  adminUser: Admin | null;
  onNavigatePage: (page: PublicPage) => void;
  onOpenMemberAuth: () => void;
  onOpenAdminAuth: () => void;
  onOpenDefense: () => void;
  onGoToMemberPortal?: () => void;
  onGoToAdminPanel?: () => void;
}

export const PublicBestsellersPage: React.FC<PublicBestsellersPageProps> = ({
  books,
  categories,
  memberUser,
  adminUser,
  onNavigatePage,
  onOpenMemberAuth,
  onOpenAdminAuth,
  onOpenDefense,
  onGoToMemberPortal,
  onGoToAdminPanel,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [previewBook, setPreviewBook] = useState<Book | null>(null);

  const handleBorrow = (book: Book) => {
    setPreviewBook(null);
    if (memberUser && onGoToMemberPortal) {
      onGoToMemberPortal();
    } else {
      onOpenMemberAuth();
    }
  };

  // Filter bestsellers (sorted by popularity/available copies or slice)
  const bestsellersList = books.filter((b) => {
    if (selectedCatId === null) return true;
    return b.category_id === selectedCatId;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans flex flex-col">
      {/* 1. Global Public Header */}
      <PublicHeader
        activePage="bestsellers"
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
        onGoToMemberPortal={onGoToMemberPortal}
        onGoToAdminPanel={onGoToAdminPanel}
        memberUser={memberUser}
        adminUser={adminUser}
      />

      {/* 2. Hero Banner */}
      <div className="bg-[#1C2622] text-white py-12 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 font-mono flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>READERS' ALL-TIME FAVORITES</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
              Library Bestsellers & Top Circulation
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
              The most requested, widely cited, and highest-rated titles across the campus.
              View all readers' favorites publicly. Sign in to borrow or place digital holds.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Strip */}
      <div className="bg-white border-b border-stone-200 sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-2">
              Filter By:
            </span>
            <button
              onClick={() => setSelectedCatId(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCatId === null
                  ? 'bg-[#1C2622] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All Favorites ({books.length})
            </button>
            {categories.map((c) => {
              const count = books.filter((b) => b.category_id === c.category_id).length;
              return (
                <button
                  key={c.category_id}
                  onClick={() => setSelectedCatId(c.category_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCatId === c.category_id
                      ? 'bg-[#1C2622] text-amber-200 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {c.category_name} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Top Loan Velocity · 14-Day Terms</span>
          </div>
        </div>
      </div>

      {/* 4. Main Bestsellers Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bestsellersList.map((book, idx) => (
            <div
              key={book.book_id}
              className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xl transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Actual Real Book Cover Image with 3D Spine and Badges */}
                <BookCoverView
                  book={book}
                  rank={idx + 1}
                  showOverlayInfo={false}
                  className="mb-4"
                />

                <div className="mt-4 space-y-1">
                  <div className="flex items-center text-amber-500 text-xs gap-1">
                    <span>★★★★★</span>
                    <span className="text-stone-400 font-mono text-[10px]">(4.9 / 5.0)</span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors leading-snug">
                    {book.title}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-1">
                    By {book.authors?.join(', ') || 'Faculty Press'}
                  </p>

                  <p className="text-[11px] text-stone-500 line-clamp-2 pt-1 leading-relaxed">
                    {book.description || 'Highly sought academic reference text in regular student circulation.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-semibold ${
                    book.available_copies > 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {book.available_copies} of {book.total_copies} available
                </span>

                <div className="flex items-center gap-1.5">
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
      </main>

      {/* 5. Public Footer */}
      <PublicFooter
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
      />

      {/* 6. Public Book Modal */}
      <PublicBookModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onBorrow={handleBorrow}
      />
    </div>
  );
};
