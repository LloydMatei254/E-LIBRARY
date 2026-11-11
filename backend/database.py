"""
Berzowanley Online Library System - Database Manager & Schema
Implements SQLite DBMS for the 10-table schema specified in Deliverable 2.
"""

import sqlite3
import os
import hashlib
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'library.db')

class DatabaseManager:
    """
    Singleton Database Manager implementing OOP connection pooling and migration execution.
    """
    _instance = None

    def __new__(cls, db_path=DB_PATH):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance.db_path = db_path
            cls._instance._init_db()
        return cls._instance

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    @staticmethod
    def hash_password(password: str) -> str:
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

    def _init_db(self):
        """Initializes all 10 tables strictly matching Deliverable 2 schema specifications."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # 1. Admins table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admins (
                    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role TEXT CHECK(role IN ('super_admin', 'librarian')) NOT NULL DEFAULT 'librarian',
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            ''')

            # 2. Members table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS members (
                    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    phone VARCHAR(20),
                    password_hash VARCHAR(255) NOT NULL,
                    status TEXT CHECK(status IN ('active', 'suspended', 'inactive')) NOT NULL DEFAULT 'active',
                    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            ''')

            # 3. Categories table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS categories (
                    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_name VARCHAR(80) NOT NULL UNIQUE,
                    description TEXT
                );
            ''')

            # 4. Authors table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS authors (
                    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    author_name VARCHAR(100) NOT NULL,
                    biography TEXT
                );
            ''')

            # 5. Books table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS books (
                    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    isbn VARCHAR(20) NOT NULL UNIQUE,
                    title VARCHAR(200) NOT NULL,
                    category_id INTEGER NOT NULL,
                    publisher VARCHAR(100),
                    publication_year INTEGER CHECK (publication_year BETWEEN 1000 AND 2100),
                    language VARCHAR(30) NOT NULL DEFAULT 'English',
                    pages INTEGER CHECK (pages > 0),
                    total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
                    available_copies INTEGER NOT NULL CHECK (available_copies >= 0 AND available_copies <= total_copies),
                    shelf_location VARCHAR(20),
                    description TEXT,
                    cover_image VARCHAR(255),
                    added_by INTEGER,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
                    FOREIGN KEY (added_by) REFERENCES admins(admin_id) ON DELETE SET NULL
                );
            ''')

            # 6. Book Authors (junction table)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS book_authors (
                    book_id INTEGER NOT NULL,
                    author_id INTEGER NOT NULL,
                    PRIMARY KEY (book_id, author_id),
                    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
                    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
                );
            ''')

            # 7. Borrowings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS borrowings (
                    borrowing_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER NOT NULL,
                    book_id INTEGER NOT NULL,
                    issued_by INTEGER,
                    issue_date DATE NOT NULL DEFAULT (DATE('now')),
                    due_date DATE NOT NULL,
                    return_date DATE,
                    status TEXT CHECK(status IN ('borrowed', 'returned', 'overdue')) NOT NULL DEFAULT 'borrowed',
                    FOREIGN KEY (member_id) REFERENCES members(member_id),
                    FOREIGN KEY (book_id) REFERENCES books(book_id),
                    FOREIGN KEY (issued_by) REFERENCES admins(admin_id) ON DELETE SET NULL
                );
            ''')

            # 8. Reservations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS reservations (
                    reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER NOT NULL,
                    book_id INTEGER NOT NULL,
                    reservation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    status TEXT CHECK(status IN ('pending', 'fulfilled', 'cancelled', 'expired')) NOT NULL DEFAULT 'pending',
                    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
                    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
                );
            ''')

            # 9. Fines table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS fines (
                    fine_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    borrowing_id INTEGER NOT NULL UNIQUE,
                    amount DECIMAL(8,2) NOT NULL CHECK (amount >= 0),
                    reason VARCHAR(100) NOT NULL DEFAULT 'Overdue',
                    status TEXT CHECK(status IN ('unpaid', 'paid')) NOT NULL DEFAULT 'unpaid',
                    issued_date DATE NOT NULL DEFAULT (DATE('now')),
                    paid_date DATE,
                    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id)
                );
            ''')

            # 10. Wishlists table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS wishlists (
                    wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER NOT NULL,
                    book_id INTEGER NOT NULL,
                    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(member_id, book_id),
                    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
                    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
                );
            ''')

            conn.commit()

        # Seed initial data if empty
        self.seed_defaults()

    def seed_defaults(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM admins;")
            if cursor.fetchone()[0] == 0:
                # Seed admins (Admin J. Mwangi from the deliverable mockups)
                pwd = self.hash_password("admin123")
                cursor.execute("""
                    INSERT INTO admins (full_name, email, password_hash, role)
                    VALUES 
                    ('J. Mwangi', 'admin@library.ac.ke', ?, 'super_admin'),
                    ('Grace Muthoni', 'gmuthoni@library.ac.ke', ?, 'librarian');
                """, (pwd, pwd))

                # Seed Categories matching deliverable filters
                cursor.execute("""
                    INSERT INTO categories (category_name, description) VALUES
                    ('Technology', 'Computing, Software Engineering, Python, AI, and Systems'),
                    ('Science', 'Physics, Biology, Chemistry, Mathematics and Applied Sciences'),
                    ('Business', 'Economics, Management, Entrepreneurship, Accounting and Finance'),
                    ('Literature', 'Novels, Classical prose, poetry and drama'),
                    ('History', 'African history, World civilizations and social studies');
                """)

                # Seed Authors
                cursor.execute("""
                    INSERT INTO authors (author_name, biography) VALUES
                    ('Guido van Rossum', 'Creator of the Python programming language and former BDFL.'),
                    ('Robert C. Martin', 'Uncle Bob - Renowned software engineer, author of Clean Code and Clean Architecture.'),
                    ('Stuart Russell', 'Professor of Computer Science at UC Berkeley, co-author of AI: A Modern Approach.'),
                    ('Peter Norvig', 'Distinguished Education Fellow at Stanford and co-author of modern AI textbooks.'),
                    ('Eric Evans', 'Author of Domain-Driven Design and expert on object-oriented system modeling.'),
                    ('Benjamin Graham', 'Father of value investing and author of The Intelligent Investor.'),
                    ('Stephen Hawking', 'Theoretical physicist, cosmologist, and author of A Brief History of Time.'),
                    ('Chinua Achebe', 'Renowned Nigerian novelist, author of Things Fall Apart.'),
                    ('Ngũgĩ wa Thiong\'o', 'Celebrated Kenyan author, playwright, and academic.'),
                    ('Yuval Noah Harari', 'Historian, philosopher, and bestselling author of Sapiens.'),
                    ('Carl Sagan', 'Astronomer, planetary scientist, and science communicator.'),
                    ('Matt Haig', 'Bestselling author of The Midnight Library.'),
                    ('Paulo Coelho', 'Author of The Alchemist.');
                """)

                # Seed Members (matching Deliverable screenshots: Beatrice, Zora, Wangui, Hayley, etc.)
                mem_pwd = self.hash_password("member123")
                cursor.execute("""
                    INSERT INTO members (full_name, email, phone, password_hash, status) VALUES
                    ('Beatrice Wanjiku', 'beatrice.w@student.ac.ke', '+254 712 345 678', ?, 'active'),
                    ('Zora Kiprop', 'zora.kiprop@student.ac.ke', '+254 723 456 789', ?, 'active'),
                    ('Wangui Kariuki', 'wangui.k@student.ac.ke', '+254 734 567 890', ?, 'active'),
                    ('Hayley Odhiambo', 'hayley.o@student.ac.ke', '+254 745 678 901', ?, 'active'),
                    ('Kevin Mutua', 'kevin.m@student.ac.ke', '+254 756 789 012', ?, 'suspended'),
                    ('Faith Chebet', 'faith.c@student.ac.ke', '+254 767 890 123', ?, 'active'),
                    ('Brian Otieno', 'brian.o@student.ac.ke', '+254 778 901 234', ?, 'active'),
                    ('Lorna Nduta', 'lorna.n@student.ac.ke', '+254 789 012 345', ?, 'inactive');
                """, (mem_pwd, mem_pwd, mem_pwd, mem_pwd, mem_pwd, mem_pwd, mem_pwd, mem_pwd))

                # Seed Books (rich dataset matching deliverable screenshots)
                cursor.execute("""
                    INSERT INTO books (isbn, title, category_id, publisher, publication_year, language, pages, total_copies, available_copies, shelf_location, description, cover_image, added_by) VALUES
                    ('978-0-00-00000', 'Python Object-Oriented Programming', 1, 'TechPress Academic', 2024, 'English', 480, 5, 3, 'Shelf A-12', 'Comprehensive guide to OOP paradigms, encapsulation, polymorphism, inheritance, and clean Python design patterns.', 'https://covers.openlibrary.org/b/isbn/9781849511261-L.jpg', 1),
                    ('978-0-00-00001', 'Clean Code: A Handbook of Agile Craftsmanship', 1, 'Prentice Hall', 2022, 'English', 464, 5, 2, 'Shelf A-14', 'Practical software engineering handbook emphasizing readable, maintainable, and robust object-oriented code.', 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg', 1),
                    ('978-0-00-00002', 'Artificial Intelligence: A Modern Approach', 1, 'Pearson Education', 2023, 'English', 1152, 4, 3, 'Shelf B-03', 'The definitive authority on modern artificial intelligence, neural architectures, agent design, and intelligent search algorithms.', 'https://covers.openlibrary.org/b/isbn/9780136042594-L.jpg', 1),
                    ('978-0-00-00003', 'Domain-Driven Design: Tackling Complexity', 1, 'Addison-Wesley', 2021, 'English', 560, 3, 1, 'Shelf B-07', 'System architecture principles connecting business domain logic to clean object-oriented class hierarchies.', 'https://covers.openlibrary.org/b/isbn/9780321125217-L.jpg', 1),
                    ('978-0-00-00004', 'The Intelligent Investor', 3, 'Harper Business', 2020, 'English', 640, 6, 5, 'Shelf C-01', 'The foundational masterpiece on portfolio allocation, fundamental analysis, and long-term risk management.', 'https://covers.openlibrary.org/b/isbn/9780060555665-L.jpg', 2),
                    ('978-0-00-00005', 'A Brief History of Time', 2, 'Bantam Books', 2019, 'English', 256, 4, 4, 'Shelf D-05', 'From the Big Bang to black holes, an accessible exploration of cosmology, spacetime, and quantum mechanics.', 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg', 1),
                    ('978-0-00-00006', 'Database System Concepts & Design', 1, 'McGraw-Hill', 2023, 'English', 832, 5, 4, 'Shelf A-18', 'Comprehensive textbook on relational DBMS, SQL optimization, ACID transactions, and entity-relationship models.', 'https://covers.openlibrary.org/b/isbn/9780073523323-L.jpg', 2),
                    ('978-0-00-00007', 'Business Strategy & Competitive Advantage', 3, 'Harvard Business Review', 2022, 'English', 384, 4, 4, 'Shelf C-09', 'Frameworks for strategic market differentiation, value chain analysis, and sustainable competitive positioning.', 'https://covers.openlibrary.org/b/isbn/9780674057241-L.jpg', 1),
                    ('978-0-00-00008', 'Things Fall Apart', 4, 'Heinemann African Writers', 1958, 'English', 209, 6, 5, 'Shelf L-01', 'Masterpiece portraying pre-colonial life in Southeastern Nigeria and the clash of cultures during British colonization.', 'https://covers.openlibrary.org/b/isbn/9780385474542-L.jpg', 1),
                    ('978-0-00-00009', 'The River Between', 4, 'East African Educational Publishers', 1965, 'English', 152, 5, 4, 'Shelf L-04', 'Classic novel chronicling the separation of two neighbouring Kikuyu ridges by a river of historical conflict.', 'https://covers.openlibrary.org/b/isbn/9780435905484-L.jpg', 1),
                    ('978-0-00-00010', 'The Midnight Library', 4, 'Canongate Books', 2020, 'English', 304, 5, 3, 'Shelf L-09', 'Enchanting novel exploring infinite alternate realities and the life-affirming choices that define us.', 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg', 1),
                    ('978-0-00-00011', 'The Alchemist', 4, 'HarperOne', 1988, 'English', 208, 6, 6, 'Shelf L-12', 'Inspiring fable of Santiago, an Andalusian shepherd boy who journeys in search of a treasure.', 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg', 1),
                    ('978-0-00-00012', 'Sapiens: A Brief History of Humankind', 5, 'Harper', 2015, 'English', 464, 5, 4, 'Shelf H-02', 'A groundbreaking narrative exploring how Homo sapiens came to dominate Earth and shape civilizations.', 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg', 1),
                    ('978-0-00-00013', 'A History of Modern Africa', 5, 'Wiley-Blackwell', 2019, 'English', 416, 4, 3, 'Shelf H-07', 'In-depth historical survey of political, social, and economic transformations across the African continent.', 'https://covers.openlibrary.org/b/isbn/9780199552016-L.jpg', 1),
                    ('978-0-00-00014', 'Cosmos', 2, 'Random House', 1980, 'English', 384, 5, 4, 'Shelf D-02', 'Lyrical exploration of cosmic evolution, human curiosity, and our scientific place in the universe.', 'https://covers.openlibrary.org/b/isbn/9780345331359-L.jpg', 1);
                """)

                # Seed book authors relations
                cursor.execute("""
                    INSERT INTO book_authors (book_id, author_id) VALUES
                    (1, 1),
                    (2, 2),
                    (3, 3),
                    (3, 4),
                    (4, 5),
                    (5, 6),
                    (6, 7),
                    (7, 2),
                    (8, 6),
                    (9, 8),
                    (10, 9),
                    (11, 12),
                    (12, 13),
                    (13, 10),
                    (14, 10),
                    (15, 11);
                """)

                # Seed Borrowings (matching Deliverable Page 2 and Page 4 mockups)
                today = datetime.now()
                d_issue1 = (today - timedelta(days=20)).strftime('%Y-%m-%d')
                d_due1 = (today - timedelta(days=6)).strftime('%Y-%m-%d') # Overdue!
                
                d_issue2 = (today - timedelta(days=5)).strftime('%Y-%m-%d')
                d_due2 = (today + timedelta(days=9)).strftime('%Y-%m-%d') # Active loan

                d_issue3 = (today - timedelta(days=12)).strftime('%Y-%m-%d')
                d_due3 = (today + timedelta(days=2)).strftime('%Y-%m-%d') # Active loan

                cursor.execute("""
                    INSERT INTO borrowings (member_id, book_id, issued_by, issue_date, due_date, status) VALUES
                    (1, 1, 1, ?, ?, 'overdue'),
                    (2, 2, 1, ?, ?, 'borrowed'),
                    (3, 3, 1, ?, ?, 'borrowed'),
                    (4, 4, 2, ?, ?, 'borrowed');
                """, (d_issue1, d_due1, d_issue2, d_due2, d_issue3, d_due3, d_issue2, d_due2))

                # Seed Fines for overdue book
                cursor.execute("""
                    INSERT INTO fines (borrowing_id, amount, reason, status, issued_date)
                    VALUES (1, 300.00, 'Overdue by 6 days (KES 50/day)', 'unpaid', ?);
                """, (today.strftime('%Y-%m-%d'),))

                # Seed Wishlist
                cursor.execute("""
                    INSERT INTO wishlists (member_id, book_id) VALUES
                    (1, 5),
                    (2, 1),
                    (3, 2);
                """)

                conn.commit()
