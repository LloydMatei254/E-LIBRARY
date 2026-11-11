import { Book } from '../types';

// Curated high-res book covers fallback map
export const CURATED_COVERS: Record<string, string> = {
  'python object-oriented programming': 'https://covers.openlibrary.org/b/isbn/9781849511261-L.jpg',
  'clean code': 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
  'artificial intelligence': 'https://covers.openlibrary.org/b/isbn/9780136042594-L.jpg',
  'domain-driven design': 'https://covers.openlibrary.org/b/isbn/9780321125217-L.jpg',
  'the intelligent investor': 'https://covers.openlibrary.org/b/isbn/9780060555665-L.jpg',
  'a brief history of time': 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg',
  'database system concepts': 'https://covers.openlibrary.org/b/isbn/9780073523323-L.jpg',
  'business strategy': 'https://covers.openlibrary.org/b/isbn/9780674057241-L.jpg',
  'things fall apart': 'https://covers.openlibrary.org/b/isbn/9780385474542-L.jpg',
  'the river between': 'https://covers.openlibrary.org/b/isbn/9780435905484-L.jpg',
  'the midnight library': 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg',
  'the alchemist': 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
  'sapiens': 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
  'a history of modern africa': 'https://covers.openlibrary.org/b/isbn/9780199552016-L.jpg',
  'cosmos': 'https://covers.openlibrary.org/b/isbn/9780345331359-L.jpg',
};

export function getBookCoverUrl(book: Book | null | undefined): string {
  if (!book) return 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg';
  
  if (book.cover_image && book.cover_image.trim().startsWith('http')) {
    return book.cover_image.trim();
  }

  const cleanTitle = (book.title || '').toLowerCase().trim();
  for (const [key, url] of Object.entries(CURATED_COVERS)) {
    if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
      return url;
    }
  }

  // Fallback to ISBN query if valid standard format
  if (book.isbn && book.isbn.replace(/[^0-9X]/gi, '').length >= 10) {
    const rawIsbn = book.isbn.replace(/[^0-9X]/gi, '');
    return `https://covers.openlibrary.org/b/isbn/${rawIsbn}-L.jpg?default=false`;
  }

  return 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg';
}
