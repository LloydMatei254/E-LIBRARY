-- Idempotent starter catalogue seed (5 categories, authors, and 15 academic titles)
insert into public.categories (category_name, description)
values
  ('Technology', 'Computing, Software Engineering, Python, AI, and Systems'),
  ('Science', 'Physics, Biology, Chemistry, Mathematics and Applied Sciences'),
  ('Business', 'Economics, Management, Entrepreneurship, Accounting and Finance'),
  ('Literature', 'Novels, Classical prose, poetry and drama'),
  ('History', 'African history, World civilizations and social studies')
on conflict (category_name) do nothing;

insert into public.authors (author_name, biography)
values
  ('Guido van Rossum', ''),
  ('Robert C. Martin', ''),
  ('Stuart Russell', ''),
  ('Peter Norvig', ''),
  ('Eric Evans', ''),
  ('Benjamin Graham', ''),
  ('Stephen Hawking', ''),
  ('Abraham Silberschatz', ''),
  ('Michael Porter', ''),
  ('Chinua Achebe', ''),
  ('Ngũgĩ wa Thiong''o', ''),
  ('Matt Haig', ''),
  ('Paulo Coelho', ''),
  ('Yuval Noah Harari', ''),
  ('John Iliffe', ''),
  ('Carl Sagan', '')
on conflict (author_name) do nothing;

with seed_books (
  isbn, title, category_name, publisher, publication_year, language,
  pages, total_copies, available_copies, shelf_location, description, cover_image, authors
) as (
  values
    ('978-0-00-00000', 'Python Object-Oriented Programming', 'Technology', 'TechPress Academic', 2024, 'English', 480, 5, 5, 'Shelf A-12', 'Comprehensive guide to OOP paradigms, encapsulation, polymorphism, inheritance, and clean Python design patterns.', 'https://covers.openlibrary.org/b/isbn/9781849511261-L.jpg', array['Guido van Rossum']),
    ('978-0-00-00001', 'Clean Code: A Handbook of Agile Craftsmanship', 'Technology', 'Prentice Hall', 2022, 'English', 464, 5, 5, 'Shelf A-14', 'Practical software engineering handbook emphasizing readable, maintainable, and robust object-oriented code.', 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg', array['Robert C. Martin']),
    ('978-0-00-00002', 'Artificial Intelligence: A Modern Approach', 'Technology', 'Pearson Education', 2023, 'English', 1152, 4, 4, 'Shelf B-03', 'The definitive authority on modern artificial intelligence, neural architectures, agent design, and intelligent search algorithms.', 'https://covers.openlibrary.org/b/isbn/9780136042594-L.jpg', array['Stuart Russell', 'Peter Norvig']),
    ('978-0-00-00003', 'Domain-Driven Design: Tackling Complexity', 'Technology', 'Addison-Wesley', 2021, 'English', 560, 3, 3, 'Shelf B-07', 'System architecture principles connecting business domain logic to clean object-oriented class hierarchies.', 'https://covers.openlibrary.org/b/isbn/9780321125217-L.jpg', array['Eric Evans']),
    ('978-0-00-00004', 'The Intelligent Investor', 'Business', 'Harper Business', 2020, 'English', 640, 6, 6, 'Shelf C-01', 'The foundational masterpiece on portfolio allocation, fundamental analysis, and long-term risk management.', 'https://covers.openlibrary.org/b/isbn/9780060555665-L.jpg', array['Benjamin Graham']),
    ('978-0-00-00005', 'A Brief History of Time', 'Science', 'Bantam Books', 2019, 'English', 256, 4, 4, 'Shelf D-05', 'From the Big Bang to black holes, an accessible exploration of cosmology, spacetime, and quantum mechanics.', 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg', array['Stephen Hawking']),
    ('978-0-00-00006', 'Database System Concepts & Design', 'Technology', 'McGraw-Hill', 2023, 'English', 832, 5, 5, 'Shelf A-18', 'Comprehensive textbook on relational DBMS, SQL optimization, ACID transactions, and entity-relationship models.', 'https://covers.openlibrary.org/b/isbn/9780073523323-L.jpg', array['Abraham Silberschatz']),
    ('978-0-00-00007', 'Business Strategy & Competitive Advantage', 'Business', 'Harvard Business Review', 2022, 'English', 384, 4, 4, 'Shelf C-09', 'Frameworks for strategic market differentiation, value chain analysis, and sustainable competitive positioning.', 'https://covers.openlibrary.org/b/isbn/9780674057241-L.jpg', array['Michael Porter']),
    ('978-0-00-00008', 'Things Fall Apart', 'Literature', 'Heinemann African Writers', 1958, 'English', 209, 6, 6, 'Shelf L-01', 'Masterpiece portraying pre-colonial life in Southeastern Nigeria and the clash of cultures during British colonization.', 'https://covers.openlibrary.org/b/isbn/9780385474542-L.jpg', array['Chinua Achebe']),
    ('978-0-00-00009', 'The River Between', 'Literature', 'East African Educational Publishers', 1965, 'English', 152, 5, 5, 'Shelf L-04', 'Classic novel chronicling the separation of two neighbouring Kikuyu ridges by a river of historical conflict.', 'https://covers.openlibrary.org/b/isbn/9780435905484-L.jpg', array['Ngũgĩ wa Thiong''o']),
    ('978-0-00-00010', 'The Midnight Library', 'Literature', 'Canongate Books', 2020, 'English', 304, 5, 5, 'Shelf L-09', 'Enchanting novel exploring infinite alternate realities and the life-affirming choices that define us.', 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg', array['Matt Haig']),
    ('978-0-00-00011', 'The Alchemist', 'Literature', 'HarperOne', 1988, 'English', 208, 6, 6, 'Shelf L-12', 'Inspiring fable of Santiago, an Andalusian shepherd boy who journeys in search of a treasure.', 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg', array['Paulo Coelho']),
    ('978-0-00-00012', 'Sapiens: A Brief History of Humankind', 'History', 'Harper', 2015, 'English', 464, 5, 5, 'Shelf H-02', 'A groundbreaking narrative exploring how Homo sapiens came to dominate Earth and shape civilizations.', 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg', array['Yuval Noah Harari']),
    ('978-0-00-00013', 'A History of Modern Africa', 'History', 'Wiley-Blackwell', 2019, 'English', 416, 4, 4, 'Shelf H-07', 'In-depth historical survey of political, social, and economic transformations across the African continent.', 'https://covers.openlibrary.org/b/isbn/9780199552016-L.jpg', array['John Iliffe']),
    ('978-0-00-00014', 'Cosmos', 'Science', 'Random House', 1980, 'English', 384, 5, 5, 'Shelf D-02', 'Lyrical exploration of cosmic evolution, human curiosity, and our scientific place in the universe.', 'https://covers.openlibrary.org/b/isbn/9780345331359-L.jpg', array['Carl Sagan'])
),
inserted_books as (
  insert into public.books (
    isbn, title, category_id, publisher, publication_year, language,
    pages, total_copies, available_copies, shelf_location, description, cover_image
  )
  select
    sb.isbn,
    sb.title,
    c.category_id,
    sb.publisher,
    sb.publication_year,
    sb.language,
    sb.pages,
    sb.total_copies,
    sb.available_copies,
    sb.shelf_location,
    sb.description,
    sb.cover_image
  from seed_books sb
  join public.categories c on lower(c.category_name) = lower(sb.category_name)
  on conflict (isbn) do nothing
  returning book_id, isbn
)
insert into public.book_authors (book_id, author_id)
select b.book_id, a.author_id
from seed_books sb
join public.books b on b.isbn = sb.isbn
cross join lateral unnest(sb.authors) as author_entry(author_name)
join public.authors a on lower(a.author_name) = lower(author_entry.author_name)
on conflict do nothing;
