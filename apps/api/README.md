# Second Brain API

Backend API for the Second Brain application built with Cloudflare Workers, Hono, and TypeScript.

## Features

- **OAuth 2.1 Authentication** with GitHub
- **JWT Token Management** with refresh tokens
- **Session Management** using Cloudflare KV
- **Rate Limiting** for auth endpoints
- **Database Management** with Cloudflare D1
- **Input Validation** with Zod schemas
- **CORS Configuration** for frontend integration

## Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account with Workers and D1 access
- GitHub OAuth app credentials

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run with development config
wrangler dev --config wrangler.dev.toml
```

### Environment Variables

Copy the example configuration and update with your values:

```bash
# In wrangler.toml or wrangler.dev.toml
[vars]
ENVIRONMENT = "development"
FRONTEND_URL = "http://localhost:3000"
JWT_SECRET = "your-super-secret-jwt-key"
GITHUB_CLIENT_ID = "your-github-client-id"
GITHUB_CLIENT_SECRET = "your-github-client-secret"
```

### Database Setup

Run the migration to set up the database schema:

```bash
# Development database
pnpm migrate:dev

# Production database (requires confirmation)
pnpm migrate:prod
```

## API Endpoints

### Health Check
```
GET /api/health
GET /api/v1/auth/health
```

### Authentication
```
GET /api/v1/auth/github/login       # Start GitHub OAuth flow
GET /api/v1/auth/github/callback    # Handle OAuth callback
POST /api/v1/auth/refresh           # Refresh access token
POST /api/v1/auth/logout            # Logout current session
POST /api/v1/auth/logout-all        # Logout all sessions
```

### User Management
```
GET /api/v1/auth/me                 # Get current user profile
PUT /api/v1/auth/me                 # Update user profile
```


## Authentication Flow

1. **Frontend initiates login**: `GET /api/v1/auth/github/login`
2. **API redirects to GitHub**: User authorizes the application
3. **GitHub redirects back**: `GET /api/v1/auth/github/callback`
4. **API processes callback**: 
   - Validates OAuth state
   - Exchanges code for access token
   - Fetches user profile from GitHub
   - Creates/updates user in database
   - Generates JWT tokens
   - Redirects to frontend with tokens
5. **Frontend receives tokens**: Stores tokens and updates auth state

## Security Features

- **Rate Limiting**: 10 requests per minute for auth endpoints
- **CSRF Protection**: OAuth state validation
- **JWT Security**: 1-hour access tokens, 30-day refresh tokens
- **Session Management**: Secure session storage with KV
- **Input Validation**: Zod schemas for all inputs
- **CORS**: Configured for frontend origins only

## Database Schema

### Users Table
- `id` (TEXT PRIMARY KEY)
- `github_id` (INTEGER UNIQUE)
- `email` (TEXT)
- `name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### OAuth Providers Table
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT FOREIGN KEY)
- `provider` (TEXT)
- `provider_user_id` (TEXT)
- `provider_email` (TEXT)
- `created_at` (DATETIME)

### Auth Sessions Table
- `id` (TEXT PRIMARY KEY)
- `user_id` (TEXT FOREIGN KEY)
- `token_hash` (TEXT)
- `expires_at` (DATETIME)
- `created_at` (DATETIME)
- `last_accessed` (DATETIME)

## Deployment

### Development
```bash
pnpm dev
```

### Production
```bash
pnpm build
pnpm deploy
```

### Environment-specific Deployment
```bash
# Development environment
wrangler publish --config wrangler.dev.toml

# Production environment
wrangler publish --config wrangler.toml
```

## Architecture

- **Hono Framework**: Fast, lightweight web framework
- **Cloudflare Workers**: Serverless runtime at the edge
- **Cloudflare D1**: Serverless SQLite database
- **Cloudflare KV**: Key-value storage for sessions
- **TypeScript**: Full type safety
- **Zod**: Runtime type validation

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Testing

```bash
# Run tests
pnpm test

# Test with curl
curl -X GET http://localhost:8787/api/v1/auth/health
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Use conventional commits

## License

MIT