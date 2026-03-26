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

    it('shows a message when no child is selected', () => {
        render(<Milestones />);
        expect(screen.getByText(/please select a child/i)).toBeInTheDocument();
    });

    it('renders the Milestones top bar title', () => {
        render(<Milestones />);
        // TopBar receives title="Milestones"
        expect(screen.getByText('Milestones')).toBeInTheDocument();
    });
});
