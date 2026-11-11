"""
Berzowanley Online Library System - Python HTTP REST API Server
Bridges the Python OOP backend with the Web Frontend & Admin Panel.
Uses Python 3 standard library http.server (fast, zero external pip dependencies).
"""

import sys
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import traceback
import os
import unittest
import io

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.service import LibraryService
from backend.database import DatabaseManager

service = LibraryService()

class LibraryAPIRequestHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status_code=200, content_type="application/json"):
        self.send_response(status_code)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def _read_json(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            return json.loads(body)
        except Exception:
            return {}

    def _send_json(self, data, status_code=200):
        self._set_headers(status_code)
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def _send_error(self, message, status_code=400):
        self._set_headers(status_code)
        self.wfile.write(json.dumps({"error": message, "success": False}).encode('utf-8'))

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        try:
            if path == '/api/health':
                self._send_json({"status": "healthy", "service": "Python OOP Library Engine"})

            elif path == '/api/dashboard':
                data = service.get_dashboard_metrics()
                self._send_json(data)

            elif path == '/api/books':
                cat_id = int(query['category_id'][0]) if 'category_id' in query and query['category_id'][0].isdigit() else None
                search = query['search'][0] if 'search' in query else None
                available = query.get('available_only', ['false'])[0].lower() == 'true'
                books = service.get_books(search=search, category_id=cat_id, available_only=available)
                self._send_json(books)

            elif path.startswith('/api/books/') and path.split('/')[-1].isdigit():
                book_id = int(path.split('/')[-1])
                book = service.get_book_by_id(book_id)
                if book:
                    self._send_json(book)
                else:
                    self._send_error("Book not found", 404)

            elif path == '/api/categories':
                categories = service.get_categories()
                self._send_json(categories)

            elif path == '/api/authors':
                authors = service.get_authors()
                self._send_json(authors)

            elif path == '/api/members':
                search = query.get('search', [None])[0]
                status = query.get('status', [None])[0]
                members = service.get_members(search=search, status=status)
                self._send_json(members)

            elif path == '/api/loans/active':
                issued = service.get_currently_issued_books()
                self._send_json(issued)

            elif path == '/api/fines':
                mem_id = int(query['member_id'][0]) if 'member_id' in query and query['member_id'][0].isdigit() else None
                fines = service.get_fines(member_id=mem_id)
                self._send_json(fines)

            elif path == '/api/reservations':
                mem_id = int(query['member_id'][0]) if 'member_id' in query and query['member_id'][0].isdigit() else None
                reservations = service.get_reservations(member_id=mem_id)
                self._send_json(reservations)

            elif path == '/api/schema':
                schema = service.get_schema_summary()
                self._send_json(schema)

            elif path == '/api/reports':
                reports = service.get_reports_summary()
                self._send_json(reports)

            elif path == '/api/test-oop':
                # Run the OOP Test Suite in real-time
                from backend.test_oop import run_tests_with_report
                report = run_tests_with_report()
                self._send_json(report)

            elif path == '/api/code-bundle':
                # Return all Python OOP code files formatted for Assignment 1
                base_dir = os.path.dirname(os.path.abspath(__file__))
                files_to_read = [
                    ('models.py', 'Domain Object Models & OOP Class Hierarchy'),
                    ('database.py', 'Relational SQLite DBMS Schema & Connection Pool'),
                    ('service.py', 'Business Logic, Transactions & Service Layer'),
                    ('test_oop.py', 'Automated Verification & Unit Test Suite'),
                    ('cli.py', 'Interactive Presentation CLI for Class Demostrations')
                ]
                bundle = []
                for fname, desc in files_to_read:
                    fpath = os.path.join(base_dir, fname)
                    if os.path.exists(fpath):
                        with open(fpath, 'r', encoding='utf-8') as f:
                            bundle.append({"filename": fname, "title": desc, "content": f.read()})
                self._send_json({"bundle": bundle})

            else:
                self._send_error("Route not found", 404)

        except Exception as e:
            traceback.print_exc()
            self._send_error(str(e), 500)

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self._read_json()

        try:
            if path == '/api/login/admin':
                res = service.authenticate_admin(body.get('email', ''), body.get('password', ''))
                if res:
                    self._send_json({"success": True, "admin": res})
                else:
                    self._send_error("Invalid administrative credentials.", 401)

            elif path == '/api/login/member':
                res = service.authenticate_member(body.get('email', ''), body.get('password', ''))
                if res:
                    self._send_json({"success": True, "member": res})
                else:
                    self._send_error("Invalid email or password.", 401)

            elif path == '/api/members/register' or path == '/api/members':
                res = service.register_member(
                    full_name=body.get('full_name', ''),
                    email=body.get('email', ''),
                    phone=body.get('phone', ''),
                    password=body.get('password', 'member123')
                )
                self._send_json({"success": True, "member": res}, 201)

            elif path == '/api/books':
                admin_id = int(body.get('admin_id', 1))
                book = service.add_book(body, admin_id=admin_id)
                self._send_json({"success": True, "book": book}, 201)

            elif path == '/api/issue':
                res = service.issue_book(
                    member_identifier=body.get('member_id', ''),
                    book_identifier=body.get('book_id', ''),
                    admin_id=int(body.get('admin_id', 1)),
                    loan_days=int(body.get('loan_days', 14))
                )
                self._send_json({"success": True, "data": res})

            elif path == '/api/return':
                res = service.return_book(
                    book_identifier=body.get('book_id', ''),
                    condition=body.get('condition', 'Good'),
                    damage_fee=float(body.get('damage_fee', 0.0))
                )
                self._send_json({"success": True, "data": res})

            elif path.startswith('/api/fines/') and path.endswith('/pay'):
                fine_id = int(path.split('/')[3])
                ok = service.pay_fine(fine_id)
                self._send_json({"success": ok})

            elif path == '/api/reservations':
                res = service.create_reservation(int(body.get('member_id')), int(body.get('book_id')))
                self._send_json({"success": True, "data": res}, 201)

            elif path == '/api/categories':
                res = service.add_category(body.get('category_name', ''), body.get('description', ''))
                self._send_json({"success": True, "category": res}, 201)

            elif path == '/api/authors':
                res = service.add_author(body.get('author_name', ''), body.get('biography', ''))
                self._send_json({"success": True, "author": res}, 201)

            elif path == '/api/sql':
                query = body.get('query', '')
                res = service.execute_custom_sql(query)
                self._send_json(res)

            else:
                self._send_error("Route not found", 404)

        except Exception as e:
            traceback.print_exc()
            self._send_error(str(e), 400)

    def do_PUT(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self._read_json()

        try:
            if path.startswith('/api/books/') and path.split('/')[-1].isdigit():
                book_id = int(path.split('/')[-1])
                updated = service.update_book(book_id, body)
                if updated:
                    self._send_json({"success": True, "book": updated})
                else:
                    self._send_error("Book update failed or book not found", 404)
            else:
                self._send_error("Route not found", 404)
        except Exception as e:
            self._send_error(str(e), 400)

    def do_PATCH(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        body = self._read_json()

        try:
            # /api/members/<id>/status
            parts = path.split('/')
            if len(parts) >= 5 and parts[2] == 'members' and parts[4] == 'status' and parts[3].isdigit():
                member_id = int(parts[3])
                new_status = body.get('status', 'active')
                ok = service.update_member_status(member_id, new_status)
                self._send_json({"success": ok, "status": new_status})
            elif len(parts) >= 5 and parts[2] == 'reservations' and parts[4] == 'status' and parts[3].isdigit():
                res_id = int(parts[3])
                new_status = body.get('status', 'fulfilled')
                ok = service.update_reservation_status(res_id, new_status)
                self._send_json({"success": ok, "status": new_status})
            else:
                self._send_error("Route not found", 404)
        except Exception as e:
            self._send_error(str(e), 400)

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        try:
            if path.startswith('/api/books/') and path.split('/')[-1].isdigit():
                book_id = int(path.split('/')[-1])
                ok = service.delete_book(book_id)
                self._send_json({"success": ok})
            elif path.startswith('/api/categories/') and path.split('/')[-1].isdigit():
                cat_id = int(path.split('/')[-1])
                ok = service.delete_category(cat_id)
                self._send_json({"success": ok})
            elif path.startswith('/api/authors/') and path.split('/')[-1].isdigit():
                auth_id = int(path.split('/')[-1])
                ok = service.delete_author(auth_id)
                self._send_json({"success": ok})
            else:
                self._send_error("Route not found", 404)
        except Exception as e:
            self._send_error(str(e), 400)

def run_server(port=5001):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, LibraryAPIRequestHandler)
    print(f"[Python OOP Server] Listening on http://127.0.0.1:{port}")
    httpd.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 5001
    run_server(port)
