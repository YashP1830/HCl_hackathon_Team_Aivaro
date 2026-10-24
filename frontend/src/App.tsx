import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import RecommendationsPage from './pages/RecommendationsPage';
import FAQPage from './pages/FAQPage';
import ResearchPage from './pages/ResearchPage';
import LoansPage from './pages/LoansPage';
import AdminBookForm from './pages/AdminBookForm';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes inside layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/catalog" replace />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="catalog/:bookId" element={<BookDetailPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="research" element={<ResearchPage />} />
            <Route path="loans" element={<LoansPage />} />

            {/* Admin routes */}
            <Route
              path="admin/books/new"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminBookForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/books/:bookId/edit"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminBookForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminAnalyticsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
                  <p className="text-gray-500">Page not found.</p>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
