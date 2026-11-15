import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, AlertCircle, CheckCircle2, BookOpen, Upload, Download } from 'lucide-react';
import { Book, Category } from '../types';
import { api } from '../services/api';
import { isDemoMode } from '../services/supabaseClient';
import { mockBooks, mockCategories } from '../data/mockBooks';

const notifyCatalogueUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('library:catalogue-updated'));
  }
};

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
  const [formCategoryId, setFormCategoryId] = useState<number>(0);
  const [creatingNewCategory, setCreatingNewCategory] = useState(false);
  const [formNewCategoryName, setFormNewCategoryName] = useState('');
  const [formYear, setFormYear] = useState<number>(2024);
  const [formLanguage, setFormLanguage] = useState('English');
  const [formPages, setFormPages] = useState<number>(250);
  const [formTotalCopies, setFormTotalCopies] = useState<number>(5);
  const [formShelfLocation, setFormShelfLocation] = useState('Shelf A-12');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [uploadedCover, setUploadedCover] = useState<{ file: File; categoryId: number; url: string } | null>(null);
  const [savingBook, setSavingBook] = useState(false);
  const [importingStarterCatalogue, setImportingStarterCatalogue] = useState(false);
  const [starterImportProgress, setStarterImportProgress] = useState<{ completed: number; total: number } | null>(null);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

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
    setError(null);
    setEditingBook(null);
    setFormTitle('');
    setFormIsbn(`978-0-00-${Math.floor(10000 + Math.random() * 90000)}`);
    setFormAuthors('');
    setFormPublisher('');
    setFormCategoryId(categories[0]?.category_id || 0);
    setCreatingNewCategory(categories.length === 0);
    setFormNewCategoryName('');
    setFormYear(2024);
    setFormLanguage('English');
    setFormPages(320);
    setFormTotalCopies(5);
    setFormShelfLocation('Shelf A-12');
    setFormDescription('');
    setFormCoverImage('');
    setCoverFile(null);
    setCoverPreviewUrl('');
    setUploadedCover(null);
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setError(null);
    setEditingBook(book);
    setFormTitle(book.title);
    setFormIsbn(book.isbn);
    setFormAuthors(book.authors?.join(', ') || '');
    setFormPublisher(book.publisher || '');
    setFormCategoryId(book.category_id);
    setCreatingNewCategory(false);
    setFormNewCategoryName('');
    setFormYear(book.publication_year || 2024);
    setFormLanguage(book.language || 'English');
    setFormPages(book.pages || 250);
    setFormTotalCopies(book.total_copies);
    setFormShelfLocation(book.shelf_location || '');
    setFormDescription(book.description || '');
    setFormCoverImage(book.cover_image || '');
    setCoverFile(null);
    setCoverPreviewUrl('');
    setUploadedCover(null);
    setIsModalOpen(true);
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      event.currentTarget.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Cover images must be 5 MB or smaller.');
      event.currentTarget.value = '';
      return;
    }

    setError(null);
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    setUploadedCover(null);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavingBook(true);
    try {
      let resolvedCategoryId = Number(formCategoryId);
      if (creatingNewCategory || categories.length === 0 || !Number.isInteger(resolvedCategoryId) || resolvedCategoryId < 1) {
        const cleanCategoryName = formNewCategoryName.trim();
        if (!cleanCategoryName) {
          throw new Error('Create or select a book category before saving.');
        }
        const existing = categories.find(
          (category) => category.category_name.trim().toLocaleLowerCase() === cleanCategoryName.toLocaleLowerCase(),
        );
        if (existing) {
          resolvedCategoryId = existing.category_id;
        } else {
          const createdCategory = await api.addCategory(cleanCategoryName);
          resolvedCategoryId = createdCategory.category_id;
          setCategories((prev) => [...prev, createdCategory].sort((a, b) => a.category_name.localeCompare(b.category_name)));
          setFormCategoryId(createdCategory.category_id);
          setCreatingNewCategory(false);
          setFormNewCategoryName('');
        }
      }

      let coverImage = formCoverImage;
      if (coverFile) {
        const uploadedUrl = uploadedCover?.file === coverFile && uploadedCover.categoryId === resolvedCategoryId
          ? uploadedCover.url
          : await api.uploadBookCover(coverFile, resolvedCategoryId);
        coverImage = uploadedUrl;
        setFormCoverImage(uploadedUrl);
        setUploadedCover({ file: coverFile, categoryId: resolvedCategoryId, url: uploadedUrl });
      }

      const payload = {
        title: formTitle,
        isbn: formIsbn,
        authors: formAuthors.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
        publisher: formPublisher,
        category_id: resolvedCategoryId,
        publication_year: Number(formYear),
        language: formLanguage,
        pages: Number(formPages),
        total_copies: Number(formTotalCopies),
        shelf_location: formShelfLocation,
        description: formDescription,
        cover_image: coverImage,
      };

      if (editingBook) {
        await api.updateBook(editingBook.book_id, payload);
        notify(`Updated book "${formTitle}" successfully.`);
      } else {
        await api.addBook(payload);
        notify(`New book "${formTitle}" added to the library catalogue.`);
      }

      setIsModalOpen(false);
      setCoverFile(null);
      setCoverPreviewUrl('');
      setUploadedCover(null);
      await loadData();
      notifyCatalogueUpdated();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSavingBook(false);
    }
  };

  const tryUploadRemoteCover = async (sourceUrl: string, bookId: number, categoryId: number): Promise<string> => {
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) return sourceUrl;
      const blob = await response.blob();
      const contentType = blob.type.split(';')[0].toLocaleLowerCase();
      const extensionByType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const extension = extensionByType[contentType];
      if (!extension) return sourceUrl;

      const file = new File([blob], `${bookId}.${extension}`, { type: contentType });
      return await api.uploadBookCover(file, categoryId);
    } catch {
      return sourceUrl;
    }
  };

  const handleImportStarterCatalogue = async () => {
    if (!confirm(`Import starter categories and ${mockBooks.length} starter books into your live Supabase catalogue?`)) return;

    setError(null);
    setImportingStarterCatalogue(true);
    setStarterImportProgress({ completed: 0, total: mockBooks.length });
    let createdBooks = 0;
    let updatedCovers = 0;
    let skipped = 0;
    const failures: string[] = [];
    const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');

    try {
      const [initialBooks, initialCategories] = await Promise.all([api.getBooks(), api.getCategories()]);
      const categoryByName = new Map(
        initialCategories.map((category) => [normalize(category.category_name), category]),
      );

      for (const starterCategory of mockCategories) {
        const key = normalize(starterCategory.category_name);
        if (!categoryByName.has(key)) {
          const created = await api.addCategory(starterCategory.category_name, starterCategory.description);
          categoryByName.set(key, created);
        }
      }

      for (const demoBook of mockBooks) {
        try {
          const liveCategory = categoryByName.get(normalize(demoBook.category_name ?? ''));
          if (!liveCategory) {
            throw new Error(`Category "${demoBook.category_name ?? 'Uncategorized'}" could not be resolved.`);
          }

          const liveBook = initialBooks.find(
            (book) => normalize(book.isbn) === normalize(demoBook.isbn)
              || normalize(book.title) === normalize(demoBook.title),
          );
          const sourceUrl = demoBook.cover_image?.trim() ?? '';

          if (!liveBook) {
            const coverUrl = sourceUrl
              ? await tryUploadRemoteCover(sourceUrl, demoBook.book_id, liveCategory.category_id)
              : '';
            await api.addBook({
              isbn: demoBook.isbn,
              title: demoBook.title,
              authors: demoBook.authors,
              publisher: demoBook.publisher,
              category_id: liveCategory.category_id,
              publication_year: demoBook.publication_year,
              language: demoBook.language,
              pages: demoBook.pages,
              total_copies: demoBook.total_copies,
              shelf_location: demoBook.shelf_location,
              description: demoBook.description,
              cover_image: coverUrl,
            });
            createdBooks += 1;
          } else if (
            sourceUrl
            && !liveBook.cover_image?.includes('/storage/v1/object/public/book-covers/')
            && (!liveBook.cover_image || liveBook.cover_image === sourceUrl)
          ) {
            const uploadedUrl = await tryUploadRemoteCover(sourceUrl, demoBook.book_id, liveCategory.category_id);
            if (uploadedUrl !== liveBook.cover_image) {
              await api.updateBook(liveBook.book_id, { ...liveBook, cover_image: uploadedUrl });
              updatedCovers += 1;
            } else {
              skipped += 1;
            }
          } else {
            skipped += 1;
          }
        } catch (err) {
          failures.push(`${demoBook.title}: ${err instanceof Error ? err.message : 'Import failed.'}`);
        } finally {
          setStarterImportProgress((progress) => progress
            ? { ...progress, completed: progress.completed + 1 }
            : progress);
        }
      }

      await loadData();
      notifyCatalogueUpdated();
      if (failures.length > 0) {
        const details = failures.slice(0, 3).join(' ');
        const remaining = failures.length > 3 ? ` Plus ${failures.length - 3} more.` : '';
        setError(`Added ${createdBooks} books and updated ${updatedCovers} covers; skipped ${skipped}; failed ${failures.length}. ${details}${remaining}`);
      } else {
        const summary = [
          createdBooks > 0 ? `Added ${createdBooks} starter books to the catalogue.` : '',
          updatedCovers > 0 ? `Updated ${updatedCovers} book covers.` : '',
          skipped > 0 ? `${skipped} existing titles already up to date.` : '',
        ].filter(Boolean).join(' ') || 'Starter catalogue is up to date.';
        notify(summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import starter catalogue.');
    } finally {
      setImportingStarterCatalogue(false);
      setStarterImportProgress(null);
    }
  };

  const handleDeleteBook = async (bookId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteBook(bookId);
      notify(`Book "${title}" deleted.`);
      await loadData();
      notifyCatalogueUpdated();
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manage Books
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage catalogue titles, copies, and cover images.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isDemoMode && (
            <button
              onClick={handleImportStarterCatalogue}
              disabled={importingStarterCatalogue}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>
                {importingStarterCatalogue && starterImportProgress
                  ? `Importing ${starterImportProgress.completed}/${starterImportProgress.total}...`
                  : 'Import starter books & covers'}
              </span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
          >
            <span>Add New Book</span>
          </button>
        </div>
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
                    Loading books from the catalogue...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 px-4 text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="font-medium text-slate-700">
                        No books found in the live catalogue yet.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Import the 15 starter academic books &amp; categories in one click, or add a book manually.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        {!isDemoMode && (
                          <button
                            type="button"
                            onClick={handleImportStarterCatalogue}
                            disabled={importingStarterCatalogue}
                            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-60"
                          >
                            <Download className="w-4 h-4" />
                            <span>
                              {importingStarterCatalogue && starterImportProgress
                                ? `Importing ${starterImportProgress.completed}/${starterImportProgress.total}...`
                                : 'Import 15 starter books'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={openAddModal}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                          Add New Book
                        </button>
                      </div>
                    </div>
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
              disabled={savingBook}
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingBook ? 'Edit Book' : 'Add Book'}
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button type="button" onClick={() => setError(null)} className="font-semibold underline shrink-0">
                  Dismiss
                </button>
              </div>
            )}

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
                    value={creatingNewCategory || categories.length === 0 ? '__new__' : String(formCategoryId)}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setCreatingNewCategory(true);
                        setFormCategoryId(0);
                      } else {
                        setCreatingNewCategory(false);
                        setFormNewCategoryName('');
                        setFormCategoryId(Number(e.target.value));
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                    <option value="__new__">+ Create new category...</option>
                  </select>
                  {(creatingNewCategory || categories.length === 0) && (
                    <input
                      type="text"
                      required
                      placeholder="Enter new category name (e.g. Technology)"
                      value={formNewCategoryName}
                      onChange={(e) => setFormNewCategoryName(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
                    />
                  )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cover image
                  </label>
                  {!isDemoMode && (
                    <>
                      <label className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-100">
                        <Upload className="w-4 h-4" />
                        {coverFile ? 'Choose a different image' : 'Choose image to upload'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleCoverFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="mt-1 text-[11px] text-slate-500">
                        JPEG, PNG, or WebP; up to 5 MB. Maximum 50 images per category.
                      </p>
                    </>
                  )}
                  {(coverPreviewUrl || formCoverImage) && (
                    <img
                      src={coverPreviewUrl || formCoverImage}
                      alt="Book cover preview"
                      className="mt-2 h-32 w-24 rounded-md border border-slate-200 object-cover"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cover image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formCoverImage}
                    onChange={(e) => {
                      setFormCoverImage(e.target.value);
                      setCoverFile(null);
                      setCoverPreviewUrl('');
                      setUploadedCover(null);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons matching wireframe */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={savingBook}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBook}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-60"
                >
                  {savingBook
                    ? coverFile && uploadedCover?.file !== coverFile ? 'Uploading cover...' : 'Saving book...'
                    : 'Save Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
