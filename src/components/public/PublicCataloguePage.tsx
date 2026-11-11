import React, { useState } from 'react';
import { Search, X, BookCheck, Filter, ArrowUpDown } from 'lucide-react';
import { Book, Category, Member, Admin } from '../../types';
import { PublicHeader, PublicPage } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PublicBookModal } from './PublicBookModal';
import { BookCoverView } from '../common/BookCoverView';

interface PublicCataloguePageProps {
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

export const PublicCataloguePage: React.FC<PublicCataloguePageProps> = ({
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'available'>('title');
  const [previewBook, setPreviewBook] = useState<Book | null>(null);

  const handleBorrow = (book: Book) => {
    setPreviewBook(null);
    if (memberUser && onGoToMemberPortal) {
      onGoToMemberPortal();
    } else {
      onOpenMemberAuth();
    }
  };

  // Filter and sort books
  const filteredBooks = books
    .filter((b) => {
      const matchCat = selectedCatId === null || b.category_id === selectedCatId;
      const matchAvail = !onlyAvailable || b.available_copies > 0;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        q === '' ||
        b.title.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.publisher && b.publisher.toLowerCase().includes(q)) ||
        (b.authors && b.authors.some((a) => a.toLowerCase().includes(q)));
      return matchCat && matchAvail && matchQuery;
    })
    .sort((a, b) => {
      if (sortBy === 'year') return (b.publication_year ?? 0) - (a.publication_year ?? 0);
      if (sortBy === 'available') return b.available_copies - a.available_copies;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans flex flex-col">
      {/* 1. Public Header */}
      <PublicHeader
        activePage="catalogue"
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
        onGoToMemberPortal={onGoToMemberPortal}
        onGoToAdminPanel={onGoToAdminPanel}
        memberUser={memberUser}
        adminUser={adminUser}
      />

      {/* 2. Page Hero Banner */}
      <div className="bg-[#1C2622] text-white py-12 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 font-mono">
              CAMPUS ARCHIVES
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-1">
              Academic Library Catalogue
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
              Explore our full collection of course textbooks, literature classics, and research volumes.
              All holdings are accessible publicly without an account; sign in or register when you are ready to borrow or place holds.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white border-b border-stone-200 sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title, author, publisher, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl bg-stone-50 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1C2622] text-stone-900"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-stone-700 select-none bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-medium">Only Available Copies</span>
              </label>

              <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-500 text-[11px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-stone-800 font-semibold focus:outline-none text-xs cursor-pointer"
                >
                  <option value="title">Title (A-Z)</option>
                  <option value="year">Newest Publication</option>
                  <option value="available">Most Copies Available</option>
                </select>
              </div>

              {(selectedCatId !== null || searchQuery !== '' || onlyAvailable) && (
                <button
                  onClick={() => {
                    setSelectedCatId(null);
                    setSearchQuery('');
                    setOnlyAvailable(false);
                  }}
                  className="text-stone-500 hover:text-stone-800 text-xs underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCatId(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCatId === null
                  ? 'bg-[#1C2622] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All Categories ({books.length})
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
        </div>
      </div>

      {/* 4. Catalogue Holdings Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-medium text-stone-500">
            Showing <span className="font-bold text-stone-900">{filteredBooks.length}</span> titles matching your filters
          </p>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-stone-200 max-w-lg mx-auto shadow-2xs">
            <Filter className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-serif font-bold text-stone-800">
              No matching books found
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              Try adjusting your search keywords, clearing filters, or browsing by category.
            </p>
            <button
              onClick={() => {
                setSelectedCatId(null);
                setSearchQuery('');
                setOnlyAvailable(false);
              }}
              className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-[#1C2622] rounded-lg"
            >
              Show All Books
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.book_id}
                className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-lg transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex gap-4 mb-3">
                    <BookCoverView
                      book={book}
                      aspect="portrait"
                      className="w-24 sm:w-28 shrink-0 shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                        <span className="font-semibold text-amber-900 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">
                          {book.category_name}
                        </span>
                        <span className="font-mono text-[10px]">{book.shelf_location || 'Stacks'}</span>
                      </div>

                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors leading-snug line-clamp-2">
                        {book.title}
                      </h3>

                      <p className="text-xs text-stone-600 mt-1 line-clamp-1">
                        By {book.authors?.join(', ') || 'Academic Faculty'}
                      </p>

                      <div className="mt-2 text-[11px] text-stone-500 space-y-0.5 bg-stone-50 p-2 rounded-lg border border-stone-100">
                        <div className="truncate"><span className="text-stone-400">Pub: </span>{book.publisher || 'TechPress'}</div>
                        <div><span className="text-stone-400">Year: </span>{book.publication_year} · {book.pages || 350} pp.</div>
                        <div className="font-mono text-[10px] truncate text-stone-400">ISBN: {book.isbn}</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {book.description || 'Standard academic reference text in university circulation.'}
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
      </main>

      {/* 5. Footer */}
      <PublicFooter
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
      />

      {/* 6. Preview Modal */}
      <PublicBookModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onBorrow={handleBorrow}
      />
    </div>
  );
};
