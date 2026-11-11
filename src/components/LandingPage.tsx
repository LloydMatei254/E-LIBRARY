import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Bookmark,
  Layers,
  GraduationCap,
  Code2,
  Clock,
  Compass,
  Library,
  Star,
  Lightbulb,
  Cpu,
  Briefcase,
  BookMarked,
  Globe,
  Heart,
} from 'lucide-react';
import { Book, Category, Admin, Member } from '../types';
import { PublicHeader, PublicPage } from './public/PublicHeader';
import { PublicFooter } from './public/PublicFooter';
import { PublicBookModal } from './public/PublicBookModal';
import { BookCoverView } from './common/BookCoverView';
import { ExpandingCards, CardItem } from './ui/expanding-cards';

interface LandingPageProps {
  onNavigatePage: (page: PublicPage) => void;
  onOpenMemberAuth: () => void;
  onOpenAdminAuth: () => void;
  onOpenDefense: () => void;
  onGoToMemberPortal?: () => void;
  onGoToAdminPanel?: () => void;
  books: Book[];
  categories: Category[];
  memberUser: Member | null;
  adminUser: Admin | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigatePage,
  onOpenMemberAuth,
  onOpenAdminAuth,
  onOpenDefense,
  onGoToMemberPortal,
  onGoToAdminPanel,
  books,
  categories,
  memberUser,
  adminUser,
}) => {
  const [quickEmail, setQuickEmail] = useState('');
  const [previewBook, setPreviewBook] = useState<Book | null>(null);

  // Hero asset paths - using Unsplash CDN for reliable hosting
  const heroImgSrc = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80';
  const bannerImgSrc = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80';

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenMemberAuth();
  };

  const handleBorrowClick = (book: Book) => {
    setPreviewBook(null);
    if (memberUser && onGoToMemberPortal) {
      onGoToMemberPortal();
    } else {
      onOpenMemberAuth();
    }
  };

  const featuredBook = books[0] || null;

  // Expanding Cards data for library collection genres
  const libraryCollections: CardItem[] = [
    {
      id: "tech-computing",
      title: "Technology & Computing",
      description:
        "Explore cutting-edge programming, software engineering, AI, data science, and cybersecurity resources for modern tech careers.",
      imgSrc:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
      icon: <Cpu size={24} />,
      linkHref: "#",
    },
    {
      id: "business-strategy",
      title: "Business & Strategy",
      description:
        "Discover leadership principles, entrepreneurship guides, marketing strategies, and organizational management bestsellers.",
      imgSrc:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
      icon: <Briefcase size={24} />,
      linkHref: "#",
    },
    {
      id: "literature-classics",
      title: "Literature & Classics",
      description:
        "Immerse yourself in timeless novels, poetry anthologies, contemporary fiction, and award-winning literary masterpieces.",
      imgSrc:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
      icon: <BookMarked size={24} />,
      linkHref: "#",
    },
    {
      id: "science-research",
      title: "Science & Research",
      description:
        "Access peer-reviewed journals, groundbreaking research papers, laboratory guides, and scientific methodology references.",
      imgSrc:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
      icon: <Lightbulb size={24} />,
      linkHref: "#",
    },
    {
      id: "history-culture",
      title: "History & Culture",
      description:
        "Journey through world history, anthropological studies, cultural heritage archives, and civilization documentaries.",
      imgSrc:
        "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&q=80",
      icon: <Globe size={24} />,
      linkHref: "#",
    },
    {
      id: "health-wellness",
      title: "Health & Wellness",
      description:
        "Browse medical textbooks, nutrition guides, mental health resources, and evidence-based wellness practices.",
      imgSrc:
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
      icon: <Heart size={24} />,
      linkHref: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans selection:bg-amber-800 selection:text-white flex flex-col">
      {/* 1. Global Public Navigation Header */}
      <PublicHeader
        activePage="home"
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
        onGoToMemberPortal={onGoToMemberPortal}
        onGoToAdminPanel={onGoToAdminPanel}
        memberUser={memberUser}
        adminUser={adminUser}
      />

      {/* 2. Hero Section matching image_feee1374.png (Split-Column) */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:py-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[11px] font-bold tracking-widest uppercase text-amber-900/80 font-mono">
                DISCOVER. READ. GROW.
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium tracking-tight text-[#17221E] leading-[1.12]">
                Books for every mind & moment.
              </h1>

              <p className="text-base text-stone-600 max-w-lg leading-relaxed font-sans">
                Your next favorite story or academic breakthrough is just a page away.
                Explore our university library collection powered by Python OOP and SQLite.
                Browse our dedicated Catalogue, Categories, and Bestseller collections publicly anytime.
              </p>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigatePage('catalogue')}
                  className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white bg-[#202B26] hover:bg-[#131A17] rounded-lg transition-colors shadow-md flex items-center gap-2"
                >
                  <span>EXPLORE CATALOGUE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigatePage('categories')}
                  className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors shadow-2xs flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-amber-700" />
                  <span>BROWSE CATEGORIES</span>
                </button>

                <button
                  onClick={() => onNavigatePage('bestsellers')}
                  className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>BESTSELLERS</span>
                </button>
              </div>

              {/* Social Proof Strip */}
              <div className="pt-4 flex items-center gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-amber-800 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
                    BW
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
                    ZK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-800 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
                    WK
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white">
                    HO
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-amber-500 text-xs gap-0.5">
                    {'★★★★★'.split('').map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </div>
                  <span className="text-xs text-stone-600 font-medium block -mt-0.5">
                    Loved by 850+ registered campus scholars
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase matching image_feee1374.png */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hardcover Stack Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] bg-stone-200">
                  <img
                    src={heroImgSrc}
                    alt="Stack of hardcover academic books with cup of coffee in warm library lighting"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating "New Arrivals" circular badge matching image_feee1374.png */}
                <div className="absolute -top-4 -right-4 sm:-right-6 w-24 h-24 rounded-full bg-[#1F2C27] text-white flex flex-col items-center justify-center text-center p-2 shadow-xl border-2 border-white transform rotate-6 hover:rotate-0 transition-transform">
                  <span className="font-serif italic text-amber-300 text-xs">New</span>
                  <span className="font-bold text-[11px] uppercase tracking-wider leading-none">Arrivals</span>
                  <span className="text-[9px] text-stone-300 mt-0.5">This Week!</span>
                </div>

                {/* Floating spotlight book preview card */}
                {featuredBook && (
                  <div className="absolute -bottom-6 left-4 right-4 sm:left-6 sm:right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-stone-200 shadow-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-14 shrink-0 rounded overflow-hidden shadow-xs">
                        <BookCoverView book={featuredBook} aspect="portrait" className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate">
                          {featuredBook.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate">
                          {featuredBook.authors?.join(', ') || 'Faculty Press'} · {featuredBook.available_copies} Available
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewBook(featuredBook)}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs whitespace-nowrap shrink-0 transition-colors"
                    >
                      Quick Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Expanding Cards: Explore Collection Genres */}
      <section className="py-16 bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              DISCOVER YOUR NEXT READ
            </span>
            <h2 className="text-3xl font-serif font-bold text-stone-900 mt-1">
              Explore Our Book Collections
            </h2>
            <p className="text-xs text-stone-600 mt-2">
              Browse thousands of titles across diverse academic disciplines and popular genres. Hover or tap to preview each collection.
            </p>
          </div>

          <div className="flex justify-center">
            <ExpandingCards items={libraryCollections} defaultActiveIndex={0} />
          </div>
        </div>
      </section>

      {/* 5. Three Dedicated Sections Navigation Cards (Uncrowded, Clean Overview) */}
      <section className="py-16 bg-[#F6F4F0] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              EXPLORE OUR ARCHIVES
            </span>
            <h2 className="text-3xl font-serif font-bold text-stone-900 mt-1">
              Dedicated Library Spaces
            </h2>
            <p className="text-xs text-stone-600 mt-2">
              Browse each collection in its own dedicated space without cluttering the homepage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Catalogue */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                  <Library className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  Academic Catalogue
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Search across our entire repository by title, author, or ISBN. Check real-time copy availability and shelf locations.
                </p>
                <div className="mt-4 text-xs font-semibold text-emerald-800">
                  {books.length} Total Titles in Circulation
                </div>
              </div>
              <button
                onClick={() => onNavigatePage('catalogue')}
                className="mt-6 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#1C2622] hover:bg-[#121A17] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>View Full Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2: Categories */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  Curriculum Categories
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Browse focused subjects including Technology, Applied Science, Business Strategy, Literature, and History.
                </p>
                <div className="mt-4 text-xs font-semibold text-amber-800">
                  {categories.length} Specialized Disciplines
                </div>
              </div>
              <button
                onClick={() => onNavigatePage('categories')}
                className="mt-6 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-2 border border-stone-300"
              >
                <span>Browse Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Bestsellers */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 stroke-[1.8] fill-rose-500 text-rose-500" />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-900">
                  Readers' Favorites
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Curated bestsellers and student favorites with the highest loan turnover and 5-star scholarly reviews.
                </p>
                <div className="mt-4 text-xs font-semibold text-rose-800">
                  Top Rated & Most Borrowed
                </div>
              </div>
              <button
                onClick={() => onNavigatePage('bestsellers')}
                className="mt-6 w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-2 border border-stone-300"
              >
                <span>View Bestsellers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Reading Community / Account Registration Banner */}
      <section className="relative py-20 overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImgSrc}
            alt="Cozy reading nook with open book and warm coffee mug"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/90 to-stone-950/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 font-mono">
            BE PART OF OUR READING COMMUNITY
          </span>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            Get Instant Access, Loan Tracking & Exclusive Book Picks
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            Create your account today to borrow books, reserve in-demand titles, and manage your patron dashboard.
            Both student member and administrative staff sign-in options are available.
          </p>

          <form onSubmit={handleQuickRegister} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your student email..."
              value={quickEmail}
              onChange={(e) => setQuickEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs rounded-lg bg-white/95 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1C2622] bg-[#E3A354] hover:bg-[#D49343] rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              CREATE ACCOUNT
            </button>
          </form>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-stone-300">
            <button onClick={onOpenMemberAuth} className="hover:text-white underline">
              Already a member? Sign In
            </button>
            <span>·</span>
            <button onClick={onOpenAdminAuth} className="hover:text-amber-300 underline font-semibold">
              Authorized Staff Login
            </button>
          </div>
        </div>
      </section>

      {/* 7. Institutional Footer */}
      <PublicFooter
        onNavigate={onNavigatePage}
        onOpenMemberAuth={onOpenMemberAuth}
        onOpenAdminAuth={onOpenAdminAuth}
        onOpenDefense={onOpenDefense}
      />

      {/* 8. Public Preview Modal */}
      <PublicBookModal
        book={previewBook}
        onClose={() => setPreviewBook(null)}
        onBorrow={handleBorrowClick}
      />
    </div>
  );
};
