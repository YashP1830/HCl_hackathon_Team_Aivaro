/**
 * Mock data adapter — uses the exact contract shapes from Section 4.
 * Replace with real API calls once the backend is ready.
 * To enable: set VITE_USE_MOCK=true in .env
 */

import type {
  BookRead,
  PaginatedBooks,
  RecommendationResponse,
  FAQResponse,
  ResearchResponse,
  Loan,
  AnalyticsResponse,
  AuthTokens,
  User,
} from '../types';

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

export const MOCK_USER: User = {
  id: 'u-001',
  name: 'Demo User',
  email: 'demo@library.dev',
  role: 'admin',
  created_at: '2026-01-01T00:00:00Z',
};

const MOCK_BOOKS: BookRead[] = [
  {
    id: 'b-001',
    title: 'Generative AI Fundamentals',
    author: 'Dr. Priya Sharma',
    description: 'A comprehensive introduction to generative AI concepts, covering transformers, diffusion models, and practical applications.',
    genre: 'Artificial Intelligence',
    publisher: 'TechPress India',
    publication_year: 2025,
    stock_quantity: 4,
    availability_status: 'available',
    embedding_status: 'ready',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'b-002',
    title: 'Deep Learning with Python',
    author: 'François Chollet',
    description: 'Practical deep learning using Keras and TensorFlow, suitable for beginners and intermediate practitioners.',
    genre: 'Machine Learning',
    publisher: 'Manning Publications',
    publication_year: 2021,
    stock_quantity: 0,
    availability_status: 'out_of_stock',
    embedding_status: 'ready',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'b-003',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    description: 'The big ideas behind reliable, scalable, and maintainable systems for data engineering.',
    genre: 'Software Engineering',
    publisher: "O'Reilly Media",
    publication_year: 2017,
    stock_quantity: 2,
    availability_status: 'available',
    embedding_status: 'ready',
    created_at: '2026-01-05T10:00:00Z',
    updated_at: '2026-01-05T10:00:00Z',
  },
  {
    id: 'b-004',
    title: 'Introduction to Information Retrieval',
    author: 'Christopher D. Manning',
    description: 'Covers search engines, text classification, and ranking algorithms used in modern IR systems.',
    genre: 'Computer Science',
    publisher: 'Cambridge University Press',
    publication_year: 2008,
    stock_quantity: 1,
    availability_status: 'available',
    embedding_status: 'ready',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'b-005',
    title: 'Hands-On Large Language Models',
    author: 'Jay Alammar',
    description: 'Practical guide to building applications with LLMs including prompt engineering and fine-tuning.',
    genre: 'Artificial Intelligence',
    publisher: "O'Reilly Media",
    publication_year: 2024,
    stock_quantity: 0,
    availability_status: 'out_of_stock',
    embedding_status: 'failed',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
  },
];

export const mockApi = {
  async login(): Promise<AuthTokens> {
    await delay();
    return { access_token: 'mock-jwt-token', token_type: 'bearer' };
  },

  async getMe(): Promise<User> {
    await delay(200);
    return MOCK_USER;
  },

  async listBooks(params: { q?: string; page?: number; page_size?: number }): Promise<PaginatedBooks> {
    await delay();
    let filtered = MOCK_BOOKS;
    if (params.q) {
      const q = params.q.toLowerCase();
      filtered = MOCK_BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q),
      );
    }
    const page = params.page ?? 1;
    const pageSize = params.page_size ?? 20;
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      page_size: pageSize,
      pages: Math.ceil(filtered.length / pageSize),
    };
  },

  async getBook(id: string): Promise<BookRead> {
    await delay();
    const book = MOCK_BOOKS.find((b) => b.id === id);
    if (!book) throw new Error('Book not found');
    return book;
  },

  async getRecommendations(query: string): Promise<RecommendationResponse> {
    await delay(1200);
    return {
      query,
      recommendations: [
        {
          book_name: 'Generative AI Fundamentals',
          author: 'Dr. Priya Sharma',
          description: 'A comprehensive introduction to generative AI concepts, covering transformers, diffusion models, and practical applications.',
          library_status: 'in_library_available',
          book_id: 'b-001',
        },
        {
          book_name: 'Hands-On Large Language Models',
          author: 'Jay Alammar',
          description: 'Practical guide to building applications with LLMs including prompt engineering and fine-tuning.',
          library_status: 'in_library_out_of_stock',
          book_id: 'b-005',
        },
        {
          book_name: 'Build a Large Language Model (From Scratch)',
          author: 'Sebastian Raschka',
          description: 'Step-by-step guide to understanding and building LLMs from the ground up.',
          library_status: 'not_in_library',
          book_id: null,
        },
        {
          book_name: 'AI Engineering',
          author: 'Chip Huyen',
          description: 'Covers the engineering practices behind deploying AI systems in production.',
          library_status: 'not_in_library',
          book_id: null,
        },
      ],
    };
  },

  async askFAQ(question: string): Promise<FAQResponse> {
    await delay(800);
    const lower = question.toLowerCase();
    if (lower.includes('borrow') || lower.includes('loan') || lower.includes('keep')) {
      return {
        answer:
          'You can borrow books for up to 14 days. Visit the catalog, find an available book, and use the borrow option. You will receive a reminder email if the book is not returned by the due date.',
        status: 'answered',
        support_contact: null,
        sources: [{ faq_id: 'faq-001', question: 'How do I borrow a book?' }],
      };
    }
    return {
      answer:
        'I could not find a reliable answer in the FAQs. Please contact our support team for further assistance.',
      status: 'fallback',
      support_contact: 'support@library.dev',
      sources: [],
    };
  },

  async searchResearch(topic: string): Promise<ResearchResponse> {
    await delay(1500);
    return {
      topic,
      results: [
        {
          title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
          authors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandra Piktus'],
          year: 2020,
          snippet:
            'We explore a general-purpose fine-tuning recipe for retrieval-augmented generation models which combine pre-trained parametric and non-parametric memory.',
          url: 'https://arxiv.org/abs/2005.11401',
          doi: null,
        },
        {
          title: 'Dense Passage Retrieval for Open-Domain Question Answering',
          authors: ['Vladimir Karpukhin', 'Barlas Oguz'],
          year: 2020,
          snippet:
            'We show that retrieval can be practically implemented using dense representations alone.',
          url: 'https://arxiv.org/abs/2004.04906',
          doi: null,
        },
        {
          title: 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection',
          authors: ['Akari Asai', 'Zeqiu Wu'],
          year: 2023,
          snippet:
            'A new framework that trains a single arbitrary LM that adaptively retrieves passages on demand.',
          url: 'https://arxiv.org/abs/2310.11511',
          doi: null,
        },
      ],
    };
  },

  async getMyLoans(): Promise<Loan[]> {
    await delay();
    const now = new Date();
    const pastDue = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const futureDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return [
      {
        id: 'l-001',
        user_id: 'u-001',
        book_id: 'b-003',
        book_title: 'Designing Data-Intensive Applications',
        borrowed_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        due_at: futureDue,
        returned_at: null,
        reminder_sent_at: null,
      },
      {
        id: 'l-002',
        user_id: 'u-001',
        book_id: 'b-001',
        book_title: 'Generative AI Fundamentals',
        borrowed_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        due_at: pastDue,
        returned_at: null,
        reminder_sent_at: pastDue,
      },
      {
        id: 'l-003',
        user_id: 'u-001',
        book_id: 'b-004',
        book_title: 'Introduction to Information Retrieval',
        borrowed_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        due_at: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString(),
        returned_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        reminder_sent_at: null,
      },
    ];
  },

  async getAnalytics(): Promise<AnalyticsResponse> {
    await delay(1000);
    return {
      period: { from: '2026-09-01', to: '2026-09-30' },
      metrics: {
        total_purchases: 47,
        total_quantity: 62,
        total_revenue: '₹28,450',
        unique_buyers: 31,
        most_purchased_title: 'Generative AI Fundamentals',
        period_change: '+18%',
      },
      narrative:
        'September saw strong growth in book purchases with 47 transactions totalling 62 units — an 18% increase over August. "Generative AI Fundamentals" was the most popular title with 11 purchases. The AI and Machine Learning genre accounted for 58% of total revenue. Weekday purchases outnumbered weekends 3:1, suggesting the library serves mostly working professionals and students.',
      charts: [
        {
          title: 'Purchases by Week',
          chart_type: 'bar',
          x_key: 'week',
          series: [{ data_key: 'purchases', label: 'Purchases' }],
          data: [
            { week: 'Week 1', purchases: 9 },
            { week: 'Week 2', purchases: 14 },
            { week: 'Week 3', purchases: 12 },
            { week: 'Week 4', purchases: 12 },
          ],
        },
        {
          title: 'Revenue by Genre',
          chart_type: 'pie',
          x_key: 'genre',
          series: [{ data_key: 'revenue', label: 'Revenue (₹)' }],
          data: [
            { genre: 'AI', revenue: 16500 },
            { genre: 'Software Eng.', revenue: 6200 },
            { genre: 'Computer Science', revenue: 3500 },
            { genre: 'Other', revenue: 2250 },
          ],
        },
      ],
    };
  },
};
