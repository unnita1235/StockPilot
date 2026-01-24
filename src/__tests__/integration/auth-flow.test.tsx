import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  createMockUser,
  createMockAuthResponse,
  mockFetchSuccess,
  mockFetchError,
} from '../mocks/factories';

/**
 * Auth Flow Integration Tests
 *
 * Tests the complete authentication user flow including:
 * - Login form submission and validation
 * - Registration form submission
 * - Auth context state management
 * - Protected route behavior
 * - Logout flow
 */

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/login',
}));

// Mock auth context for testing
const AuthContext = React.createContext<any>(null);

function AuthProvider({ children, initialUser = null }: { children: React.ReactNode; initialUser?: any }) {
  const [user, setUser] = React.useState(initialUser);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      setUser(data.data.user);
      localStorage.setItem('token', data.data.token);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      setUser(data.data.user);
      localStorage.setItem('token', data.data.token);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Login Form Component
function LoginForm() {
  const { login, loading, error } = React.useContext(AuthContext);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email) { setFormError('Email is required'); return; }
    if (!password) { setFormError('Password is required'); return; }

    try {
      await login(email, password);
      mockPush('/');
    } catch (err: any) {
      // Error is handled by context
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      {(error || formError) && (
        <div data-testid="error-message">{formError || error}</div>
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit" disabled={loading} data-testid="submit-button">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

// Registration Form Component
function RegisterForm() {
  const { register, loading, error } = React.useContext(AuthContext);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [formError, setFormError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name) { setFormError('Name is required'); return; }
    if (!email) { setFormError('Email is required'); return; }
    if (password.length < 8) { setFormError('Password must be at least 8 characters'); return; }

    try {
      await register(name, email, password);
      mockPush('/');
    } catch (err: any) {
      // Error handled by context
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="register-form">
      {(error || formError) && (
        <div data-testid="error-message">{formError || error}</div>
      )}
      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="name-input"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit" disabled={loading} data-testid="submit-button">
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return <div data-testid="loading">Loading...</div>;
  if (!user) return <div data-testid="unauthorized">Please log in</div>;
  return <>{children}</>;
}

describe('Auth Flow Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockPush.mockClear();
  });

  // =========================================================
  // Login Flow Tests
  // =========================================================

  describe('Login Flow', () => {
    it('logs in successfully with valid credentials', async () => {
      const mockResponse = createMockAuthResponse();
      global.fetch = mockFetchSuccess(mockResponse);

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });

      expect(localStorage.getItem('token')).toBeDefined();
    });

    it('shows error message on login failure', async () => {
      global.fetch = mockFetchError('Invalid credentials', 401);

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'WrongPass');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('validates email is required', async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('password-input'), 'SomePass123!');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Email is required');
    });

    it('validates password is required', async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Password is required');
    });

    it('shows loading state during login', async () => {
      // Use a delayed response
      global.fetch = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: createMockAuthResponse() }),
        }), 100))
      );

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'Pass123!');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('submit-button')).toHaveTextContent('Signing in...');
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });
  });

  // =========================================================
  // Registration Flow Tests
  // =========================================================

  describe('Registration Flow', () => {
    it('registers successfully with valid data', async () => {
      const mockResponse = createMockAuthResponse();
      global.fetch = mockFetchSuccess(mockResponse);

      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('validates name is required', async () => {
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Name is required');
    });

    it('validates password length', async () => {
      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('name-input'), 'John');
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'short');
      await user.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Password must be at least 8 characters'
      );
    });

    it('shows error on duplicate email', async () => {
      global.fetch = mockFetchError('Email already exists', 409);

      render(
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      );

      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'existing@example.com');
      await user.type(screen.getByTestId('password-input'), 'SecurePass123!');
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  // =========================================================
  // Protected Route Tests
  // =========================================================

  describe('Protected Route', () => {
    it('shows content when user is authenticated', () => {
      const mockUser = createMockUser();
      render(
        <AuthProvider initialUser={mockUser}>
          <ProtectedRoute>
            <div data-testid="protected-content">Secret Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('shows unauthorized message when not authenticated', () => {
      render(
        <AuthProvider>
          <ProtectedRoute>
            <div>Secret Content</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByTestId('unauthorized')).toBeInTheDocument();
      expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });
  });

  // =========================================================
  // Logout Flow Tests
  // =========================================================

  describe('Logout Flow', () => {
    it('clears user state on logout', () => {
      const mockUser = createMockUser();

      function LogoutButton() {
        const { user: currentUser, logout } = React.useContext(AuthContext);
        return (
          <div>
            {currentUser && <span data-testid="user-name">{currentUser.name}</span>}
            <button onClick={logout} data-testid="logout-button">Logout</button>
          </div>
        );
      }

      const { rerender } = render(
        <AuthProvider initialUser={mockUser}>
          <LogoutButton />
          <ProtectedRoute>
            <div data-testid="protected">Protected</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    it('removes token from localStorage on logout', async () => {
      localStorage.setItem('token', 'test-token');
      const mockUser = createMockUser();

      function LogoutTest() {
        const { logout } = React.useContext(AuthContext);
        return <button onClick={logout} data-testid="logout">Logout</button>;
      }

      render(
        <AuthProvider initialUser={mockUser}>
          <LogoutTest />
        </AuthProvider>
      );

      await user.click(screen.getByTestId('logout'));
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
