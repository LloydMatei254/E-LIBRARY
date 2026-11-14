export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row extends Record<string, unknown>, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileRow = {
  member_id: number;
  auth_user_id: string | null;
  member_code: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'inactive';
  role: 'member' | 'librarian' | 'super_admin';
  registered_at: string;
};

type CategoryRow = {
  category_id: number;
  category_name: string;
  description: string;
};

type AuthorRow = {
  author_id: number;
  author_name: string;
  biography: string;
};

type BookRow = {
  book_id: number;
  isbn: string;
  title: string;
  category_id: number;
  publisher: string;
  publication_year: number | null;
  language: string;
  pages: number | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  description: string;
  cover_image: string;
  added_by: number | null;
  created_at: string;
};

type BookAuthorRow = {
  book_id: number;
  author_id: number;
};

type BorrowingRow = {
  borrowing_id: number;
  member_id: number;
  book_id: number;
  issued_by: number | null;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
};

type ReservationRow = {
  reservation_id: number;
  member_id: number;
  book_id: number;
  reservation_date: string;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'expired';
};

type FineRow = {
  fine_id: number;
  member_id: number;
  borrowing_id: number | null;
  amount: number;
  reason: string;
  status: 'unpaid' | 'paid';
  issued_date: string;
  paid_date: string | null;
};

type FinePaymentRow = {
  payment_id: number;
  fine_id: number;
  member_id: number;
  amount: number;
  phone_number: string;
  status: 'initiating' | 'pending' | 'paid' | 'failed';
  merchant_request_id: string | null;
  checkout_request_id: string | null;
  mpesa_receipt_number: string | null;
  result_description: string;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Pick<ProfileRow, 'full_name' | 'email' | 'phone'>, Pick<ProfileRow, 'status'>>;
      categories: Table<CategoryRow, Omit<CategoryRow, 'category_id'>, Partial<Omit<CategoryRow, 'category_id'>>>;
      authors: Table<AuthorRow, Omit<AuthorRow, 'author_id'>, Partial<Omit<AuthorRow, 'author_id'>>>;
      books: Table<BookRow, Omit<BookRow, 'book_id' | 'created_at'>, Partial<Omit<BookRow, 'book_id' | 'created_at'>>>;
      book_authors: Table<BookAuthorRow, BookAuthorRow, Partial<BookAuthorRow>>;
      borrowings: Table<BorrowingRow, Omit<BorrowingRow, 'borrowing_id'>, Partial<Omit<BorrowingRow, 'borrowing_id'>>>;
      reservations: Table<ReservationRow, Omit<ReservationRow, 'reservation_id' | 'reservation_date'>, Partial<Omit<ReservationRow, 'reservation_id'>>>;
      fines: Table<FineRow, Omit<FineRow, 'fine_id'>, Partial<Omit<FineRow, 'fine_id'>>>;
      fine_payments: Table<FinePaymentRow, Omit<FinePaymentRow, 'payment_id' | 'created_at' | 'updated_at'>, Partial<Omit<FinePaymentRow, 'payment_id' | 'created_at'>>>;
    };
    Views: Record<string, never>;
    Functions: {
      save_book: { Args: { p_book_id: number | null; p_payload: Json }; Returns: number };
      issue_book: { Args: { p_member_identifier: string; p_book_identifier: string; p_loan_days?: number }; Returns: Json };
      return_book: { Args: { p_book_identifier: string; p_condition?: string; p_damage_fee?: number; p_borrowing_id?: number | null }; Returns: Json };
      reserve_book: { Args: { p_member_id: number; p_book_id: number }; Returns: Json };
      mark_fine_paid: { Args: { p_fine_id: number }; Returns: boolean };
      update_member_details: { Args: { p_member_id: number; p_full_name: string; p_phone: string }; Returns: boolean };
      add_member_fine: { Args: { p_member_id: number; p_amount: number; p_reason: string }; Returns: number };
      finalize_mpesa_payment: {
        Args: {
          p_payment_id: number;
          p_checkout_request_id: string;
          p_result_code: number;
          p_result_description: string;
          p_amount?: number | null;
          p_mpesa_receipt_number?: string | null;
        };
        Returns: boolean;
      };
      get_schema_summary: { Args: Record<string, never>; Returns: Json };
      can_upload_book_cover: { Args: { p_object_name: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
