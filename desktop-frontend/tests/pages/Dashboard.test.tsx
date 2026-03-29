import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../setup/test-utils';
import Dashboard from '../../src/pages/Dashboard';

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
vi.mock('../../src/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
    }),
}));

// Mock ChildContext — default: no active child
const mockUseChild = vi.fn(() => ({
    children: [],
    activeChild: null,
    loading: false,
    setActiveChildId: vi.fn(),
    refreshChildren: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/contexts/ChildContext', () => ({
    useChild: () => mockUseChild(),
}));

describe('Dashboard page — no active child', () => {
    it('renders without crashing', () => {
        render(<Dashboard />);
        expect(document.body).toBeTruthy();
    });

    it('shows "No Child Selected" state when no active child', () => {
        render(<Dashboard />);
        expect(screen.getByText('No Child Selected')).toBeInTheDocument();
    });

    it('shows "Add Child Profile" button when no active child', () => {
        render(<Dashboard />);
        expect(screen.getByRole('button', { name: /add child profile/i })).toBeInTheDocument();
    });
});

describe('Dashboard page — with active child', () => {
    it('renders dashboard content when a child is selected', () => {
        const mockChild = {
            _id: 'child-1',
            name: 'Leo',
            dateOfBirth: '2024-01-01',
            gender: 'male',
            weight: 7,
            height: 65,
            ageInMonths: 6,
        };

        vi.mocked(mockUseChild).mockReturnValueOnce({
            children: [mockChild],
            activeChild: mockChild,
            loading: false,
            setActiveChildId: vi.fn(),
            refreshChildren: vi.fn().mockResolvedValue([]),
        });

        render(<Dashboard />);

        // With an active child, should not show "No Child Selected"
        expect(screen.queryByText('No Child Selected')).not.toBeInTheDocument();
        // Should show child's name in the subtitle (multiple elements may include Leo's name)
        expect(screen.getAllByText(/leo/i).length).toBeGreaterThan(0);
        // Should render domain score cards
        expect(screen.getByText('Motor')).toBeInTheDocument();
        expect(screen.getByText('Cognitive')).toBeInTheDocument();
        expect(screen.getByText('Language')).toBeInTheDocument();
        expect(screen.getByText('Social')).toBeInTheDocument();
    });

    it('shows "Overall Development Score" card when child is selected', () => {
        const mockChild = {
            _id: 'child-1',
            name: 'Leo',
            dateOfBirth: '2024-01-01',
            gender: 'male',
            weight: 7,
            height: 65,
            ageInMonths: 6,
        };

        vi.mocked(mockUseChild).mockReturnValueOnce({
            children: [mockChild],
            activeChild: mockChild,
            loading: false,
            setActiveChildId: vi.fn(),
            refreshChildren: vi.fn().mockResolvedValue([]),
        });

        render(<Dashboard />);
        expect(screen.getByText('Overall Development Score')).toBeInTheDocument();
    });
});
