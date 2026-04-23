import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../setup/test-utils';
import Stories from '../../src/pages/Stories';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock ChildContext — no active child
vi.mock('../../src/contexts/ChildContext', () => ({
    useChild: () => ({
        children: [],
        activeChild: null,
        loading: false,
        setActiveChildId: vi.fn(),
        refreshChildren: vi.fn().mockResolvedValue([]),
    }),
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Stories page', () => {
    it('renders without crashing', () => {
        render(<Stories />);
        expect(document.body).toBeTruthy();
    });

    it('shows the "Bedtime Stories" top bar title', () => {
        render(<Stories />);
        expect(screen.getByText('Bedtime Stories')).toBeInTheDocument();
    });

    it('shows "Please select a child" message when no active child', () => {
        render(<Stories />);
        expect(screen.getByText(/please select a child/i)).toBeInTheDocument();
    });

    // TODO: test theme grid renders when a child is selected
    // TODO: test "Generate" button triggers story generation
    // TODO: test story list renders after stories are fetched
    // TODO: test delete confirmation modal appears when trash icon clicked
});
