import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../setup/test-utils';
import userEvent from '@testing-library/user-event';
import Login from '../../src/pages/Login';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock AuthContext
const mockLogin = vi.fn();
vi.mock('../../src/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        loading: false,
        login: mockLogin,
        logout: vi.fn(),
    }),
}));

// Mock ChildContext
const mockRefreshChildren = vi.fn().mockResolvedValue([]);
vi.mock('../../src/contexts/ChildContext', () => ({
    useChild: () => ({
        children: [],
        activeChild: null,
        loading: false,
        setActiveChildId: vi.fn(),
        refreshChildren: mockRefreshChildren,
    }),
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Login page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.removeItem("token"); localStorage.removeItem("refreshToken");
    });

    it('renders the email field', () => {
        render(<Login />);
        // Label text is "Email Address", input has placeholder "you@example.com"
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders the password field', () => {
        render(<Login />);
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('renders a submit button', () => {
        render(<Login />);
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('renders a link to the signup page', () => {
        render(<Login />);
        const signupLink = screen.getByRole('link', { name: /sign up/i });
        expect(signupLink).toBeInTheDocument();
        expect(signupLink).toHaveAttribute('href', '/signup');
    });

    it('submits the form and calls login with the token from MSW mock', async () => {
        const user = userEvent.setup();
        render(<Login />);

        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            // MSW mock returns token: 'mock-jwt-token'
            expect(mockLogin).toHaveBeenCalledWith(
                'mock-jwt-token',
                expect.objectContaining({ email: 'test@example.com' })
            );
        });
    });

    it('stores the refreshToken in localStorage on successful login', async () => {
        const user = userEvent.setup();
        render(<Login />);

        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        await waitFor(() => {
            expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
        });
    });
});
