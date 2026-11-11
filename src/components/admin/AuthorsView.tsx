import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Author } from '../../types';
import { api } from '../../services/api';

export const AuthorsView: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadAuthors = async () => {
    setLoading(true);
    try {
      const data = await api.getAuthors();
      setAuthors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, []);

  const notify = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addAuthor(name, bio);
      notify(`Author "${name}" added to catalog.`);
      setName('');
      setBio('');
      setIsModalOpen(false);
      loadAuthors();
    } catch (err: any) {
      setError(err.message || 'Failed to add author');
    }
  };

  const handleDelete = async (author: Author) => {
    if (!confirm(`Are you sure you want to delete author "${author.author_name}"?`)) return;
    try {
      await api.deleteAuthor(author.author_id);
      notify(`Author "${author.author_name}" deleted.`);
      loadAuthors();
    } catch (err: any) {
      setError(err.message || 'Cannot delete author linked to existing books');
    }
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Authors Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverable 2 Database Schema Table 4 (<code className="font-mono">authors</code>)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Author</span>
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="min-w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-5 w-16">ID</th>
              <th className="py-3 px-5">Author Name</th>
              <th className="py-3 px-5">Biography</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  Loading authors...
                </td>
              </tr>
            ) : authors.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  No authors found.
                </td>
              </tr>
            ) : (
              authors.map((a) => (
                <tr key={a.author_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-500 font-medium">
                    {a.author_id}
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-900">
                    {a.author_name}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 max-w-md">
                    {a.biography || '—'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleDelete(a)}
                      className="px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Add Book Author
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Author Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbara Liskov"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Biography / Credentials
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief scholarly background or notable publications..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Author
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
