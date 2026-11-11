"""
Berzowanley Online Library System - OOP Models & Domain Architecture
Demonstrates Python Object-Oriented Programming principles:
- Abstraction (ABC, abstract methods)
- Encapsulation (Private attributes, property getters/setters with validation)
- Inheritance (Person -> Member, Admin)
- Polymorphism (Method overriding, string representation, custom permissions)
"""

from abc import ABC, abstractmethod
from datetime import datetime, date
from typing import List, Optional, Dict, Any


class BaseEntity(ABC):
    """Abstract Base Class providing common serialization and validation contract."""
    
    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """Convert object attributes to a JSON-serializable dictionary."""
        pass

    @abstractmethod
    def validate(self) -> bool:
        """Enforce domain integrity invariants."""
        pass


class Person(BaseEntity):
    """
    Abstract representation of a human user in the library ecosystem.
    Demonstrates encapsulation and inheritance hierarchy.
    """
    def __init__(self, person_id: Optional[int], full_name: str, email: str, created_at: Optional[str] = None):
        self._id = person_id
        self._full_name = full_name.strip()
        self._email = email.strip().lower()
        self._created_at = created_at or datetime.now().isoformat()

    @property
    def id(self) -> Optional[int]:
        return self._id

    @property
    def full_name(self) -> str:
        return self._full_name

    @full_name.setter
    def full_name(self, value: str):
        if not value or len(value.strip()) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        self._full_name = value.strip()

    @property
    def email(self) -> str:
        return self._email

    @email.setter
    def email(self, value: str):
        if "@" not in value or "." not in value:
            raise ValueError(f"Invalid email address: {value}")
        self._email = value.strip().lower()

    @property
    def created_at(self) -> str:
        return self._created_at

    @abstractmethod
    def get_role(self) -> str:
        """Polymorphic role identifier."""
        pass

    def validate(self) -> bool:
        return len(self._full_name) >= 2 and "@" in self._email


class Member(Person):
    """
    Library patron entity inheriting from Person.
    Encapsulates borrowing allowances, phone numbers, and membership status.
    """
    MAX_BORROW_LIMIT = 5

    def __init__(self, member_id: Optional[int], full_name: str, email: str, 
                 phone: str = "", status: str = "active", registered_at: Optional[str] = None):
        super().__init__(member_id, full_name, email, registered_at)
        self._phone = phone
        self.status = status  # Uses setter for validation

    @property
    def phone(self) -> str:
        return self._phone

    @phone.setter
    def phone(self, value: str):
        self._phone = value.strip()

    @property
    def status(self) -> str:
        return self._status

    @status.setter
    def status(self, value: str):
        allowed = ('active', 'suspended', 'inactive')
        clean_val = value.lower().strip()
        if clean_val not in allowed:
            raise ValueError(f"Status must be one of {allowed}. Received '{value}'")
        self._status = clean_val

    def get_role(self) -> str:
        return "member"

    def can_borrow(self, current_active_loans: int, has_unpaid_fines: bool = False) -> bool:
        """Encapsulated business rule for book borrowing eligibility."""
        if self._status != "active":
            return False
        if has_unpaid_fines:
            return False
        return current_active_loans < self.MAX_BORROW_LIMIT

    def to_dict(self) -> Dict[str, Any]:
        return {
            "member_id": self._id,
            "full_name": self._full_name,
            "email": self._email,
            "phone": self._phone,
            "status": self._status,
            "registered_at": self._created_at,
            "role": self.get_role()
        }

    def __repr__(self) -> str:
        return f"<Member #{self._id}: {self._full_name} ({self._status})>"


class Admin(Person):
    """
    Library administrative staff member inheriting from Person.
    Encapsulates administrative roles and privileges.
    """
    def __init__(self, admin_id: Optional[int], full_name: str, email: str, 
                 role: str = "librarian", created_at: Optional[str] = None):
        super().__init__(admin_id, full_name, email, created_at)
        self.role = role

    @property
    def role(self) -> str:
        return self._role

    @role.setter
    def role(self, value: str):
        allowed = ('super_admin', 'librarian')
        val = value.lower().strip()
        if val not in allowed:
            raise ValueError(f"Admin role must be one of {allowed}. Received '{value}'")
        self._role = val

    def get_role(self) -> str:
        return self._role

    def can_manage_system(self) -> bool:
        return self._role == "super_admin"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "admin_id": self._id,
            "full_name": self._full_name,
            "email": self._email,
            "role": self._role,
            "created_at": self._created_at
        }

    def __repr__(self) -> str:
        return f"<Admin #{self._id}: {self._full_name} [{self._role}]>"


class Category(BaseEntity):
    """Represents a catalog subject classification."""
    def __init__(self, category_id: Optional[int], category_name: str, description: str = ""):
        self.category_id = category_id
        self.category_name = category_name.strip()
        self.description = description.strip()

    def validate(self) -> bool:
        return len(self.category_name) > 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category_id": self.category_id,
            "category_name": self.category_name,
            "description": self.description
        }


class Author(BaseEntity):
    """Represents a book author with biographical details."""
    def __init__(self, author_id: Optional[int], author_name: str, biography: str = ""):
        self.author_id = author_id
        self.author_name = author_name.strip()
        self.biography = biography.strip()

    def validate(self) -> bool:
        return len(self.author_name) > 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "author_id": self.author_id,
            "author_name": self.author_name,
            "biography": self.biography
        }


class Book(BaseEntity):
    """
    Represents a bibliographic resource in the library catalog.
    Demonstrates data validation and inventory tracking via properties.
    """
    def __init__(self, book_id: Optional[int], isbn: str, title: str, category_id: int,
                 publisher: str = "", publication_year: int = 2024, language: str = "English",
                 pages: int = 100, total_copies: int = 1, available_copies: int = 1,
                 shelf_location: str = "", description: str = "", cover_image: str = "",
                 category_name: str = "", authors: Optional[List[str]] = None,
                 created_at: Optional[str] = None):
        self.book_id = book_id
        self.isbn = isbn.strip()
        self.title = title.strip()
        self.category_id = category_id
        self.publisher = publisher.strip()
        self.publication_year = publication_year
        self.language = language.strip()
        self.pages = pages
        self._total_copies = max(0, total_copies)
        self._available_copies = max(0, min(available_copies, self._total_copies))
        self.shelf_location = shelf_location.strip()
        self.description = description.strip()
        self.cover_image = cover_image.strip()
        self.category_name = category_name
        self.authors = authors or []
        self.created_at = created_at or datetime.now().isoformat()

    @property
    def total_copies(self) -> int:
        return self._total_copies

    @total_copies.setter
    def total_copies(self, value: int):
        if value < 0:
            raise ValueError("Total copies cannot be negative.")
        self._total_copies = value
        if self._available_copies > self._total_copies:
            self._available_copies = self._total_copies

    @property
    def available_copies(self) -> int:
        return self._available_copies

    @property
    def is_available(self) -> bool:
        """Derived property indicating physical availability for loan."""
        return self._available_copies > 0

    def borrow_copy(self) -> bool:
        """Decrement available copies when issued."""
        if self._available_copies > 0:
            self._available_copies -= 1
            return True
        return False

    def return_copy(self) -> bool:
        """Increment available copies when returned."""
        if self._available_copies < self._total_copies:
            self._available_copies += 1
            return True
        return False

    def validate(self) -> bool:
        return len(self.isbn) >= 5 and len(self.title) > 0 and self.category_id > 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "book_id": self.book_id,
            "isbn": self.isbn,
            "title": self.title,
            "category_id": self.category_id,
            "category_name": self.category_name,
            "publisher": self.publisher,
            "publication_year": self.publication_year,
            "language": self.language,
            "pages": self.pages,
            "total_copies": self._total_copies,
            "available_copies": self._available_copies,
            "is_available": self.is_available,
            "shelf_location": self.shelf_location,
            "description": self.description,
            "cover_image": self.cover_image,
            "authors": self.authors,
            "created_at": self.created_at
        }

    def __repr__(self) -> str:
        return f"<Book {self.isbn}: '{self.title}' ({self._available_copies}/{self._total_copies} available)>"


class BorrowingTransaction(BaseEntity):
    """
    Models the issuance and return lifecycle of a physical book copy.
    Calculates overdue periods and fines in Kenyan Shillings (KES).
    """
    DAILY_OVERDUE_RATE_KES = 50.0  # KES 50 per overdue day

    def __init__(self, borrowing_id: Optional[int], member_id: int, book_id: int,
                 issued_by: Optional[int] = None, issue_date: Optional[str] = None,
                 due_date: Optional[str] = None, return_date: Optional[str] = None,
                 status: str = "borrowed", member_name: str = "", book_title: str = "",
                 book_isbn: str = ""):
        self.borrowing_id = borrowing_id
        self.member_id = member_id
        self.book_id = book_id
        self.issued_by = issued_by
        self.issue_date = issue_date or date.today().strftime('%Y-%m-%d')
        self.due_date = due_date or (date.today() + timedelta(days=14)).strftime('%Y-%m-%d')
        self.return_date = return_date
        self.status = status
        self.member_name = member_name
        self.book_title = book_title
        self.book_isbn = book_isbn

    def calculate_overdue_days(self) -> int:
        """Computes overdue days past the stipulated loan due date."""
        if self.status == "returned" and self.return_date:
            compare_date = datetime.strptime(self.return_date, '%Y-%m-%d').date()
        else:
            compare_date = date.today()

        due = datetime.strptime(self.due_date, '%Y-%m-%d').date()
        delta = (compare_date - due).days
        return max(0, delta)

    def calculate_fine_amount(self) -> float:
        """Polymorphic fine calculation method based on overdue days."""
        days = self.calculate_overdue_days()
        return round(days * self.DAILY_OVERDUE_RATE_KES, 2)

    def validate(self) -> bool:
        return self.member_id > 0 and self.book_id > 0

    def to_dict(self) -> Dict[str, Any]:
        overdue_days = self.calculate_overdue_days()
        return {
            "borrowing_id": self.borrowing_id,
            "member_id": self.member_id,
            "book_id": self.book_id,
            "issued_by": self.issued_by,
            "issue_date": self.issue_date,
            "due_date": self.due_date,
            "return_date": self.return_date,
            "status": self.status,
            "member_name": self.member_name,
            "book_title": self.book_title,
            "book_isbn": self.book_isbn,
            "overdue_days": overdue_days,
            "estimated_fine": self.calculate_fine_amount()
        }


class Fine(BaseEntity):
    """Encapsulates penalty charges assessed against members."""
    def __init__(self, fine_id: Optional[int], borrowing_id: int, amount: float,
                 reason: str = "Overdue", status: str = "unpaid",
                 issued_date: Optional[str] = None, paid_date: Optional[str] = None,
                 member_name: str = "", book_title: str = ""):
        self.fine_id = fine_id
        self.borrowing_id = borrowing_id
        self.amount = float(amount)
        self.reason = reason
        self.status = status
        self.issued_date = issued_date or date.today().strftime('%Y-%m-%d')
        self.paid_date = paid_date
        self.member_name = member_name
        self.book_title = book_title

    def validate(self) -> bool:
        return self.amount >= 0 and self.borrowing_id > 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fine_id": self.fine_id,
            "borrowing_id": self.borrowing_id,
            "amount": self.amount,
            "reason": self.reason,
            "status": self.status,
            "issued_date": self.issued_date,
            "paid_date": self.paid_date,
            "member_name": self.member_name,
            "book_title": self.book_title
        }


class Reservation(BaseEntity):
    """Models member hold requests on currently circulated books."""
    def __init__(self, reservation_id: Optional[int], member_id: int, book_id: int,
                 reservation_date: Optional[str] = None, status: str = "pending",
                 member_name: str = "", book_title: str = ""):
        self.reservation_id = reservation_id
        self.member_id = member_id
        self.book_id = book_id
        self.reservation_date = reservation_date or datetime.now().isoformat()
        self.status = status
        self.member_name = member_name
        self.book_title = book_title

    def validate(self) -> bool:
        return self.member_id > 0 and self.book_id > 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reservation_id": self.reservation_id,
            "member_id": self.member_id,
            "book_id": self.book_id,
            "reservation_date": self.reservation_date,
            "status": self.status,
            "member_name": self.member_name,
            "book_title": self.book_title
        }
