import React from 'react';
import { X, Building2, Calendar, Layers, MapPin, LogIn } from 'lucide-react';
import { Book } from '../../types';
import { BookCoverView } from '../common/BookCoverView';

interface PublicBookModalProps {
  book: Book | null;
  onClose: () => void;
  onBorrow: (book: Book) => void;
}

export const PublicBookModal: React.FC<PublicBookModalProps> = ({
  book,
  onClose,
  onBorrow,
}) => {
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-xl w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Actual Real Book Cover Image */}
          <div className="w-full sm:w-44 shrink-0">
            <BookCoverView
              book={book}
              aspect="portrait"
              showOverlayInfo={true}
              className="w-full shadow-lg"
            />
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                {book.category_name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{book.isbn}</span>
            </div>

            <h3 className="text-lg font-serif font-bold text-stone-900 leading-snug">
              {book.title}
            </h3>

            <p className="text-xs text-stone-600 mt-1 font-medium">
              By {book.authors?.join(', ') || 'Unknown Author'}
            </p>

            <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-stone-700">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{book.publisher || 'Academic Press'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{book.publication_year}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{book.pages || 350} pages</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>{book.shelf_location || 'Stacks'}</span>
              </div>
            </div>

            <div className="mt-3">
              <h5 className="text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Synopsis / Abstract
              </h5>
              <p className="text-xs text-stone-600 leading-relaxed max-h-20 overflow-y-auto">
                {book.description || 'Comprehensive curriculum text in the university library.'}
              </p>
            </div>

            {/* Status & Action */}
            <div className="mt-4 pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-stone-500">Availability: </span>
                <span
                  className={`font-semibold ${
                    book.available_copies > 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {book.available_copies} of {book.total_copies} copies
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBorrow(book)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-[#1C2622] hover:bg-[#121A17] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-300" />
                  <span>Login to Borrow</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
