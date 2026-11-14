export interface Book {
  book_id: number;
  isbn: string;
  title: string;
  category_id: number;
  category_name?: string;
  publisher?: string;
  publication_year?: number;
  language?: string;
  pages?: number;
  total_copies: number;
  available_copies: number;
  is_available?: boolean;
  shelf_location?: string;
  description?: string;
  cover_image?: string;
  authors: string[];
  created_at?: string;
}

export interface Member {
  member_id: number;
  member_code?: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'inactive';
  registered_at: string;
  role: string;
}

export interface Admin {
  admin_id: number;
  full_name: string;
  email: string;
  role: 'super_admin' | 'librarian';
  created_at: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string;
}

export interface Author {
  author_id: number;
  author_name: string;
  biography?: string;
}

export interface Borrowing {
  borrowing_id: number;
  member_id: number;
  member_name: string;
  book_id: number;
  book_title: string;
  book_isbn: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  is_overdue?: boolean;
  days_remaining?: number;
  overdue_days?: number;
  estimated_fine?: number;
}

export interface Fine {
  fine_id: number;
  member_id?: number;
  borrowing_id?: number;
  amount: number;
  reason: string;
  status: 'unpaid' | 'paid';
  payment_status?: 'initiating' | 'pending';
  issued_date: string;
  paid_date?: string;
  member_name: string;
  book_title: string;
}

export interface Reservation {
  reservation_id: number;
  member_id: number;
  book_id: number;
  reservation_date: string;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'expired';
  member_name: string;
  book_title: string;
}

export interface DashboardMetrics {
  total_books: number;
  total_copies: number;
  members: number;
  books_issued: number;
  overdue_books: number;
  borrowing_trends: { period: string; count: number }[];
  category_distribution: { name: string; count: number }[];
  recent_transactions: { member: string; book: string; action: string; date: string }[];
}

export interface DBMSSchemaColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  pk: number;
}

export interface DBMSTable {
  table_name: string;
  record_count: number;
  columns: DBMSSchemaColumn[];
  foreign_keys: { table: string; from: string; to: string }[];
}

export interface DBMSSchemaResponse {
  db_type: string;
  tables_count: number;
  tables: DBMSTable[];
}

export interface OOPTestItem {
  name: string;
  pillar: string;
  description: string;
  status: 'PASSED' | 'FAILED';
}

export interface OOPTestReport {
  success: boolean;
  total_run: number;
  failures: number;
  errors: number;
  duration_seconds: number;
  console_output: string;
  tests: OOPTestItem[];
}
