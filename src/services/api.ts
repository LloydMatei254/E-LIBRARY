import {
  Book,
  Member,
  Admin,
  Category,
  Author,
  Borrowing,
  Fine,
  Reservation,
  DashboardMetrics,
  DBMSSchemaResponse,
  OOPTestReport,
} from '../types';

export const api = {
  // Dashboard
  async getDashboard(): Promise<DashboardMetrics> {
    const res = await fetch('/api/dashboard');
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  // Books
  async getBooks(params?: { category_id?: number; search?: string; available_only?: boolean }): Promise<Book[]> {
    const query = new URLSearchParams();
    if (params?.category_id) query.set('category_id', String(params.category_id));
    if (params?.search) query.set('search', params.search);
    if (params?.available_only) query.set('available_only', 'true');
    const res = await fetch(`/api/books?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch books');
    return res.json();
  },

  async getBookById(id: number): Promise<Book> {
    const res = await fetch(`/api/books/${id}`);
    if (!res.ok) throw new Error('Book not found');
    return res.json();
  },

  async addBook(bookData: Partial<Book> & { admin_id?: number }): Promise<Book> {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add book');
    return data.book;
  },

  async updateBook(id: number, bookData: Partial<Book>): Promise<Book> {
    const res = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update book');
    return data.book;
  },

  async deleteBook(id: number): Promise<boolean> {
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete book');
    return data.success;
  },

  // Categories & Authors
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async addCategory(name: string, description: string = ''): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_name: name, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add category');
    return data.category;
  },

  async deleteCategory(id: number): Promise<boolean> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete category');
    return data.success;
  },

  async getAuthors(): Promise<Author[]> {
    const res = await fetch('/api/authors');
    if (!res.ok) throw new Error('Failed to fetch authors');
    return res.json();
  },

  async addAuthor(name: string, biography: string = ''): Promise<Author> {
    const res = await fetch('/api/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name: name, biography }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add author');
    return data.author;
  },

  async deleteAuthor(id: number): Promise<boolean> {
    const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete author');
    return data.success;
  },

  async getReports(): Promise<any> {
    const res = await fetch('/api/reports');
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async updateReservationStatus(id: number, status: string): Promise<boolean> {
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update reservation');
    return data.success;
  },

  // Members
  async getMembers(params?: { search?: string; status?: string }): Promise<Member[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    const res = await fetch(`/api/members?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },

  async updateMemberStatus(memberId: number, status: string): Promise<boolean> {
    const res = await fetch(`/api/members/${memberId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update member status');
    return data.success;
  },

  // Auth
  async loginAdmin(email: string, password: string): Promise<Admin> {
    const res = await fetch('/api/login/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin login failed');
    return data.admin;
  },

  async loginMember(email: string, password: string): Promise<Member> {
    const res = await fetch('/api/login/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Member login failed');
    return data.member;
  },

  async registerMember(payload: { full_name: string; email: string; phone: string; password?: string }): Promise<Member> {
    const res = await fetch('/api/members/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data.member;
  },

  // Issue & Return
  async issueBook(memberIdOrEmail: string, bookIdOrIsbn: string, adminId: number = 1): Promise<any> {
    const res = await fetch('/api/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: memberIdOrEmail,
        book_id: bookIdOrIsbn,
        admin_id: adminId,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Issue transaction failed');
    return data.data;
  },

  async returnBook(bookIdOrIsbn: string, condition: string = 'Good', damageFee: number = 0): Promise<any> {
    const res = await fetch('/api/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        book_id: bookIdOrIsbn,
        condition,
        damage_fee: damageFee,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Return transaction failed');
    return data.data;
  },

  async getActiveLoans(): Promise<Borrowing[]> {
    const res = await fetch('/api/loans/active');
    if (!res.ok) throw new Error('Failed to fetch active loans');
    return res.json();
  },

  // Fines
  async getFines(memberId?: number): Promise<Fine[]> {
    const query = memberId ? `?member_id=${memberId}` : '';
    const res = await fetch(`/api/fines${query}`);
    if (!res.ok) throw new Error('Failed to fetch fines');
    return res.json();
  },

  async payFine(fineId: number): Promise<boolean> {
    const res = await fetch(`/api/fines/${fineId}/pay`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment failed');
    return data.success;
  },

  // Reservations
  async getReservations(memberId?: number): Promise<Reservation[]> {
    const query = memberId ? `?member_id=${memberId}` : '';
    const res = await fetch(`/api/reservations${query}`);
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },

  async createReservation(memberId: number, bookId: number): Promise<any> {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, book_id: bookId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reservation failed');
    return data.data;
  },

  // CMT210 Marking & Schema Explorer
  async getSchema(): Promise<DBMSSchemaResponse> {
    const res = await fetch('/api/schema');
    if (!res.ok) throw new Error('Failed to fetch DBMS schema');
    return res.json();
  },

  async executeSql(query: string): Promise<any> {
    const res = await fetch('/api/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'SQL execution failed');
    return data;
  },

  async runOOPTests(): Promise<OOPTestReport> {
    const res = await fetch('/api/test-oop');
    if (!res.ok) throw new Error('Failed to run OOP test suite');
    return res.json();
  },

  async getCodeBundle(): Promise<{ bundle: { filename: string; title: string; content: string }[] }> {
    const res = await fetch('/api/code-bundle');
    if (!res.ok) throw new Error('Failed to fetch code bundle');
    return res.json();
  },
};
