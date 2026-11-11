import React from 'react';
import { X, BookCheck, Bookmark, Calendar, Globe, Layers, MapPin, Hash, Building2 } from 'lucide-react';
import { Book, Member } from '../types';
import { BookCoverView } from './common/BookCoverView';

interface BookDetailsModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onBorrow: (book: Book) => void;
  onReserve: (book: Book) => void;
  currentMember: Member | null;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  isOpen,
  onClose,
  onBorrow,
  onReserve,
  currentMember,
}) => {
  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Actual Real Book Cover Image */}
          <div className="w-full sm:w-40 shrink-0">
            <BookCoverView
              book={book}
              aspect="portrait"
              showOverlayInfo={true}
              className="w-full shadow-md"
            />
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{book.category_name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{book.isbn}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {book.title}
            </h3>

            <p className="text-xs text-slate-600 mt-1 font-medium">
              By {book.authors?.length ? book.authors.join(', ') : 'Unknown Author'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{book.publisher || 'TechPress Academic'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{book.publication_year}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{book.pages || 250} pages</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{book.shelf_location || 'General Stacks'}</span>
              </div>
            </div>

            <div className="mt-3">
              <h5 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description / Abstract
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
                {book.description || 'Standard text covering foundational theory, design patterns, and applied computational concepts.'}
              </p>
            </div>

            {/* Inventory Status */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-500">Availability: </span>
                <span className={`font-semibold ${book.available_copies > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {book.available_copies} of {book.total_copies} available
                </span>
              </div>

              <div className="flex items-center gap-2">
                {book.available_copies > 0 ? (
                  <button
                    onClick={() => {
                      onBorrow(book);
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <BookCheck className="w-3.5 h-3.5" />
                    <span>Borrow Book</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onReserve(book);
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-200"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Place Reservation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
