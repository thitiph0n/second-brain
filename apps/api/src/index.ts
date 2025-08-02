import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/cloudflare-workers';
import authRoutes from './routes/auth';
import couponRoutes from './routes/coupon';

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const env = c.env.FRONTEND_URL;
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8787',
        env,
      ];
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// API Routes (before static assets)
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

app.get('/api/v1/test', (c) => {
  return c.json({ message: 'Second Brain API is working!' });
});

// Authentication routes
app.route('/api/v1/auth', authRoutes);

// Coupon routes
app.route('/api/v1/coupons', couponRoutes);

// Add more API routes here
// app.route('/api/v1/notes', notesRouter);
// app.route('/api/v1/todos', todosRouter);
// ... other API routes

// 404 handler for API routes
app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'API endpoint not found' }, 404);
  }
  // For non-API routes, serve index.html (SPA fallback)
  return c.env.ASSETS.fetch(new Request('http://localhost/index.html'));
});

export default app;
