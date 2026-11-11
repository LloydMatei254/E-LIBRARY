"""
Berzowanley Online Library Management System
Interactive Terminal CLI Presentation Interface for CMT210 Project Defense
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.service import LibraryService
from backend.test_oop import run_tests_with_report

def print_header(title):
    print("\n" + "=" * 65)
    print(f"   {title}")
    print("=" * 65)

def main_menu():
    service = LibraryService()
    
    while True:
        print_header("BERZOWANLEY E-LIBRARY - PYTHON OOP SYSTEM (CMT210)")
        print("1. View Dashboard & Statistical Analytics")
        print("2. Browse Book Catalog (Search & Availability)")
        print("3. Add New Book (Admin Catalog Management)")
        print("4. Issue a Book to Member (Loan Lifecycle)")
        print("5. Return a Book & Assess Fines")
        print("6. Manage Members List")
        print("7. Run OOP Automated Test Suite (Verify 4 OOP Pillars)")
        print("8. View DBMS 10-Table Schema Inspector")
        print("0. Exit System")
        print("-" * 65)

        choice = input("Enter option [0-8]: ").strip()

        if choice == '1':
            stats = service.get_dashboard_metrics()
            print_header("LIBRARY DASHBOARD METRICS")
            print(f"Total Book Titles:   {stats['total_books']}")
            print(f"Total Physical Copies: {stats['total_copies']}")
            print(f"Registered Members:  {stats['members']}")
            print(f"Active Issued Books: {stats['books_issued']}")
            print(f"Overdue Loans:       {stats['overdue_books']}")
            print("\nRecent Transactions:")
            for t in stats['recent_transactions']:
                print(f" - {t['date']} | {t['action']:<8} | {t['member']:<18} | {t['book']}")

        elif choice == '2':
            search = input("Enter search keyword (or Enter for all): ").strip() or None
            books = service.get_books(search=search)
            print_header(f"BOOK CATALOG ({len(books)} Found)")
            print(f"{'ID':<4} {'ISBN':<16} {'Copies':<8} {'Title':<30} {'Category'}")
            print("-" * 65)
            for b in books:
                copies_str = f"{b['available_copies']}/{b['total_copies']}"
                print(f"{b['book_id']:<4} {b['isbn']:<16} {copies_str:<8} {b['title'][:28]:<30} {b['category_name']}")

        elif choice == '3':
            print_header("ADD NEW BOOK TO CATALOG")
            isbn = input("ISBN (e.g. 978-0-00-12345): ").strip()
            title = input("Book Title: ").strip()
            cat_id = input("Category ID (1: Tech, 2: Science, 3: Business): ").strip() or "1"
            publisher = input("Publisher: ").strip() or "Academic Press"
            author = input("Author Name: ").strip() or "Unknown Author"
            copies = int(input("Total Copies: ").strip() or "3")

            new_book = service.add_book({
                "isbn": isbn,
                "title": title,
                "category_id": int(cat_id),
                "publisher": publisher,
                "authors": [author],
                "total_copies": copies
            })
            print(f"\n[SUCCESS] Book '{new_book['title']}' added with ID #{new_book['book_id']}.")

        elif choice == '4':
            print_header("ISSUE BOOK TO MEMBER")
            mem = input("Enter Member ID or Email (e.g. 1 or beatrice.w@student.ac.ke): ").strip()
            book = input("Enter Book ID or ISBN (e.g. 1 or 978-0-00-00000): ").strip()
            try:
                res = service.issue_book(mem, book)
                print(f"\n[SUCCESS] Issued '{res['book_title']}' to {res['member_name']}.")
                print(f"Due Date: {res['due_date']} (14 days loan period)")
            except Exception as e:
                print(f"\n[ERROR] {e}")

        elif choice == '5':
            print_header("RETURN BOOK & ASSESS FINES")
            book = input("Enter Book ID or ISBN to return: ").strip()
            condition = input("Condition (Good / Damaged / Minor Wear) [Good]: ").strip() or "Good"
            try:
                res = service.return_book(book, condition=condition)
                print(f"\n[SUCCESS] '{res['book_title']}' returned by {res['member_name']}.")
                if res['fine_amount'] > 0:
                    print(f"NOTICE: Overdue/Condition fine assessed: KES {res['fine_amount']:.2f}")
                else:
                    print("Book returned on time with 0 fine.")
            except Exception as e:
                print(f"\n[ERROR] {e}")

        elif choice == '6':
            members = service.get_members()
            print_header(f"REGISTERED MEMBERS ({len(members)} Total)")
            print(f"{'Code':<8} {'Name':<20} {'Status':<12} {'Email'}")
            print("-" * 65)
            for m in members:
                print(f"{m['member_code']:<8} {m['full_name']:<20} {m['status']:<12} {m['email']}")

        elif choice == '7':
            print_header("RUNNING OBJECT-ORIENTED PROGRAMMING TEST SUITE")
            report = run_tests_with_report()
            for t in report['tests']:
                status_icon = "✓" if t['status'] == "PASSED" else "✗"
                print(f" [{status_icon}] {t['pillar']:<15} | {t['name']:<30} | {t['status']}")
                print(f"     -> {t['description']}")
            print("-" * 65)
            print(f"Result: {report['total_run']} tests run in {report['duration_seconds']}s. All Passed: {report['success']}")

        elif choice == '8':
            schema = service.get_schema_summary()
            print_header(f"RELATIONAL DBMS SCHEMA ({schema['tables_count']} Tables)")
            for t in schema['tables']:
                print(f" • Table: {t['table_name']:<18} ({t['record_count']} records)")
                col_names = [f"{c['name']} ({c['type']})" for c in t['columns']]
                print(f"   Columns: {', '.join(col_names[:6])}...")

        elif choice == '0':
            print("\nExiting Berzowanley E-Library System. Goodbye!")
            break
        else:
            print("\nInvalid choice. Please select from the menu.")

if __name__ == '__main__':
    main_menu()
