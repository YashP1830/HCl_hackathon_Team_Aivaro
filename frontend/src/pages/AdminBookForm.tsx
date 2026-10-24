import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { BookCreate, BookUpdate, BookRead } from '../types';
import { createBook, updateBook, getBook } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import { EmbeddingStatusBadge } from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function AdminBookForm() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const isEdit = !!bookId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [embeddingStatus, setEmbeddingStatus] = useState('');

  const [form, setForm] = useState<BookCreate>({
    title: '',
    author: '',
    description: '',
    genre: null,
    publisher: null,
    publication_year: null,
    stock_quantity: 0,
  });

  // Load existing book for edit mode
  useEffect(() => {
    if (!isEdit || !bookId) return;
    (USE_MOCK ? mockApi.getBook(bookId) : getBook(bookId))
      .then((book: BookRead) => {
        setForm({
          title: book.title,
          author: book.author,
          description: book.description,
          genre: book.genre,
          publisher: book.publisher,
          publication_year: book.publication_year,
          stock_quantity: book.stock_quantity,
        });
        setEmbeddingStatus(book.embedding_status);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isEdit, bookId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit && bookId) {
        const updateData: BookUpdate = {};
        // Only include changed fields
        (Object.keys(form) as (keyof BookCreate)[]).forEach((key) => {
          (updateData as Record<string, unknown>)[key] = form[key];
        });
        const result = await updateBook(bookId, updateData);
        setEmbeddingStatus(result.embedding_status);
        setSuccess('Book updated successfully.');
      } else {
        const result = await createBook({
          ...form,
          title: form.title || '',
          author: form.author || 'Author not confirmed',
          description: form.description || '',
        });
        setEmbeddingStatus(result.embedding_status);
        setSuccess('Book created successfully. Embedding status: ' + result.embedding_status);
        // Navigate to the new book
        setTimeout(() => navigate(`/catalog/${result.book.id}`), 1500);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to catalog
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Book' : 'Add New Book'}
          </h1>
          {embeddingStatus && (
            <EmbeddingStatusBadge status={embeddingStatus as 'pending' | 'ready' | 'failed'} />
          )}
        </div>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              required
              minLength={1}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              name="author"
              type="text"
              value={form.author ?? ''}
              onChange={handleChange}
              maxLength={300}
              placeholder="Author not confirmed"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description ?? ''}
              onChange={handleChange}
              rows={4}
              maxLength={20000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <input
                name="genre"
                type="text"
                value={form.genre ?? ''}
                onChange={handleChange}
                maxLength={160}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
              <input
                name="publisher"
                type="text"
                value={form.publisher ?? ''}
                onChange={handleChange}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
              <input
                name="publication_year"
                type="number"
                value={form.publication_year ?? ''}
                onChange={handleChange}
                min={1450}
                max={2200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                name="stock_quantity"
                type="number"
                value={form.stock_quantity ?? 0}
                onChange={handleChange}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? 'Saving...' : isEdit ? 'Update Book' : 'Create Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
