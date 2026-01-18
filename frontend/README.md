# Production-Ready Authentication System

A secure, scalable, and modern authentication system built with React 18, Vite, TypeScript, and industry best practices.

## Features

- 🔐 **JWT Authentication** - Access tokens with automatic refresh
- 🔒 **Secure Token Storage** - Refresh tokens in HttpOnly cookies
- 🛡️ **Protected Routes** - Route-level authentication guards
- 📧 **Email Verification** - 4-digit code verification system
- 🔄 **Automatic Token Refresh** - Seamless token renewal
- 💾 **Persistent Login** - Maintains session on page refresh
- 🎨 **Modern UI** - TailwindCSS with shadcn/ui components
- 📱 **Type-Safe** - Full TypeScript with strict mode
- ✅ **Form Validation** - React Hook Form + Zod schemas
- 🔔 **Toast Notifications** - Sonner for user feedback

## Tech Stack

### Core
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety with strict mode

### State Management
- **Zustand** - Global auth state
- **TanStack Query** - Server state and caching

### Forms & Validation
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### UI
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Accessible component primitives
- **Sonner** - Toast notifications

### API
- **Fetch API** - Native browser API
- **Custom API Client** - Centralized with interceptors

## Project Structure

```
src/
├── api/              # API endpoint functions
│   └── auth.ts       # Authentication API calls
├── components/       # React components
│   ├── auth/         # Authentication components
│   │   ├── AuthProvider.tsx
│   │   └── ProtectedRoute.tsx
│   └── ui/           # UI components (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── toaster.tsx
├── hooks/            # Custom React hooks
│   └── useAuth.ts    # Main authentication hook
├── lib/              # Utility functions
│   ├── api-client.ts # API client with interceptors
│   ├── schemas.ts    # Zod validation schemas
│   └── utils.ts      # Helper functions
├── pages/            # Page components
│   ├── DashboardPage.tsx
│   ├── EmailVerificationPage.tsx
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── stores/           # Zustand stores
│   └── auth-store.ts # Authentication state store
├── types/            # TypeScript type definitions
│   ├── api.ts
│   └── auth.ts
├── App.tsx           # Main app component
├── main.tsx          # Application entry point
└── index.css         # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set your API base URL:
```
VITE_API_BASE_URL=/api
```

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## API Integration

This frontend expects a backend API with the following endpoints:

### Authentication Endpoints

- `POST /api/auth/login` - User login
  - Request: `{ email: string, password: string }`
  - Response: `{ accessToken: string }`
  - Sets refresh token in HttpOnly cookie

- `POST /api/auth/register` - User registration
  - Request: `{ email: string, password: string }`
  - Response: `{ message: string, email: string }`

- `POST /api/auth/verify-email` - Email verification
  - Request: `{ email: string, code: string }`
  - Response: `{ accessToken: string }`
  - Sets refresh token in HttpOnly cookie

- `POST /api/auth/refresh` - Refresh access token
  - Request: (uses refresh token from cookie)
  - Response: `{ accessToken: string }`

- `GET /api/auth/me` - Get current user
  - Requires: Bearer token in Authorization header
  - Response: `{ id: string, email: string, emailVerified: boolean, createdAt: string }`

- `POST /api/auth/logout` - User logout
  - Invalidates refresh token cookie

## Security Features

### Token Management

- **Access Tokens**: Stored in memory (not localStorage)
- **Refresh Tokens**: Stored in HttpOnly cookies (backend responsibility)
- **Automatic Refresh**: Tokens refresh before expiration
- **Token Expiration**: Checked before each API call

### Security Best Practices

1. **No localStorage for tokens** - Access tokens only in memory
2. **HttpOnly cookies** - Refresh tokens protected from XSS
3. **Automatic token refresh** - Seamless user experience
4. **401/403 handling** - Graceful error handling
5. **CSRF protection** - Should be handled by backend
6. **Input validation** - Zod schemas on all forms

## Key Components

### `useAuth` Hook

Main authentication hook providing:
- User state and authentication status
- Login, register, verify email, logout functions
- Loading states for async operations

```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

### `ProtectedRoute` Component

Wraps routes requiring authentication:

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### API Client

Centralized API client with:
- Automatic token injection
- Token refresh on 401 errors
- Request/response interceptors
- Error handling

## Development

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Backend Requirements

Your backend must:

1. Set refresh tokens in HttpOnly cookies
2. Accept Bearer tokens in Authorization header
3. Return 401 on expired/invalid access tokens
4. Provide refresh endpoint that uses cookie-based refresh token
5. Implement proper CORS for your frontend domain
6. Validate and sanitize all inputs

## Notes

- The refresh token refresh logic prevents multiple simultaneous refresh requests
- All API errors are handled gracefully with user-friendly messages
- Forms include comprehensive validation with helpful error messages
- The app maintains authentication state across page refreshes

## License

MIT

---

Built with ❤️ following enterprise-grade patterns and security best practices.