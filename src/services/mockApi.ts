import {
  Admin,
  Author,
  Book,
  Borrowing,
  Category,
  Fine,
  Member,
  Reservation,
} from '../types';
import { mockBooks, mockCategories } from '../data/mockBooks';

const books: Book[] = mockBooks.map((book) => ({
  ...book,
  authors: [...book.authors],
  is_available: book.available_copies > 0,
}));
const categories: Category[] = mockCategories.map((category) => ({ ...category }));
const authors: Author[] = Array.from(new Set(books.flatMap((book) => book.authors))).map(
  (author_name, index) => ({ author_id: index + 1, author_name, biography: 'Library catalogue contributor.' }),
);
const members: Member[] = [
  {
    member_id: 1,
    member_code: 'M0001',
    full_name: 'Beatrice Wanjiku',
    email: 'beatrice.w@student.ac.ke',
    phone: '+254 712 345 678',
    status: 'active',
    registered_at: '2025-01-15',
    role: 'member',
  },
  {
    member_id: 2,
    member_code: 'M0002',
    full_name: 'Zora Kiprop',
    email: 'zora.kiprop@student.ac.ke',
    phone: '+254 723 456 789',
    status: 'active',
    registered_at: '2025-02-02',
    role: 'member',
  },
  {
    member_id: 3,
    member_code: 'M0003',
    full_name: 'Wangui Kamau',
    email: 'wangui.k@student.ac.ke',
    phone: '+254 734 567 890',
    status: 'active',
    registered_at: '2025-02-20',
    role: 'member',
  },
];
const admins: Admin[] = [
  {
    admin_id: 1,
    full_name: 'J. Mwangi',
    email: 'admin@library.ac.ke',
    role: 'super_admin',
    created_at: '2025-01-01',
  },
];
let loans: Borrowing[] = [
  {
    borrowing_id: 1,
    member_id: 1,
    member_name: members[0].full_name,
    book_id: books[0].book_id,
    book_title: books[0].title,
    book_isbn: books[0].isbn,
    issue_date: '2025-10-12',
    due_date: '2025-10-26',
    status: 'overdue',
    is_overdue: true,
    overdue_days: 3,
    estimated_fine: 150,
  },
  {
    borrowing_id: 2,
    member_id: 2,
    member_name: members[1].full_name,
    book_id: books[1].book_id,
    book_title: books[1].title,
    book_isbn: books[1].isbn,
    issue_date: '2025-11-01',
    due_date: '2025-11-15',
    status: 'borrowed',
    is_overdue: false,
    days_remaining: 4,
  },
];
let fines: Fine[] = [
  {
    fine_id: 1,
    borrowing_id: 1,
    amount: 150,
    reason: 'Overdue return (3 days)',
    status: 'unpaid',
    issued_date: '2025-10-29',
    member_name: members[0].full_name,
    book_title: books[0].title,
  },
  {
    fine_id: 2,
    borrowing_id: 3,
    amount: 50,
    reason: 'Overdue return (1 day)',
    status: 'paid',
    issued_date: '2025-09-10',
    paid_date: '2025-09-12',
    member_name: members[1].full_name,
    book_title: books[2].title,
  },
];
let reservations: Reservation[] = [
  {
    reservation_id: 1,
    member_id: 3,
    book_id: books[2].book_id,
    reservation_date: '2025-11-03',
    status: 'pending',
    member_name: members[2].full_name,
    book_title: books[2].title,
  },
];

const today = () => new Date().toISOString().slice(0, 10);
const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json' },
});
const readBody = (init?: RequestInit): Record<string, any> => {
  if (typeof init?.body !== 'string') return {};
  try {
    return JSON.parse(init.body);
  } catch {
    return {};
  }
};

export async function handleMockApiRequest(path: string, init?: RequestInit): Promise<Response> {
  const url = new URL(path, 'http://demo.local');
  const route = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  const body = readBody(init);
  const pathParts = route.split('/').filter(Boolean);

  if (method === 'GET' && route === '/api/books') {
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const categoryId = Number(url.searchParams.get('category_id')) || null;
    const availableOnly = url.searchParams.get('available_only') === 'true';
    return respond(books.filter((book) => {
      const matchesSearch = !search || [book.title, book.isbn, book.publisher, ...book.authors]
        .some((value) => value?.toLowerCase().includes(search));
      return matchesSearch && (!categoryId || book.category_id === categoryId)
        && (!availableOnly || book.available_copies > 0);
    }));
  }
  if (method === 'GET' && pathParts[1] === 'books' && pathParts[2]) {
    const book = books.find((item) => item.book_id === Number(pathParts[2]));
    return book ? respond(book) : respond({ error: 'Book not found' }, 404);
  }
  if (method === 'POST' && route === '/api/books') {
    const book: Book = {
      book_id: Math.max(0, ...books.map((item) => item.book_id)) + 1,
      isbn: body.isbn || '',
      title: body.title || 'Untitled book',
      category_id: Number(body.category_id) || categories[0]?.category_id || 1,
      category_name: categories.find((item) => item.category_id === Number(body.category_id))?.category_name,
      authors: Array.isArray(body.authors) ? body.authors : String(body.authors || '').split(',').map((name: string) => name.trim()).filter(Boolean),
      publisher: body.publisher || '',
      publication_year: Number(body.publication_year) || new Date().getFullYear(),
      language: body.language || 'English',
      pages: Number(body.pages) || 0,
      total_copies: Number(body.total_copies) || 1,
      available_copies: Number(body.total_copies) || 1,
      is_available: true,
      shelf_location: body.shelf_location || '',
      description: body.description || '',
      cover_image: body.cover_image || '',
    };
    books.push(book);
    return respond({ success: true, book }, 201);
  }
  if (pathParts[1] === 'books' && pathParts[2] && method === 'PUT') {
    const book = books.find((item) => item.book_id === Number(pathParts[2]));
    if (!book) return respond({ error: 'Book not found' }, 404);
    Object.assign(book, body);
    if (body.authors && !Array.isArray(body.authors)) {
      book.authors = String(body.authors).split(',').map((name: string) => name.trim()).filter(Boolean);
    }
    book.is_available = book.available_copies > 0;
    return respond({ success: true, book });
  }
  if (pathParts[1] === 'books' && pathParts[2] && method === 'DELETE') {
    const index = books.findIndex((item) => item.book_id === Number(pathParts[2]));
    if (index >= 0) books.splice(index, 1);
    return respond({ success: true });
  }

  if (method === 'GET' && route === '/api/categories') return respond(categories);
  if (method === 'POST' && route === '/api/categories') {
    const category: Category = {
      category_id: Math.max(0, ...categories.map((item) => item.category_id)) + 1,
      category_name: body.category_name || 'New category',
      description: body.description || '',
    };
    categories.push(category);
    return respond({ success: true, category }, 201);
  }
  if (pathParts[1] === 'categories' && pathParts[2] && method === 'DELETE') {
    const id = Number(pathParts[2]);
    if (books.some((book) => book.category_id === id)) {
      return respond({ error: 'Cannot delete a category with books' }, 409);
    }
    const index = categories.findIndex((item) => item.category_id === id);
    if (index >= 0) categories.splice(index, 1);
    return respond({ success: true });
  }

  if (method === 'GET' && route === '/api/authors') return respond(authors);
  if (method === 'POST' && route === '/api/authors') {
    const author: Author = {
      author_id: Math.max(0, ...authors.map((item) => item.author_id)) + 1,
      author_name: body.author_name || 'New author',
      biography: body.biography || '',
    };
    authors.push(author);
    return respond({ success: true, author }, 201);
  }
  if (pathParts[1] === 'authors' && pathParts[2] && method === 'DELETE') {
    const author = authors.find((item) => item.author_id === Number(pathParts[2]));
    if (author && books.some((book) => book.authors.includes(author.author_name))) {
      return respond({ error: 'Cannot delete an author linked to a book' }, 409);
    }
    const index = authors.findIndex((item) => item.author_id === Number(pathParts[2]));
    if (index >= 0) authors.splice(index, 1);
    return respond({ success: true });
  }

  if (method === 'GET' && route === '/api/members') {
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const status = url.searchParams.get('status');
    return respond(members.filter((member) => (!status || member.status === status)
      && (!search || `${member.full_name} ${member.email} ${member.member_code}`.toLowerCase().includes(search))));
  }
  if (method === 'POST' && (route === '/api/members/register' || route === '/api/members')) {
    const member: Member = {
      member_id: Math.max(0, ...members.map((item) => item.member_id)) + 1,
      member_code: `M${String(members.length + 1).padStart(4, '0')}`,
      full_name: body.full_name || 'Demo Member',
      email: body.email || '',
      phone: body.phone || '',
      status: 'active',
      registered_at: today(),
      role: 'member',
    };
    members.push(member);
    return respond({ success: true, member }, 201);
  }
  if (pathParts[1] === 'members' && pathParts[2] && pathParts[3] === 'status' && method === 'PATCH') {
    const member = members.find((item) => item.member_id === Number(pathParts[2]));
    if (!member) return respond({ error: 'Member not found' }, 404);
    member.status = body.status || 'active';
    return respond({ success: true, status: member.status });
  }

  if (method === 'GET' && route === '/api/loans/active') return respond(loans.filter((loan) => loan.status !== 'returned'));
  if (method === 'POST' && route === '/api/issue') {
    const member = members.find((item) => item.member_id === Number(body.member_id) || item.email === body.member_id);
    const book = books.find((item) => item.book_id === Number(body.book_id) || item.isbn === body.book_id);
    if (!member || !book || book.available_copies < 1) return respond({ error: 'Member or available book not found' }, 400);
    book.available_copies -= 1;
    book.is_available = book.available_copies > 0;
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const loan: Borrowing = {
      borrowing_id: Math.max(0, ...loans.map((item) => item.borrowing_id)) + 1,
      member_id: member.member_id,
      member_name: member.full_name,
      book_id: book.book_id,
      book_title: book.title,
      book_isbn: book.isbn,
      issue_date: today(),
      due_date: due.toISOString().slice(0, 10),
      status: 'borrowed',
    };
    loans.push(loan);
    return respond({ success: true, data: { ...loan, due_date: loan.due_date } });
  }
  if (method === 'POST' && route === '/api/return') {
    const loan = [...loans].reverse().find((item) => item.status !== 'returned'
      && (item.book_id === Number(body.book_id) || item.book_isbn === body.book_id));
    if (!loan) return respond({ error: 'No active loan found for this book' }, 400);
    loan.status = 'returned';
    loan.return_date = today();
    const book = books.find((item) => item.book_id === loan.book_id);
    if (book) {
      book.available_copies = Math.min(book.total_copies, book.available_copies + 1);
      book.is_available = book.available_copies > 0;
    }
    return respond({ success: true, data: loan });
  }

  if (method === 'GET' && route === '/api/fines') {
    const memberId = Number(url.searchParams.get('member_id')) || null;
    return respond(fines.filter((fine) => !memberId || loans.find((loan) => loan.borrowing_id === fine.borrowing_id)?.member_id === memberId));
  }
  if (pathParts[1] === 'fines' && pathParts[2] && pathParts[3] === 'pay' && method === 'POST') {
    const fine = fines.find((item) => item.fine_id === Number(pathParts[2]));
    if (fine) {
      fine.status = 'paid';
      fine.paid_date = today();
    }
    return respond({ success: Boolean(fine) });
  }

  if (method === 'GET' && route === '/api/reservations') {
    const memberId = Number(url.searchParams.get('member_id')) || null;
    return respond(reservations.filter((item) => !memberId || item.member_id === memberId));
  }
  if (method === 'POST' && route === '/api/reservations') {
    const member = members.find((item) => item.member_id === Number(body.member_id));
    const book = books.find((item) => item.book_id === Number(body.book_id));
    if (!member || !book) return respond({ error: 'Member or book not found' }, 400);
    const reservation: Reservation = {
      reservation_id: Math.max(0, ...reservations.map((item) => item.reservation_id)) + 1,
      member_id: member.member_id,
      book_id: book.book_id,
      reservation_date: today(),
      status: 'pending',
      member_name: member.full_name,
      book_title: book.title,
    };
    reservations.push(reservation);
    return respond({ success: true, data: reservation }, 201);
  }
  if (pathParts[1] === 'reservations' && pathParts[2] && pathParts[3] === 'status' && method === 'PATCH') {
    const reservation = reservations.find((item) => item.reservation_id === Number(pathParts[2]));
    if (!reservation) return respond({ error: 'Reservation not found' }, 404);
    reservation.status = body.status || 'pending';
    return respond({ success: true });
  }

  if (method === 'GET' && route === '/api/reports') {
    return respond({
      active_loans: loans.filter((loan) => loan.status === 'borrowed').length,
      returned_loans: loans.filter((loan) => loan.status === 'returned').length,
      overdue_loans: loans.filter((loan) => loan.status === 'overdue').length,
      total_collected_fines: fines.filter((fine) => fine.status === 'paid').reduce((sum, fine) => sum + fine.amount, 0),
      outstanding_fines: fines.filter((fine) => fine.status === 'unpaid').reduce((sum, fine) => sum + fine.amount, 0),
      top_borrowed_books: books.slice(0, 5).map((book, index) => ({ title: book.title, count: 5 - index })),
    });
  }

  if (method === 'POST' && route === '/api/login/admin') return respond({ admin: admins[0] });
  if (method === 'POST' && route === '/api/login/member') {
    const member = members.find((item) => item.email === body.email) || members[0];
    return respond({ member });
  }
  if (method === 'GET' && route === '/api/dashboard') {
    return respond({
      total_books: books.length,
      total_copies: books.reduce((sum, book) => sum + book.total_copies, 0),
      members: members.length,
      books_issued: loans.filter((loan) => loan.status === 'borrowed').length,
      overdue_books: loans.filter((loan) => loan.status === 'overdue').length,
      borrowing_trends: [],
      category_distribution: categories.map((category) => ({
        name: category.category_name,
        count: books.filter((book) => book.category_id === category.category_id).length,
      })),
      recent_transactions: [],
    });
  }
  if (method === 'GET' && route === '/api/schema') return respond({ db_type: 'SQLite (demo)', tables_count: 0, tables: [] });
  if (method === 'POST' && route === '/api/sql') return respond({ success: true, rows: [], message: 'SQL is disabled in demo mode.' });
  if (method === 'GET' && route === '/api/test-oop') {
    return respond({ success: true, total_run: 0, failures: 0, errors: 0, duration_seconds: 0, console_output: 'Demo mode: backend tests are not run.', tests: [] });
  }
  if (method === 'GET' && route === '/api/code-bundle') return respond({ bundle: [] });

  return respond({ error: `No demo response for ${method} ${route}` }, 404);
}
