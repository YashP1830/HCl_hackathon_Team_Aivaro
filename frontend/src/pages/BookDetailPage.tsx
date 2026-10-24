import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, BookOpen, Calendar, Building2, Tag } from 'lucide-react';
import type { BookRead } from '../types';
import { getBook } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import { AvailabilityBadge, EmbeddingStatusBadge } from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { useAuth } from '../context/AuthContext';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    (USE_MOCK ? mockApi.getBook(bookId) : getBook(bookId))
      .then(setBook)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorAlert message={error || 'Book not found.'} onRetry={() => navigate(0)} />
        <Link to="/catalog" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to catalog
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
          <div className="flex flex-col items-end gap-2">
            <AvailabilityBadge status={book.availability_status} />
            {isAdmin && <EmbeddingStatusBadge status={book.embedding_status} />}
          </div>
        </div>

        <p className="text-gray-600 mb-6">{book.author}</p>

        <p className="text-gray-700 leading-relaxed mb-6">{book.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {book.genre && (
            <div className="flex items-center gap-2 text-gray-500">
              <Tag className="w-4 h-4" />
              <span>{book.genre}</span>
            </div>
          )}
          {book.publisher && (
            <div className="flex items-center gap-2 text-gray-500">
              <Building2 className="w-4 h-4" />
              <span>{book.publisher}</span>
            </div>
          )}
          {book.publication_year && (
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{book.publication_year}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-500">
            <BookOpen className="w-4 h-4" />
            <span>{book.stock_quantity} in stock</span>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              to={`/admin/books/${book.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Book
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
