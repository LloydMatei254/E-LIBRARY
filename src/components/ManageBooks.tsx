import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';
import { Book, Category } from '../types';
import { api } from '../services/api';

export const ManageBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form fields matching Section 3.4
  const [formTitle, setFormTitle] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formAuthors, setFormAuthors] = useState('');
  const [formPublisher, setFormPublisher] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number>(1);
  const [formYear, setFormYear] = useState<number>(2024);
  const [formLanguage, setFormLanguage] = useState('English');
  const [formPages, setFormPages] = useState<number>(250);
  const [formTotalCopies, setFormTotalCopies] = useState<number>(5);
  const [formShelfLocation, setFormShelfLocation] = useState('Shelf A-12');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, cData] = await Promise.all([
        api.getBooks({
          search: search || undefined,
          category_id: selectedCategory !== 'All' ? Number(selectedCategory) : undefined,
        }),
        api.getCategories(),
      ]);
      setBooks(bData);
      setCategories(cData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setFormTitle('');
    setFormIsbn(`978-0-00-${Math.floor(10000 + Math.random() * 90000)}`);
    setFormAuthors('');
    setFormPublisher('');
    setFormCategoryId(categories[0]?.category_id || 1);
    setFormYear(2024);
    setFormLanguage('English');
    setFormPages(320);
    setFormTotalCopies(5);
    setFormShelfLocation('Shelf A-12');
    setFormDescription('');
    setFormCoverImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormTitle(book.title);
    setFormIsbn(book.isbn);
    setFormAuthors(book.authors?.join(', ') || '');
    setFormPublisher(book.publisher || '');
    setFormCategoryId(book.category_id);
    setFormYear(book.publication_year || 2024);
    setFormLanguage(book.language || 'English');
    setFormPages(book.pages || 250);
    setFormTotalCopies(book.total_copies);
    setFormShelfLocation(book.shelf_location || '');
    setFormDescription(book.description || '');
    setFormCoverImage(book.cover_image || '');
    setIsModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        title: formTitle,
        isbn: formIsbn,
        authors: formAuthors.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
        publisher: formPublisher,
        category_id: Number(formCategoryId),
        publication_year: Number(formYear),
        language: formLanguage,
        pages: Number(formPages),
        total_copies: Number(formTotalCopies),
        shelf_location: formShelfLocation,
        description: formDescription,
        cover_image: formCoverImage,
      };

      if (editingBook) {
        await api.updateBook(editingBook.book_id, payload);
        notify(`Updated book "${formTitle}" successfully.`);
      } else {
        await api.addBook(payload);
        notify(`New book "${formTitle}" added to Python SQLite database.`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDeleteBook = async (bookId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteBook(bookId);
      notify(`Book "${title}" deleted.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete book');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Header & Search Bar matching Section 3.3 wireframe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manage Books
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverable 2 Section 3.3 · Complete Catalog CRUD connected to SQLite
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Book</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Category Filter Strip strictly matching Section 3.3 wireframe */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books by title, ISBN, author..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-600 font-medium">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table matching Section 3.3 wireframe */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-14">ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 font-mono">ISBN</th>
                <th className="py-3 px-4 text-center">Copies</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading books from Python SQLite database...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No books found. Click "+ Add New Book" to create one.
                  </td>
                </tr>
              ) : (
                books.map((b) => (
                  <tr key={b.book_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                      {b.book_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {b.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.authors?.join(', ') || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {b.category_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {b.isbn}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      <span className={b.available_copies > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {b.available_copies}/{b.total_copies}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(b)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b.book_id, b.title)}
                          className="px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar matching Section 3.3 wireframe */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {books.length} of {books.length} books</span>
          <div className="flex items-center gap-1 font-medium">
            <button disabled className="px-2 py-1 rounded text-slate-400">
              &lt; Prev
            </button>
            <span className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 font-semibold">
              1
            </span>
            <button disabled className="px-2 py-1 rounded text-slate-400">
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Section 3.4: Add / Edit Book Modal strictly matching wireframe */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingBook ? 'Edit Book' : 'Add Book'}
              </h2>
              <span className="text-xs text-slate-500">
                Deliverable 2 Section 3.4 Add / Edit Book Form
              </span>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Book Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* ISBN */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ISBN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="978-0-00-00000"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Author(s) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Author(s) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Author name(s) comma separated"
                    value={formAuthors}
                    onChange={(e) => setFormAuthors(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Publisher */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Publisher
                  </label>
                  <input
                    type="text"
                    placeholder="Publisher name"
                    value={formPublisher}
                    onChange={(e) => setFormPublisher(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Publication Year */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    placeholder="YYYY"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Number of Pages */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Number of Pages
                  </label>
                  <input
                    type="number"
                    value={formPages}
                    onChange={(e) => setFormPages(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Total Copies */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Total Copies *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formTotalCopies}
                    onChange={(e) => setFormTotalCopies(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Shelf Location */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A-12"
                    value={formShelfLocation}
                    onChange={(e) => setFormShelfLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter abstract or synopsis..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons matching wireframe */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
