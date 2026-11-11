import React, { useState } from 'react';
import { Book } from '../../types';
import { getBookCoverUrl } from '../../utils/bookCovers';
import { BookOpen } from 'lucide-react';

interface BookCoverViewProps {
  book: Book;
  aspect?: 'portrait' | 'wide' | 'square';
  rank?: number;
  showOverlayInfo?: boolean;
  className?: string;
}

export const BookCoverView: React.FC<BookCoverViewProps> = ({
  book,
  aspect = 'portrait',
  rank,
  showOverlayInfo = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const coverUrl = getBookCoverUrl(book);

  const aspectClass =
    aspect === 'portrait'
      ? 'aspect-[2/3]'
      : aspect === 'wide'
      ? 'aspect-[16/9]'
      : 'aspect-square';

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 bg-stone-900 border border-stone-800/60 ${aspectClass} ${className}`}
    >
      {/* 1. Actual Real Book Cover Image */}
      {!imageError ? (
        <img
          src={coverUrl}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          crossOrigin="anonymous"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
        />
      ) : (
        /* Fallback: Rich Textured Hardcover Spine */
        <div className="w-full h-full bg-gradient-to-br from-[#1C2622] via-[#2A3A34] to-[#121A17] p-4 text-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold bg-white/10 px-2 py-0.5 rounded">
              {book.category_name}
            </span>
            <BookOpen className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h4 className="text-sm font-serif font-bold text-white line-clamp-3 leading-snug">
              {book.title}
            </h4>
            <p className="text-[11px] text-stone-300 line-clamp-1 mt-1">
              {book.authors?.join(', ') || 'Academic Scholar'}
            </p>
          </div>
          <div className="text-[10px] text-stone-400 font-mono flex justify-between border-t border-white/10 pt-1.5">
            <span>{book.publication_year}</span>
            <span>{book.shelf_location || 'Stacks'}</span>
          </div>
        </div>
      )}

      {/* 2. Realistic 3D Hardcover Book Spine Crease Shadow (Left edge) */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

      {/* 3. Subtle Gloss Highlight Across the Cover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />

      {/* 4. Optional Top Overlays: Rank badge (#1, #2...) and Category badge */}
      {(rank !== undefined || showOverlayInfo) && (
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
          {rank !== undefined ? (
            <span className="w-6 h-6 rounded-full bg-amber-400 text-stone-950 text-[10px] font-bold flex items-center justify-center font-mono shadow-md border border-amber-300">
              #{rank}
            </span>
          ) : (
            <span />
          )}

          {book.category_name && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-amber-200 bg-stone-900/80 backdrop-blur-md px-2 py-0.5 rounded shadow-sm border border-white/10">
              {book.category_name}
            </span>
          )}
        </div>
      )}

      {/* 5. Optional Bottom Gradient with Shelf & Year */}
      {showOverlayInfo && (
        <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-stone-950/90 via-stone-950/60 to-transparent text-white pointer-events-none flex items-center justify-between text-[10px] font-mono">
          <span className="text-stone-300">{book.publication_year}</span>
          <span className="text-amber-200">{book.shelf_location || 'Stacks'}</span>
        </div>
      )}
    </div>
  );
};
