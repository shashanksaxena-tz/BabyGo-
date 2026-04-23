import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../setup/test-utils';
import HomeDashboard from '../../components/HomeDashboard';
import { ChildProfile } from '../../types';

// HomeDashboard uses recharts ResponsiveContainer which requires a real DOM size.
// Provide a minimal mock so it renders without ResizeObserver errors.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 300, height: 300 }}>{children}</div>
    ),
  };
});

const mockChild: ChildProfile = {
  id: 'child-test-123',
  name: 'Baby Leo',
  dateOfBirth: '2023-06-15',
  ageMonths: 18,
  gender: 'male',
  weight: 11.5,
  height: 82,
  headCircumference: 48,
  region: {
    code: 'IN',
    name: 'India',
    whoRegion: 'SEARO',
  },
  interests: [],
  favoriteCharacters: [],
  favoriteToys: [],
  favoriteColors: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProps = {
  child: mockChild,
  onNavigate: vi.fn(),
  onStartAnalysis: vi.fn(),
  onSwitchChild: vi.fn(),
  onAddChild: vi.fn(),
  onLogout: vi.fn(),
};

describe('HomeDashboard', () => {
  it('renders without crashing', () => {
    render(<HomeDashboard {...mockProps} />);
    // The component renders — no exception thrown
  });

  it("displays the child's name", () => {
    render(<HomeDashboard {...mockProps} />);
    expect(screen.getAllByText(/Baby Leo/i).length).toBeGreaterThan(0);
  });

  it('renders quick action buttons', () => {
    render(<HomeDashboard {...mockProps} />);
    // Quick action cards include "Stories" and "Recipes"
    expect(screen.getByText(/Stories/i)).toBeInTheDocument();
    expect(screen.getByText(/Recipes/i)).toBeInTheDocument();
  });
});
