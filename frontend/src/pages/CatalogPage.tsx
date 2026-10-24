import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookRead, PaginatedBooks } from '../types';
import { listBooks } from '../api/endpoints';
import { mockApi } from '../api/mock';
import { getErrorMessage } from '../api/client';
import { AvailabilityBadge, EmbeddingStatusBadge } from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import ErrorAlert from '../components/ui/ErrorAlert';
import { useAuth } from '../context/AuthContext';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const PAGE_SIZE = 12;

export default function CatalogPage() {
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedBooks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = USE_MOCK
        ? await mockApi.listBooks({ q: debouncedQuery || undefined, page, page_size: PAGE_SIZE })
        : await listBooks({ q: debouncedQuery || undefined, page, page_size: PAGE_SIZE });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and search our library collection.</p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/books/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Add Book
          </Link>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or description..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
        />
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchBooks} />}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((book: BookRead) => (
              <Link
                key={book.id}
                to={`/catalog/${book.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <AvailabilityBadge status={book.availability_status} />
                </div>
                <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{book.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  {book.genre && <span>{book.genre}</span>}
                  {book.publication_year && <span>{book.publication_year}</span>}
                  {isAdmin && <EmbeddingStatusBadge status={book.embedding_status} />}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {data.page} of {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No books found"
          message={debouncedQuery ? `No results for "${debouncedQuery}". Try a different search.` : 'The catalog is empty.'}
        />
      )}
    </div>
  );
}
