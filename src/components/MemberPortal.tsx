import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BookOpen,
  BookmarkCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  HelpCircle,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  Settings,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import { Borrowing, Fine, Member, Reservation } from '../types';
import { api } from '../services/api';
import { isDemoMode } from '../services/supabaseClient';

type PortalSection = 'overview' | 'books' | 'fines' | 'reservations' | 'profile' | 'settings';

interface MemberPortalProps {
  member: Member;
  onNavigateToCatalog: () => void;
  onLogout: () => void;
}

interface PortalPreferences {
  dueDateReminders: boolean;
  accountUpdates: boolean;
}

const defaultPreferences: PortalPreferences = {
  dueDateReminders: true,
  accountUpdates: true,
};

const navItems: { id: PortalSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'books', label: 'Borrowed books', icon: BookOpen },
  { id: 'fines', label: 'Fines & payments', icon: CircleDollarSign },
  { id: 'reservations', label: 'Reservations', icon: BookmarkCheck },
  { id: 'profile', label: 'My profile', icon: UserRound },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const formatDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const daysUntil = (value: string) => {
  const due = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
};

const readPreferences = (): PortalPreferences => {
  try {
    const saved = localStorage.getItem('member-portal-preferences');
    if (!saved) return defaultPreferences;
    const parsed: Partial<PortalPreferences> = JSON.parse(saved);
    return {
      dueDateReminders: typeof parsed.dueDateReminders === 'boolean' ? parsed.dueDateReminders : true,
      accountUpdates: typeof parsed.accountUpdates === 'boolean' ? parsed.accountUpdates : true,
    };
  } catch (error) {
    console.error('Could not load member portal preferences.', error);
    return defaultPreferences;
  }
};

export const MemberPortal: React.FC<MemberPortalProps> = ({ member, onNavigateToCatalog, onLogout }) => {
  const [profile, setProfile] = useState(member);
  const [section, setSection] = useState<PortalSection>('overview');
  const [loans, setLoans] = useState<Borrowing[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean } | null>(null);
  const [preferences, setPreferences] = useState<PortalPreferences>(readPreferences);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [payingFine, setPayingFine] = useState<Fine | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState(member.phone);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError(null);
    try {
      const [allLoans, memberFines, memberReservations] = await Promise.all([
        api.getActiveLoans(profile.member_id),
        api.getFines(profile.member_id),
        api.getReservations(profile.member_id),
      ]);
      setLoans(allLoans.filter((loan) => loan.member_id === profile.member_id));
      setFines(memberFines);
      setReservations(memberReservations);
    } catch (error) {
      console.error('Could not load member portal data.', error);
      setLoadError(error instanceof Error ? error.message : 'We could not load your library account.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void loadData();
    const unsubscribe = api.subscribeToMemberUpdates(profile.member_id, () => {
      if (!active) return;
      void loadData(false);
      void api.getCurrentAccount()
        .then((account) => {
          if (!active) return;
          if (account.member) setProfile(account.member);
          else onLogoutRef.current();
        })
        .catch((error: unknown) => console.error('Could not refresh the member profile.', error));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [profile.member_id]);

  useEffect(() => {
    setProfile(member);
  }, [member]);

  const handleSavePreferences = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      localStorage.setItem('member-portal-preferences', JSON.stringify(preferences));
      setFeedback({ message: 'Your notification preferences have been saved.' });
    } catch (error) {
      console.error('Could not save member portal preferences.', error);
      setFeedback({ message: 'Preferences could not be saved in this browser.', error: true });
    }
  };

  const handleRequestFinePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payingFine) return;
    setRequestingPayment(true);
    setFeedback(null);
    try {
      const result = await api.requestFinePayment(payingFine.fine_id, mpesaPhone);
      setFeedback({ message: result.message });
      setPayingFine(null);
      void loadData(false);
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : 'Could not start the M-Pesa payment.',
        error: true,
      });
    } finally {
      setRequestingPayment(false);
    }
  };

  const unpaidFinesTotal = fines
    .filter((fine) => fine.status === 'unpaid')
    .reduce((sum, fine) => sum + fine.amount, 0);
  const dueSoonCount = loans.filter((loan) => {
    const days = daysUntil(loan.due_date);
    return !loan.is_overdue && loan.status !== 'overdue' && days !== null && days >= 0 && days <= 3;
  }).length;
  const activeReservations = reservations.filter((reservation) => reservation.status === 'pending').length;
  const title = navItems.find((item) => item.id === section)?.label ?? 'Overview';
  const initials = profile.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  const selectSection = (nextSection: PortalSection) => {
    setSection(nextSection);
    setFeedback(null);
    setMobileNavOpen(false);
  };

  const navigation = (
    <nav aria-label="Member portal" className="space-y-1">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => selectSection(id)}
          aria-current={section === id ? 'page' : undefined}
          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
            section === id
              ? 'bg-white/10 font-semibold text-white'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Icon className={`h-[18px] w-[18px] ${section === id ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className="flex-1">{label}</span>
          {id === 'fines' && unpaidFinesTotal > 0 && (
            <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
              Due
            </span>
          )}
        </button>
      ))}
    </nav>
  );

  const pageHeading = (heading: string, description: string, action?: React.ReactNode) => (
    <div className="mb-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Member portal</p>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{heading}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  const statusPill = (label: string, tone: 'green' | 'amber' | 'red' | 'slate') => {
    const tones = {
      green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      amber: 'bg-amber-50 text-amber-700 ring-amber-200',
      red: 'bg-rose-50 text-rose-700 ring-rose-200',
      slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{label}</span>;
  };

  const bookRow = (loan: Borrowing) => {
    const days = daysUntil(loan.due_date);
    const overdue = loan.is_overdue || loan.status === 'overdue' || (days !== null && days < 0);
    const dueLabel = overdue
      ? 'Overdue'
      : days === 0
        ? 'Due today'
        : days === 1
          ? 'Due tomorrow'
          : days === null
            ? 'Due date'
            : `${days} days left`;
    return (
      <div key={loan.borrowing_id} className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{loan.book_title}</p>
            <p className="mt-1 text-xs text-slate-500">
              Issued {formatDate(loan.issue_date)} <span className="mx-1.5 text-slate-300">·</span> Due {formatDate(loan.due_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className={`text-xs font-medium ${overdue ? 'text-rose-600' : 'text-slate-500'}`}>
            <Clock3 className="mr-1 inline h-3.5 w-3.5" />
            {dueLabel}
          </span>
          {overdue ? statusPill('Overdue', 'red') : statusPill('On loan', 'green')}
        </div>
      </div>
    );
  };

  const fineRows = (items: Fine[]) => items.map((fine) => (
    <div key={fine.fine_id} className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-slate-900">{fine.book_title}</p>
        <p className="mt-1 text-xs text-slate-500">{fine.reason} <span className="mx-1.5 text-slate-300">·</span> {formatDate(fine.issued_date)}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="font-semibold tabular-nums text-slate-900">KES {fine.amount.toFixed(2)}</span>
        {fine.status === 'unpaid' ? (
          fine.payment_status
            ? statusPill(
                fine.payment_status === 'initiating' ? 'Starting M-Pesa prompt' : 'M-Pesa prompt sent',
                'amber',
              )
            : isDemoMode
            ? statusPill('Unpaid', 'amber')
            : <button
                type="button"
                onClick={() => {
                  setMpesaPhone(profile.phone);
                  setPayingFine(fine);
                }}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                Pay with M-Pesa
              </button>
        ) : statusPill('Paid', 'green')}
      </div>
    </div>
  ));

  const emptyState = (message: string) => (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <BookOpen className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  );

  const renderOverview = () => (
    <>
      {pageHeading(
        `Welcome back, ${profile.full_name.split(' ')[0]}`,
        'Here’s what’s happening with your library account.',
        <button
          type="button"
          onClick={onNavigateToCatalog}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
        >
          Browse catalogue <ArrowUpRight className="h-4 w-4" />
        </button>,
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Books on loan', value: loans.length, detail: 'of 5 available loans', icon: BookOpen, tone: 'emerald' },
          { label: 'Due in 3 days', value: dueSoonCount, detail: 'Keep an eye on these', icon: CalendarDays, tone: 'blue' },
          { label: 'Outstanding fines', value: `KES ${unpaidFinesTotal.toFixed(0)}`, detail: unpaidFinesTotal > 0 ? 'Payment required' : 'Account is clear', icon: CircleDollarSign, tone: 'amber' },
          { label: 'Reservations', value: activeReservations, detail: 'Awaiting availability', icon: BookmarkCheck, tone: 'violet' },
        ].map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
                  tone === 'blue' ? 'bg-blue-50 text-blue-700' :
                    tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'
              }`}><Icon className="h-5 w-5" /></span>
            </div>
            <p className="mt-3 text-xs text-slate-400">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,1fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">My borrowed books</h2>
              <p className="mt-0.5 text-xs text-slate-500">{loans.length} active {loans.length === 1 ? 'loan' : 'loans'}</p>
            </div>
            <button type="button" onClick={() => selectSection('books')} className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5">
            {loans.length ? loans.slice(0, 4).map(bookRow) : emptyState('You do not have any books on loan yet.')}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Account details</h2>
              <button type="button" onClick={() => selectSection('profile')} aria-label="View profile" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{profile.full_name}</p>
                <p className="truncate text-xs text-slate-500">{profile.member_code || `M${String(profile.member_id).padStart(4, '0')}`}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="truncate">{profile.email}</p>
              <p className="mt-2">Member since {formatDate(profile.registered_at)}</p>
            </div>
          </section>

          <section className="rounded-xl bg-[#29384d] p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 text-emerald-300">
              <HelpCircle className="h-5 w-5" />
              <h2 className="font-semibold text-white">Need a hand?</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">Our library team can help with renewals, reservations, and account questions.</p>
            <a href="mailto:librarian@library.ac.ke" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200">
              Contact the library <ArrowUpRight className="h-4 w-4" />
            </a>
          </section>
        </div>
      </div>
    </>
  );

  const renderBooks = () => (
    <>
      {pageHeading('Borrowed books', 'Keep track of your current loans and return dates.')}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">Current loans</h2>
            <p className="mt-0.5 text-xs text-slate-500">Please return each book by its due date.</p>
          </div>
          <span className="text-xs text-slate-500">{loans.length} of 5 books borrowed</span>
        </div>
        <div className="px-5">{loans.length ? loans.map(bookRow) : emptyState('You do not have any books on loan yet.')}</div>
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" onClick={onNavigateToCatalog} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Browse the catalogue <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </>
  );

  const renderFines = () => (
    <>
      {pageHeading('Fines & payments', 'Review your account charges and payment history.')}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Amount due</p>
          <p className={`mt-2 text-2xl font-bold ${unpaidFinesTotal > 0 ? 'text-rose-600' : 'text-slate-900'}`}>KES {unpaidFinesTotal.toFixed(2)}</p>
          <p className="mt-2 text-xs text-slate-400">{unpaidFinesTotal > 0 ? 'Payment is recorded by library staff.' : 'Your account has no outstanding fines.'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Payment status</p>
          <div className="mt-3">{unpaidFinesTotal > 0 ? statusPill('Action required', 'amber') : statusPill('All clear', 'green')}</div>
          <p className="mt-2 text-xs text-slate-400">Please visit the library desk to pay an outstanding fine.</p>
        </div>
      </div>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Fine history</h2>
        </div>
        <div className="px-5">{fines.length ? fineRows(fines) : emptyState('There are no fines on your account.')}</div>
      </section>
    </>
  );

  const renderReservations = () => (
    <>
      {pageHeading('Reservations', 'Check the status of books you have requested.')}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">My reservations</h2>
        </div>
        {reservations.length ? (
          <div className="divide-y divide-slate-100">
            {reservations.map((reservation) => (
              <div key={reservation.reservation_id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><BookmarkCheck className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold text-slate-900">{reservation.book_title}</p>
                    <p className="mt-1 text-xs text-slate-500">Requested {formatDate(reservation.reservation_date)}</p>
                  </div>
                </div>
                {statusPill(reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1), reservation.status === 'fulfilled' ? 'green' : reservation.status === 'pending' ? 'amber' : 'slate')}
              </div>
            ))}
          </div>
        ) : emptyState('You do not have any reservations yet.')}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" onClick={onNavigateToCatalog} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Find a book to reserve <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </>
  );

  const renderProfile = () => (
    <>
      {pageHeading('My profile', 'Your library membership details.')}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800">{initials}</div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{profile.full_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{statusPill(profile.status.charAt(0).toUpperCase() + profile.status.slice(1), profile.status === 'active' ? 'green' : 'amber')}</p>
          </div>
        </div>
        <dl className="grid gap-x-8 sm:grid-cols-2">
          {[
            ['Member ID', profile.member_code || `M${String(profile.member_id).padStart(4, '0')}`],
            ['Email address', profile.email],
            ['Phone number', profile.phone || 'Not provided'],
            ['Membership type', profile.role || 'Member'],
            ['Registered', formatDate(profile.registered_at)],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-slate-100 px-6 py-4">
              <dt className="text-xs font-medium text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="px-6 py-4 text-xs text-slate-500">To update your contact details, please contact the library desk.</p>
      </section>
    </>
  );

  const renderSettings = () => (
    <>
      {pageHeading('Settings', 'Choose which account updates you would like to receive.')}
      <form onSubmit={handleSavePreferences} className="max-w-3xl space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
              <h2 className="font-semibold text-slate-900">Notifications</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100 px-5">
            {[
              { key: 'dueDateReminders' as const, label: 'Due date reminders', detail: 'Get a reminder before a borrowed book is due.' },
              { key: 'accountUpdates' as const, label: 'Account updates', detail: 'Receive updates about reservations and library notices.' },
            ].map(({ key, label, detail }) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-5 py-5">
                <span>
                  <span className="block text-sm font-medium text-slate-800">{label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{detail}</span>
                </span>
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
              </label>
            ))}
          </div>
        </section>
        <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800">
          Save preferences
        </button>
      </form>
    </>
  );

  const renderSection = () => {
    switch (section) {
      case 'books': return renderBooks();
      case 'fines': return renderFines();
      case 'reservations': return renderReservations();
      case 'profile': return renderProfile();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#29384d] text-white md:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white"><LibraryBig className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-bold tracking-wide">BERZOWANLEY</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Library portal</p>
          </div>
        </div>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Your account</p>
          {navigation}
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
          <p className="mt-4 px-3 text-[10px] text-slate-500">Berzowanley Online Library</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden">
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-500">Your library account</p>
                <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <button type="button" onClick={() => selectSection('fines')} aria-label="View account alerts" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <Bell className="h-5 w-5" />
                {unpaidFinesTotal > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
              </button>
              <span className="hidden h-8 w-px bg-slate-200 sm:block" />
              <button type="button" onClick={() => selectSection('profile')} className="flex items-center gap-2.5 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{initials}</span>
                <span className="hidden sm:block">
                  <span className="block max-w-40 truncate text-sm font-semibold text-slate-800">{profile.full_name}</span>
                  <span className="block text-[11px] text-slate-500">Library member</span>
                </span>
              </button>
              <button type="button" onClick={onLogout} aria-label="Sign out" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          {mobileNavOpen && (
            <div className="border-t border-slate-200 bg-[#29384d] p-3 md:hidden">
              {navigation}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 py-7 sm:px-7 sm:py-8 lg:px-9">
          <div className="mx-auto max-w-[1400px]">
            {feedback && (
              <div role="status" className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                feedback.error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}>
                {feedback.error ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}
            {loadError && (
              <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <span>{loadError}</span>
                <button type="button" onClick={() => void loadData()} className="font-semibold underline underline-offset-2">Try again</button>
              </div>
            )}
            {loading ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  Loading your library account…
                </div>
              </div>
            ) : renderSection()}
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-7">
          <span>Berzowanley Online Library System</span>
          <span className="mx-2 text-slate-300">·</span>
          <button type="button" onClick={() => selectSection('settings')} className="hover:text-emerald-700">Account settings</button>
          <span className="mx-2 text-slate-300">·</span>
          <a href="mailto:librarian@library.ac.ke" className="hover:text-emerald-700">Contact support</a>
        </footer>
      </div>
      {payingFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mpesa-payment-heading"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <h2 id="mpesa-payment-heading" className="text-lg font-semibold text-slate-900">Pay fine with M-Pesa</h2>
            <p className="mt-2 text-sm text-slate-600">
              KES {payingFine.amount.toFixed(2)} for {payingFine.book_title}. Enter the phone number that should receive the STK prompt.
            </p>
            <form onSubmit={handleRequestFinePayment} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700" htmlFor="mpesa-phone">
                M-Pesa phone number
                <input
                  id="mpesa-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={mpesaPhone}
                  onChange={(event) => setMpesaPhone(event.target.value)}
                  placeholder="0712345678 or +254712345678"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <p className="text-xs text-slate-500">A payment prompt will appear on that phone. Approve it using your M-Pesa PIN.</p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={requestingPayment}
                  onClick={() => setPayingFine(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingPayment}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {requestingPayment ? 'Sending prompt…' : 'Send M-Pesa prompt'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
