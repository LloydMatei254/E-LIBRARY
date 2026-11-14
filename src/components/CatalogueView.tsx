import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, AlertCircle, CheckCircle2, Bookmark, Sparkles } from 'lucide-react';
import { Book, Category, Member } from '../types';
import { api } from '../services/api';
import { BookDetailsModal } from './BookDetailsModal';
import { BookCoverView } from './common/BookCoverView';

interface CatalogueViewProps {
  currentMember: Member | null;
  onRequireMemberAuth: () => void;
  onQuickNavigateToIssue?: () => void;
  externalSearchQuery?: string;
  selectedCategoryId?: number | null;
}

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  currentMember,
  onRequireMemberAuth,
  onQuickNavigateToIssue,
  externalSearchQuery = '',
  selectedCategoryId = null,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(selectedCategoryId);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  useEffect(() => {
    if (externalSearchQuery !== searchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    if (selectedCategoryId !== undefined) {
      setSelectedCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Selected book for modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBooks({
        search: searchQuery || undefined,
        category_id: selectedCategory || undefined,
        available_only: availabilityFilter === 'available',
      });
      setBooks(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching books from the library database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [cats, bList] = await Promise.all([api.getCategories(), api.getBooks()]);
        setCategories(cats);
        setBooks(bList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleApplyFilters = () => {
    fetchBooks();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBorrow = async (book: Book) => {
    if (!currentMember) {
      onRequireMemberAuth();
      return;
    }
    try {
      const res = await api.issueBook(String(currentMember.member_id), String(book.book_id));
      showToast(`Successfully borrowed "${res.book_title}"! Due date: ${res.due_date}`);
      fetchBooks();
    } catch (err: any) {
      setError(err.message || 'Borrow request failed.');
    }
  };

  const handleReserve = async (book: Book) => {
    if (!currentMember) {
      onRequireMemberAuth();
      return;
    }
    try {
      await api.createReservation(currentMember.member_id, book.book_id);
      showToast(`Reservation recorded for "${book.title}". You will be notified once returned.`);
    } catch (err: any) {
      setError(err.message || 'Reservation failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Wireframe Header Bar matching Page 1 "Book Selection" */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Book Selection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverable 2 Front-End Section 1 · Showing {books.length} academic titles in stock
          </p>
        </div>

        {searchQuery && (
          <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
            <span>Filtering by: <strong className="font-semibold">"{searchQuery}"</strong></span>
            <button
              onClick={() => {
                setSearchQuery('');
                setTimeout(() => fetchBooks(), 50);
              }}
              className="text-blue-800 hover:underline font-bold ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Filters + Right Book List matching wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters Panel */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-24">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Filters
              </h3>
            </div>

            {/* Category Filter */}
            <div className="mb-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Category
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === null}
                    onChange={() => setSelectedCategory(null)}
                    className="text-indigo-600 focus:ring-indigo-500 rounded-full"
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat.category_id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.category_id}
                      onChange={() => setSelectedCategory(cat.category_id)}
                      className="text-indigo-600 focus:ring-indigo-500 rounded-full"
                    />
                    <span>{cat.category_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                Availability
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === 'all'}
                    onChange={() => setAvailabilityFilter('all')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>All Items</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === 'available'}
                    onChange={() => setAvailabilityFilter('available')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Available Now</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === 'unavailable'}
                    onChange={() => setAvailabilityFilter('unavailable')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Currently Borrowed</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleApplyFilters}
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              Apply filters
            </button>
          </div>
        </aside>

        {/* Right Books List */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No books matched your criteria</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try searching with different keywords or resetting filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setAvailabilityFilter('all');
                  fetchBooks();
                }}
                className="mt-4 px-3.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {books.map((book) => {
                const authorsText = book.authors?.length ? book.authors.join(', ') : 'Staff Author';
                const isAvailable = book.available_copies > 0;

                return (
                  <div
                    key={book.book_id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: Thumbnail & Book Meta */}
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Actual Book Cover */}
                      <BookCoverView
                        book={book}
                        aspect="portrait"
                        className="w-14 h-20 shrink-0 shadow-xs"
                      />

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                          {book.title}
                        </h3>

                        {/* Unboxed Metadata with Typographic Separators */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="font-medium text-slate-700">{authorsText}</span>
                          <span aria-hidden="true">·</span>
                          <span>{book.category_name}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{book.isbn}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs mt-1.5">
                          <span className={isAvailable ? 'text-emerald-700 font-medium' : 'text-rose-600 font-medium'}>
                            {book.available_copies} of {book.total_copies} available
                          </span>
                          {book.shelf_location && (
                            <span className="text-slate-400 font-mono text-[11px]">
                              {book.shelf_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions matching Wireframe [Details] [Borrow] */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setSelectedBook(book)}
                        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Details
                      </button>

                      {isAvailable ? (
                        <button
                          onClick={() => handleBorrow(book)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
                        >
                          Borrow
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReserve(book)}
                          className="px-3.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Reserve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Book Details Modal */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onBorrow={handleBorrow}
        onReserve={handleReserve}
        currentMember={currentMember}
      />
    </div>
  );
};
