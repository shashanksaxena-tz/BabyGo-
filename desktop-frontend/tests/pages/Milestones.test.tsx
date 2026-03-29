import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../setup/test-utils';
import Milestones from '../../src/pages/Milestones';

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

describe('Milestones page', () => {
    it('renders without crashing', () => {
        render(<Milestones />);
        expect(document.body).toBeTruthy();
    });

    it('shows "Please select a child to view milestones." when no child selected', () => {
        render(<Milestones />);
        expect(screen.getByText('Please select a child to view milestones.')).toBeInTheDocument();
    });

    it('shows a message matching /please select a child/i when no child selected', () => {
        render(<Milestones />);
        expect(screen.getByText(/please select a child/i)).toBeInTheDocument();
    });

    it('renders the Milestones top bar title', () => {
        render(<Milestones />);
        // TopBar receives title="Milestones"
        expect(screen.getByText('Milestones')).toBeInTheDocument();
    });

    // TODO: test domain filter tabs render when a child is selected
    // TODO: test tab switching between "current", "upcoming", and "achieved"
    // TODO: test clicking "Mark Achieved" opens the date picker modal
    // TODO: test milestone card shows correct domain label and color
    // TODO: test watch/unwatch milestone toggle
});
