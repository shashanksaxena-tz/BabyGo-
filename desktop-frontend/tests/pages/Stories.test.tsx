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

    it('shows some content', () => {
        render(<Stories />);
        // The page renders something — check the document has content
        expect(document.body.innerHTML).not.toBe('');
    });
});
