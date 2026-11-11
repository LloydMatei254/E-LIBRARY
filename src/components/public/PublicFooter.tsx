import React from 'react';
import { BookOpen } from 'lucide-react';
import { PublicPage } from './PublicHeader';

interface PublicFooterProps {
  onNavigate: (page: PublicPage) => void;
  onOpenMemberAuth: () => void;
  onOpenAdminAuth: () => void;
  onOpenDefense: () => void;
  onSelectCategory?: (categoryId: number) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onNavigate,
  onOpenMemberAuth,
  onOpenAdminAuth,
  onOpenDefense,
  onSelectCategory,
}) => {
  return (
    <footer className="bg-[#17221E] text-stone-300 py-12 text-xs border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="font-serif font-bold text-sm tracking-wider text-white uppercase">
                PAGE & PINE · E-LIBRARY
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              We believe books have the power to change minds and inspire academic scholarship.
              A complete university library management system with Python OOP and SQLite.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              PUBLIC HOLDINGS
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button
                  onClick={() => onNavigate('catalogue')}
                  className="hover:text-white transition-colors"
                >
                  Full Academic Catalogue
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="hover:text-white transition-colors"
                >
                  Browse All Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('bestsellers')}
                  className="hover:text-white transition-colors"
                >
                  Readers' All-Time Favorites
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              PATRON SERVICES
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li><button onClick={onOpenMemberAuth} className="hover:text-white transition-colors">Create Patron Account</button></li>
              <li><button onClick={onOpenMemberAuth} className="hover:text-white transition-colors">Member Sign In</button></li>
              <li><button onClick={onOpenAdminAuth} className="hover:text-amber-300 font-semibold transition-colors">Librarian Staff Portal</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              CAMPUS DESK
            </h4>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Main Campus Complex, Block C Stacks<br />
              Mon – Fri: 08:00 AM – 09:00 PM<br />
              Email: librarian@library.ac.ke
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <span>© 2026 Berzowanley Online Library. All Rights Reserved.</span>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenDefense}
              className="hover:text-white transition-colors"
            >
              Marking Defense (40 Marks)
            </button>
            <span>·</span>
            <span>Python 3.10 & SQLite3</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
