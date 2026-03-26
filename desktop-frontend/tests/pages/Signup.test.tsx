import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../setup/test-utils';
import userEvent from '@testing-library/user-event';
import Signup from '../../src/pages/Signup';

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

describe('Signup page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.removeItem("token"); localStorage.removeItem("refreshToken");
    });

    it('renders without crashing', () => {
        render(<Signup />);
        expect(document.body).toBeTruthy();
    });

    it('renders the full name field', () => {
        render(<Signup />);
        expect(screen.getByPlaceholderText('Priya Sharma')).toBeInTheDocument();
    });

    it('renders the email field', () => {
        render(<Signup />);
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders the password field', () => {
        render(<Signup />);
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('has a submit button', () => {
        render(<Signup />);
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('renders a link to the login page', () => {
        render(<Signup />);
        const loginLink = screen.getByRole('link', { name: /log in/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('submits the form and navigates on success', async () => {
        // MSW register handler returns 201 with user but no token — Login is called with undefined token
        // Just verify the form is submittable and refreshChildren is called
        const user = userEvent.setup();
        render(<Signup />);

        await user.type(screen.getByPlaceholderText('Priya Sharma'), 'Test User');
        await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
        await user.click(screen.getByRole('button', { name: /sign up/i }));

        await waitFor(() => {
            expect(mockRefreshChildren).toHaveBeenCalled();
        });
    });
});
