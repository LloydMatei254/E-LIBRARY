import type {
  Admin,
  Author,
  Book,
  Borrowing,
  Category,
  DashboardMetrics,
  DBMSSchemaResponse,
  Fine,
  Member,
  OOPTestReport,
  Reservation,
} from '../types';
import type { Database, Json } from '../types/supabase';
import { getSupabaseClient } from './supabaseClient';
import { readWithOfflineFallback, requireNetworkForMutation } from './offlineCache';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type BookRow = Database['public']['Tables']['books']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type AuthorRow = Database['public']['Tables']['authors']['Row'];
type BorrowingRow = Database['public']['Tables']['borrowings']['Row'];
type FineRow = Database['public']['Tables']['fines']['Row'];
type ReservationRow = Database['public']['Tables']['reservations']['Row'];

const today = () => new Date().toISOString().slice(0, 10);
const dayDifference = (date: string, from = today()) =>
  Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

async function userCacheKey(resource: string, scope: string): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  throwIfError(error);
  return `${resource}:${data.session?.user.id ?? 'anonymous'}:${scope}`;
}

function asObject(value: Json, label: string): { [key: string]: Json | undefined } {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${label} returned an invalid response.`);
  }
  return value;
}

function mapMember(profile: ProfileRow): Member {
  return {
    member_id: profile.member_id,
    member_code: profile.member_code,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    status: profile.status,
    registered_at: profile.registered_at,
    role: profile.role,
  };
}

function mapAdmin(profile: ProfileRow): Admin {
  if (profile.role === 'member') {
    throw new Error('This account does not have library staff permissions.');
  }
  return {
    admin_id: profile.member_id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    created_at: profile.registered_at,
  };
}

function mapCategory(category: CategoryRow): Category {
  return {
    category_id: category.category_id,
    category_name: category.category_name,
    description: category.description,
  };
}

function mapAuthor(author: AuthorRow): Author {
  return {
    author_id: author.author_id,
    author_name: author.author_name,
    biography: author.biography,
  };
}

function mapBook(
  row: BookRow,
  categoryNames: Map<number, string>,
  authorNames: Map<number, string[]>,
): Book {
  return {
    book_id: row.book_id,
    isbn: row.isbn,
    title: row.title,
    category_id: row.category_id,
    category_name: categoryNames.get(row.category_id) ?? 'Uncategorized',
    publisher: row.publisher,
    publication_year: row.publication_year ?? undefined,
    language: row.language,
    pages: row.pages ?? undefined,
    total_copies: row.total_copies,
    available_copies: row.available_copies,
    authors: authorNames.get(row.book_id) ?? [],
    is_available: row.available_copies > 0,
    shelf_location: row.shelf_location,
    description: row.description,
    cover_image: row.cover_image,
    created_at: row.created_at,
  };
}

async function loadBooks(): Promise<Book[]> {
  const client = getSupabaseClient();
  const rows: BookRow[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from('books')
      .select('*')
      .order('book_id', { ascending: false })
      .range(offset, offset + pageSize - 1);
    throwIfError(error);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  if (rows.length === 0) return [];
  const bookIds = rows.map((book) => book.book_id);
  const categoryIds = [...new Set(rows.map((book) => book.category_id))];
  const [categoriesResult, linksResult] = await Promise.all([
    client.from('categories').select('*').in('category_id', categoryIds),
    client.from('book_authors').select('book_id, author_id').in('book_id', bookIds),
  ]);
  throwIfError(categoriesResult.error);
  throwIfError(linksResult.error);

  const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [
    category.category_id,
    category.category_name,
  ]));
  const links = linksResult.data ?? [];
  const authorIds = [...new Set(links.map((link) => link.author_id))];
  const authorsResult = authorIds.length
    ? await client.from('authors').select('*').in('author_id', authorIds)
    : { data: [], error: null };
  throwIfError(authorsResult.error);

  const authorNamesById = new Map((authorsResult.data ?? []).map((author) => [
    author.author_id,
    author.author_name,
  ]));
  const authorNamesByBook = new Map<number, string[]>();
  for (const link of links) {
    const name = authorNamesById.get(link.author_id);
    if (name) authorNamesByBook.set(link.book_id, [...(authorNamesByBook.get(link.book_id) ?? []), name]);
  }

  return rows.map((row) => mapBook(row, categoryNames, authorNamesByBook));
}

async function loadProfiles(memberIds: number[]): Promise<Map<number, ProfileRow>> {
  if (memberIds.length === 0) return new Map();
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('*')
    .in('member_id', [...new Set(memberIds)]);
  throwIfError(error);
  return new Map((data ?? []).map((profile) => [profile.member_id, profile]));
}

async function loadBooksById(bookIds: number[]): Promise<Map<number, BookRow>> {
  if (bookIds.length === 0) return new Map();
  const { data, error } = await getSupabaseClient()
    .from('books')
    .select('*')
    .in('book_id', [...new Set(bookIds)]);
  throwIfError(error);
  return new Map((data ?? []).map((book) => [book.book_id, book]));
}

async function loadActiveBorrowings(memberId?: number): Promise<Borrowing[]> {
  let query = getSupabaseClient()
    .from('borrowings')
    .select('*')
    .in('status', ['borrowed', 'overdue'])
    .order('due_date', { ascending: true });
  if (memberId !== undefined) query = query.eq('member_id', memberId);
  const { data, error } = await query;
  throwIfError(error);
  const rows = data ?? [];
  const [profiles, books] = await Promise.all([
    loadProfiles(rows.map((row) => row.member_id)),
    loadBooksById(rows.map((row) => row.book_id)),
  ]);

  return rows.map((row) => {
    const book = books.get(row.book_id);
    const daysRemaining = dayDifference(row.due_date);
    const overdueDays = Math.max(0, -daysRemaining);
    const isOverdue = overdueDays > 0 || row.status === 'overdue';
    return {
      borrowing_id: row.borrowing_id,
      member_id: row.member_id,
      member_name: profiles.get(row.member_id)?.full_name ?? 'Member',
      book_id: row.book_id,
      book_title: book?.title ?? 'Book',
      book_isbn: book?.isbn ?? '',
      issue_date: row.issue_date,
      due_date: row.due_date,
      status: isOverdue ? 'overdue' : row.status,
      is_overdue: isOverdue,
      days_remaining: isOverdue ? 0 : daysRemaining,
      overdue_days: overdueDays,
      estimated_fine: overdueDays * 50,
    };
  });
}

async function loadFines(memberId?: number): Promise<Fine[]> {
  let query = getSupabaseClient().from('fines').select('*').order('issued_date', { ascending: false });
  if (memberId !== undefined) query = query.eq('member_id', memberId);
  const { data: fineRows, error } = await query;
  throwIfError(error);

  const rows = fineRows ?? [];
  if (rows.length === 0) return [];
  let paymentQuery = getSupabaseClient()
    .from('fine_payments')
    .select('fine_id, status, created_at')
    .in('status', ['initiating', 'pending'])
    .order('created_at', { ascending: false });
  if (memberId !== undefined) paymentQuery = paymentQuery.eq('member_id', memberId);
  const { data: paymentRows, error: paymentError } = await paymentQuery;
  throwIfError(paymentError);
  const activePayments = new Map<number, 'initiating' | 'pending'>();
  for (const payment of paymentRows ?? []) {
    if (!activePayments.has(payment.fine_id) && (payment.status === 'initiating' || payment.status === 'pending')) {
      activePayments.set(payment.fine_id, payment.status);
    }
  }
  const borrowingIds = rows
    .map((fine) => fine.borrowing_id)
    .filter((id): id is number => id !== null);
  let borrowings: BorrowingRow[] = [];
  if (borrowingIds.length > 0) {
    const { data, error: borrowingsError } = await getSupabaseClient()
      .from('borrowings')
      .select('*')
      .in('borrowing_id', borrowingIds);
    throwIfError(borrowingsError);
    borrowings = data ?? [];
  }
  const borrowingById = new Map(borrowings.map((borrowing) => [borrowing.borrowing_id, borrowing]));
  const [profiles, books] = await Promise.all([
    loadProfiles(rows.map((fine) => fine.member_id)),
    loadBooksById(borrowings.map((borrowing) => borrowing.book_id)),
  ]);
  return rows.map((fine: FineRow) => {
    const borrowing = fine.borrowing_id === null ? undefined : borrowingById.get(fine.borrowing_id);
    return {
      fine_id: fine.fine_id,
      member_id: fine.member_id,
      borrowing_id: fine.borrowing_id ?? undefined,
      amount: Number(fine.amount),
      reason: fine.reason,
      status: fine.status,
      payment_status: activePayments.get(fine.fine_id),
      issued_date: fine.issued_date,
      paid_date: fine.paid_date ?? undefined,
      member_name: profiles.get(fine.member_id)?.full_name ?? 'Member',
      book_title: borrowing ? books.get(borrowing.book_id)?.title ?? 'Book' : 'Account fine',
    };
  });
}

async function loadReservations(memberId?: number): Promise<Reservation[]> {
  let query = getSupabaseClient()
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: false });
  if (memberId !== undefined) query = query.eq('member_id', memberId);
  const { data, error } = await query;
  throwIfError(error);
  const rows = data ?? [];
  const [profiles, books] = await Promise.all([
    loadProfiles(rows.map((row) => row.member_id)),
    loadBooksById(rows.map((row) => row.book_id)),
  ]);
  return rows.map((row: ReservationRow) => ({
    reservation_id: row.reservation_id,
    member_id: row.member_id,
    book_id: row.book_id,
    reservation_date: row.reservation_date,
    status: row.status,
    member_name: profiles.get(row.member_id)?.full_name ?? 'Member',
    book_title: books.get(row.book_id)?.title ?? 'Book',
  }));
}

async function loadProfileForAuthUser(authUserId: string): Promise<ProfileRow | null> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  throwIfError(error);
  return data;
}

async function profileForSession(authUserId: string): Promise<ProfileRow> {
  const profile = await readWithOfflineFallback(
    `profile:${authUserId}`,
    () => loadProfileForAuthUser(authUserId),
  );
  if (!profile) {
    throw new Error('Your sign-in is not linked to a library profile. Please contact the library staff.');
  }
  return profile;
}

function buildBookPayload(bookData: Partial<Book>): Json {
  return {
    isbn: bookData.isbn ?? '',
    title: bookData.title ?? '',
    category_id: bookData.category_id ?? null,
    publisher: bookData.publisher ?? '',
    publication_year: bookData.publication_year ?? null,
    language: bookData.language ?? 'English',
    pages: bookData.pages ?? null,
    total_copies: bookData.total_copies ?? 1,
    shelf_location: bookData.shelf_location ?? '',
    description: bookData.description ?? '',
    cover_image: bookData.cover_image ?? '',
    authors: bookData.authors ?? [],
  };
}

async function getBookByIdFromCache(id: number): Promise<Book> {
  const books = await readWithOfflineFallback('books:all', loadBooks);
  const book = books.find((item) => item.book_id === id);
  if (!book) throw new Error('Book not found.');
  return book;
}

function mapSchemaSummary(value: Json): DBMSSchemaResponse {
  const result = asObject(value, 'Schema summary');
  const rawTables = result.tables;
  if (!Array.isArray(rawTables)) throw new Error('Schema summary returned no table list.');
  return {
    db_type: String(result.db_type ?? 'Supabase PostgreSQL'),
    tables_count: Number(result.tables_count ?? rawTables.length),
    tables: rawTables.map((tableValue) => {
      const table = asObject(tableValue, 'Schema table');
      const columns = Array.isArray(table.columns) ? table.columns : [];
      const foreignKeys = Array.isArray(table.foreign_keys) ? table.foreign_keys : [];
      return {
        table_name: String(table.table_name ?? ''),
        record_count: Number(table.record_count ?? 0),
        columns: columns.map((columnValue) => {
          const column = asObject(columnValue, 'Schema column');
          return {
            cid: Number(column.cid ?? 0),
            name: String(column.name ?? ''),
            type: String(column.type ?? ''),
            notnull: Number(column.notnull ?? 0),
            pk: Number(column.pk ?? 0),
          };
        }),
        foreign_keys: foreignKeys.map((foreignKeyValue) => {
          const foreignKey = asObject(foreignKeyValue, 'Schema foreign key');
          return {
            table: String(foreignKey.table ?? ''),
            from: String(foreignKey.from ?? ''),
            to: String(foreignKey.to ?? ''),
          };
        }),
      };
    }),
  };
}

async function legacyGet<T>(path: string): Promise<T> {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
  if (!baseUrl) throw new Error('This feature is only available when the legacy API is configured.');
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`Legacy API request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export const supabaseApi = {
  async getDashboard(): Promise<DashboardMetrics> {
    const cacheKey = await userCacheKey('dashboard', 'overview');
    return readWithOfflineFallback(cacheKey, async () => {
      const [books, members, loans, categories, borrowingResult] = await Promise.all([
        supabaseApi.getBooks(),
        supabaseApi.getMembers(),
        supabaseApi.getActiveLoans(),
        supabaseApi.getCategories(),
        getSupabaseClient()
          .from('borrowings')
          .select('member_id, book_id, issue_date, return_date')
          .order('issue_date', { ascending: false }),
      ]);
      throwIfError(borrowingResult.error);
      const monthlyCounts = new Map<string, number>();
      for (const borrowing of borrowingResult.data ?? []) {
        const month = borrowing.issue_date.slice(0, 7);
        monthlyCounts.set(month, (monthlyCounts.get(month) ?? 0) + 1);
      }
      const currentMonth = new Date();
      const borrowingTrends = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 5 + index, 1);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return {
          period: `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`,
          count: monthlyCounts.get(month) ?? 0,
        };
      });
      const distribution = new Map<string, number>();
      for (const book of books) {
        const name = book.category_name ?? 'Uncategorized';
        distribution.set(name, (distribution.get(name) ?? 0) + 1);
      }
      const memberNames = new Map(members.map((member) => [member.member_id, member.full_name]));
      const bookTitles = new Map(books.map((book) => [book.book_id, book.title]));
      const recentTransactions = (borrowingResult.data ?? [])
        .flatMap((borrowing) => {
          const events = [{
            member: memberNames.get(borrowing.member_id) ?? 'Member',
            book: bookTitles.get(borrowing.book_id) ?? 'Book',
            action: 'Borrowed',
            date: borrowing.issue_date,
          }];
          if (borrowing.return_date) {
            events.push({
              member: memberNames.get(borrowing.member_id) ?? 'Member',
              book: bookTitles.get(borrowing.book_id) ?? 'Book',
              action: 'Returned',
              date: borrowing.return_date,
            });
          }
          return events;
        })
        .sort((left, right) => right.date.localeCompare(left.date))
        .slice(0, 5);
      return {
        total_books: books.length,
        total_copies: books.reduce((total, book) => total + book.total_copies, 0),
        members: members.length,
        books_issued: loans.length,
        overdue_books: loans.filter((loan) => loan.is_overdue).length,
        borrowing_trends: borrowingTrends,
        category_distribution: categories.map((category) => ({
          name: category.category_name,
          count: distribution.get(category.category_name) ?? 0,
        })),
        recent_transactions: recentTransactions,
      };
    });
  },

  async getBooks(params?: { category_id?: number; search?: string; available_only?: boolean }): Promise<Book[]> {
    const books = await readWithOfflineFallback('books:all', loadBooks);
    const search = params?.search?.trim().toLocaleLowerCase();
    return books.filter((book) => {
      if (params?.category_id && book.category_id !== params.category_id) return false;
      if (params?.available_only && book.available_copies < 1) return false;
      if (!search) return true;
      return [
        book.title,
        book.isbn,
        book.publisher,
        book.category_name,
        ...book.authors,
      ].some((value) => value?.toLocaleLowerCase().includes(search));
    });
  },

  async getBookById(id: number): Promise<Book> {
    return getBookByIdFromCache(id);
  },

  async addBook(bookData: Partial<Book> & { admin_id?: number }): Promise<Book> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('save_book', {
      p_book_id: null,
      p_payload: buildBookPayload(bookData),
    });
    throwIfError(error);
    if (!data) throw new Error('The book could not be saved.');
    return getBookByIdFromCache(data);
  },

  async updateBook(id: number, bookData: Partial<Book>): Promise<Book> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('save_book', {
      p_book_id: id,
      p_payload: buildBookPayload(bookData),
    });
    throwIfError(error);
    if (!data) throw new Error('The book could not be updated.');
    return getBookByIdFromCache(data);
  },

  async uploadBookCover(file: File, categoryId: number): Promise<string> {
    requireNetworkForMutation();

    const extensionByType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensionByType[file.type];
    if (!extension) throw new Error('Choose a JPEG, PNG, or WebP image.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Cover images must be 5 MB or smaller.');
    if (!Number.isInteger(categoryId) || categoryId < 1) throw new Error('Choose a valid book category.');

    const storage = getSupabaseClient().storage.from('book-covers');
    const directory = `categories/${categoryId}`;
    const objectPath = `${directory}/${crypto.randomUUID()}.${extension}`;
    const { data: canUpload, error: permissionError } = await getSupabaseClient().rpc('can_upload_book_cover', {
      p_object_name: objectPath,
    });
    throwIfError(permissionError);
    if (!canUpload) {
      throw new Error('This account cannot upload covers, or this category already has 50 images. Remove one from Supabase Storage before adding another.');
    }

    const { error: uploadError } = await storage.upload(objectPath, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });
    throwIfError(uploadError);

    return storage.getPublicUrl(objectPath).data.publicUrl;
  },

  async deleteBook(id: number): Promise<boolean> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient()
      .from('books')
      .delete()
      .eq('book_id', id)
      .select('book_id')
      .maybeSingle();
    throwIfError(error);
    if (!data) throw new Error('Book not found or could not be deleted.');
    return true;
  },

  async getCategories(): Promise<Category[]> {
    return readWithOfflineFallback('categories:all', async () => {
      const { data, error } = await getSupabaseClient().from('categories').select('*').order('category_name');
      throwIfError(error);
      return (data ?? []).map(mapCategory);
    });
  },

  async addCategory(name: string, description = ''): Promise<Category> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient()
      .from('categories')
      .insert({ category_name: name, description })
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('The category could not be created.');
    return mapCategory(data);
  },

  async deleteCategory(id: number): Promise<boolean> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient()
      .from('categories')
      .delete()
      .eq('category_id', id)
      .select('category_id')
      .maybeSingle();
    throwIfError(error);
    if (!data) throw new Error('Category not found or could not be deleted.');
    return true;
  },

  async getAuthors(): Promise<Author[]> {
    return readWithOfflineFallback('authors:all', async () => {
      const { data, error } = await getSupabaseClient().from('authors').select('*').order('author_name');
      throwIfError(error);
      return (data ?? []).map(mapAuthor);
    });
  },

  async addAuthor(name: string, biography = ''): Promise<Author> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient()
      .from('authors')
      .insert({ author_name: name, biography })
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('The author could not be created.');
    return mapAuthor(data);
  },

  async deleteAuthor(id: number): Promise<boolean> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient()
      .from('authors')
      .delete()
      .eq('author_id', id)
      .select('author_id')
      .maybeSingle();
    throwIfError(error);
    if (!data) throw new Error('Author not found or could not be deleted.');
    return true;
  },

  async getReports() {
    const cacheKey = await userCacheKey('reports', 'overview');
    return readWithOfflineFallback(cacheKey, async () => {
      const [activeLoans, fines, borrowingResult] = await Promise.all([
        supabaseApi.getActiveLoans(),
        supabaseApi.getFines(),
        getSupabaseClient().from('borrowings').select('book_id, status'),
      ]);
      throwIfError(borrowingResult.error);
      const allBorrowings = borrowingResult.data ?? [];
      const bookCounts = new Map<number, number>();
      for (const borrowing of allBorrowings) {
        bookCounts.set(borrowing.book_id, (bookCounts.get(borrowing.book_id) ?? 0) + 1);
      }
      const books = await supabaseApi.getBooks();
      const titleById = new Map(books.map((book) => [book.book_id, book.title]));
      return {
        active_loans: activeLoans.length,
        overdue_loans: activeLoans.filter((loan) => loan.is_overdue).length,
        returned_loans: allBorrowings.filter((borrowing) => borrowing.status === 'returned').length,
        total_collected_fines: fines.filter((fine) => fine.status === 'paid').reduce((sum, fine) => sum + fine.amount, 0),
        outstanding_fines: fines.filter((fine) => fine.status === 'unpaid').reduce((sum, fine) => sum + fine.amount, 0),
        top_borrowed_books: [...bookCounts.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([bookId, count]) => ({ title: titleById.get(bookId) ?? 'Book', count })),
      };
    });
  },

  async updateReservationStatus(id: number, status: string): Promise<boolean> {
    requireNetworkForMutation();
    if (!['fulfilled', 'cancelled', 'expired'].includes(status)) {
      throw new Error('Reservation status is invalid.');
    }
    const { data, error } = await getSupabaseClient()
      .from('reservations')
      .update({ status: status as ReservationRow['status'] })
      .eq('reservation_id', id)
      .select('reservation_id')
      .maybeSingle();
    throwIfError(error);
    if (!data) throw new Error('Reservation not found or could not be updated.');
    return true;
  },

  async getMembers(params?: { search?: string; status?: string }): Promise<Member[]> {
    const cacheKey = await userCacheKey('members', 'all');
    const members = await readWithOfflineFallback(cacheKey, async () => {
      const { data, error } = await getSupabaseClient().from('profiles').select('*').order('full_name');
      throwIfError(error);
      return (data ?? []).map(mapMember);
    });
    const search = params?.search?.trim().toLocaleLowerCase();
    return members.filter((member) => {
      if (member.role !== 'member') return false;
      if (params?.status && member.status !== params.status) return false;
      if (!search) return true;
      return [member.full_name, member.email, member.member_code]
        .some((value) => value?.toLocaleLowerCase().includes(search));
    });
  },

  async updateMemberStatus(memberId: number, status: string): Promise<boolean> {
    requireNetworkForMutation();
    if (!['active', 'suspended', 'inactive'].includes(status)) {
      throw new Error('Member status is invalid.');
    }
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .update({ status: status as ProfileRow['status'] })
      .eq('member_id', memberId)
      .select('member_id')
      .maybeSingle();
    throwIfError(error);
    if (!data) throw new Error('Member not found or could not be updated.');
    return true;
  },

  async updateMemberDetails(memberId: number, details: { full_name: string; phone: string }): Promise<boolean> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('update_member_details', {
      p_member_id: memberId,
      p_full_name: details.full_name,
      p_phone: details.phone,
    });
    throwIfError(error);
    if (!data) throw new Error('Member profile was not updated.');
    return true;
  },

  async addMemberFine(memberId: number, amount: number, reason: string): Promise<number> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('add_member_fine', {
      p_member_id: memberId,
      p_amount: amount,
      p_reason: reason,
    });
    throwIfError(error);
    if (data === null) throw new Error('The fine could not be added.');
    return data;
  },

  async loginAdmin(email: string, password: string): Promise<Admin> {
    requireNetworkForMutation();
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    throwIfError(error);
    if (!data.user) throw new Error('Staff sign-in did not return a user.');
    const profile = await profileForSession(data.user.id);
    if (profile.role === 'member' || profile.status !== 'active') {
      await client.auth.signOut({ scope: 'local' });
      throw new Error('An active staff profile is required for staff sign-in.');
    }
    return mapAdmin(profile);
  },

  async loginMember(email: string, password: string): Promise<Member> {
    requireNetworkForMutation();
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    throwIfError(error);
    if (!data.user) throw new Error('Member sign-in did not return a user.');
    const profile = await profileForSession(data.user.id);
    if (profile.role !== 'member' || profile.status !== 'active') {
      await client.auth.signOut({ scope: 'local' });
      throw new Error('An active member profile is required for member sign-in.');
    }
    return mapMember(profile);
  },

  async registerMember(payload: { full_name: string; email: string; phone: string; password?: string }): Promise<Member | null> {
    requireNetworkForMutation();
    const client = getSupabaseClient();
    if (payload.password) {
      const { data, error } = await client.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: { data: { full_name: payload.full_name, phone: payload.phone } },
      });
      throwIfError(error);
      if (!data.user || !data.session) return null;
      return mapMember(await profileForSession(data.user.id));
    }

    const { data, error } = await client
      .from('profiles')
      .insert({ full_name: payload.full_name, email: payload.email, phone: payload.phone })
      .select('*')
      .single();
    throwIfError(error);
    if (!data) throw new Error('The member profile could not be created.');
    return mapMember(data);
  },

  async sendPasswordReset(email: string): Promise<void> {
    requireNetworkForMutation();
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    throwIfError(error);
  },

  async updatePassword(password: string): Promise<void> {
    requireNetworkForMutation();
    const client = getSupabaseClient();
    const { error } = await client.auth.updateUser({ password });
    throwIfError(error);
    const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
    throwIfError(signOutError);
  },

  async getCurrentAccount(): Promise<{ member: Member | null; admin: Admin | null }> {
    const { data, error } = await getSupabaseClient().auth.getSession();
    throwIfError(error);
    if (!data.session?.user) return { member: null, admin: null };
    const profile = await profileForSession(data.session.user.id);
    if (profile.status !== 'active') {
      await getSupabaseClient().auth.signOut({ scope: 'local' });
      return { member: null, admin: null };
    }
    if (profile.role === 'member') return { member: mapMember(profile), admin: null };
    return { member: null, admin: mapAdmin(profile) };
  },

  async signOut(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
    throwIfError(error);
  },

  async issueBook(memberIdentifier: string, bookIdentifier: string): Promise<Record<string, Json | undefined>> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('issue_book', {
      p_member_identifier: memberIdentifier,
      p_book_identifier: bookIdentifier,
      p_loan_days: 14,
    });
    throwIfError(error);
    return asObject(data, 'Issue transaction');
  },

  async returnBook(
    bookIdentifier: string,
    condition = 'Good',
    damageFee = 0,
    borrowingId?: number,
  ): Promise<Record<string, Json | undefined>> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('return_book', {
      p_book_identifier: bookIdentifier,
      p_condition: condition,
      p_damage_fee: damageFee,
      p_borrowing_id: borrowingId ?? null,
    });
    throwIfError(error);
    return asObject(data, 'Return transaction');
  },

  async getActiveLoans(memberId?: number): Promise<Borrowing[]> {
    const cacheKey = await userCacheKey('loans', String(memberId ?? 'all'));
    return readWithOfflineFallback(cacheKey, () => loadActiveBorrowings(memberId));
  },

  async getFines(memberId?: number): Promise<Fine[]> {
    const cacheKey = await userCacheKey('fines-v2', String(memberId ?? 'all'));
    return readWithOfflineFallback(cacheKey, () => loadFines(memberId));
  },

  async payFine(fineId: number): Promise<boolean> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('mark_fine_paid', { p_fine_id: fineId });
    throwIfError(error);
    if (data === null) throw new Error('The fine payment could not be recorded.');
    if (!data) throw new Error('The fine is already paid or could not be found.');
    return data;
  },

  async requestFinePayment(fineId: number, phone: string): Promise<{ message: string }> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().functions.invoke<{ message?: string; error?: string }>('mpesa-stk', {
      body: { fine_id: fineId, phone },
    });
    if (error) throw new Error(error.message || 'Could not start the M-Pesa payment.');
    if (!data || data.error || !data.message) {
      throw new Error(data?.error || 'M-Pesa did not return a payment confirmation.');
    }
    return { message: data.message };
  },

  async getReservations(memberId?: number): Promise<Reservation[]> {
    const cacheKey = await userCacheKey('reservations', String(memberId ?? 'all'));
    return readWithOfflineFallback(cacheKey, () => loadReservations(memberId));
  },

  async createReservation(memberId: number, bookId: number): Promise<Record<string, Json | undefined>> {
    requireNetworkForMutation();
    const { data, error } = await getSupabaseClient().rpc('reserve_book', {
      p_member_id: memberId,
      p_book_id: bookId,
    });
    throwIfError(error);
    return asObject(data, 'Reservation');
  },

  async getSchema(): Promise<DBMSSchemaResponse> {
    const { data, error } = await getSupabaseClient().rpc('get_schema_summary');
    throwIfError(error);
    return mapSchemaSummary(data);
  },

  async executeSql(): Promise<never> {
    throw new Error('Direct SQL execution is disabled in the live library portal.');
  },

  async runOOPTests(): Promise<OOPTestReport> {
    return legacyGet<OOPTestReport>('/api/test-oop');
  },

  async getCodeBundle(): Promise<{ bundle: { filename: string; title: string; content: string }[] }> {
    return legacyGet('/api/code-bundle');
  },

  subscribeToMemberUpdates(memberId: number, onChange: () => void): () => void {
    const client = getSupabaseClient();
    const channel = client
      .channel(`member-library-updates-${memberId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'borrowings',
        filter: `member_id=eq.${memberId}`,
      }, onChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reservations',
        filter: `member_id=eq.${memberId}`,
      }, onChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fines',
        filter: `member_id=eq.${memberId}`,
      }, onChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fine_payments',
        filter: `member_id=eq.${memberId}`,
      }, onChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `member_id=eq.${memberId}`,
      }, onChange)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Library live updates could not connect (${status}).`);
        }
      });
    return () => {
      void client.removeChannel(channel).catch((error: unknown) => {
        console.error('Could not close the library live updates channel.', error);
      });
    };
  },

  subscribeToAdminUpdates(onChange: () => void): () => void {
    const client = getSupabaseClient();
    const channel = client.channel('library-admin-live-updates');
    for (const table of ['borrowings', 'profiles', 'books', 'categories', 'fines', 'reservations'] as const) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange);
    }
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`Admin dashboard live updates could not connect (${status}).`);
      }
    });
    return () => {
      void client.removeChannel(channel).catch((error: unknown) => {
        console.error('Could not close the admin dashboard live updates channel.', error);
      });
    };
  },
};
