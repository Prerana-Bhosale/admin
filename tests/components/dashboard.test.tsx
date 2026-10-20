import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage from '@/app/(admin)/page';

const { mockRecentIncidentsQuery, mockRefetch } = vi.hoisted(() => ({
  mockRecentIncidentsQuery: vi.fn(),
  mockRefetch: vi.fn(),
}));

vi.mock('@/hooks', (): Record<string, unknown> => ({
  useStatsQuery: (): Record<string, unknown> => ({
    data: {
      totalUsers: 0,
      totalPosts: 0,
      hiddenPosts: 0,
      pendingUnsafeAreas: 0,
      openIncidents: 0,
      publishedLaws: 0,
      publishedNews: 0,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useRecentUsersQuery: (): Record<string, unknown> => ({
    data: { users: [] },
    isLoading: false,
    isError: false,
  }),
  useRecentIncidentsQuery: mockRecentIncidentsQuery,
}));
vi.mock('@/lib/auth/session', (): Record<string, unknown> => ({
  useAuth: (): { user: { displayName: string }; idToken: string } => ({
    user: { displayName: 'Admin' },
    idToken: 'test-token',
  }),
}));

describe('Dashboard recent incidents query', () => {
  beforeEach((): void => {
    mockRefetch.mockReset();
    mockRecentIncidentsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });
  });

  function renderDashboard(): void {
    render(<DashboardPage />);
  }

  it('shows an error and retry action instead of an empty state when the incidents API fails', async (): Promise<void> => {
    renderDashboard();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load recent incidents.');
    expect(screen.getByRole('button', { name: 'Retry' })).not.toBeNull();
    expect(screen.queryByText('No open incidents.')).toBeNull();
    expect(mockRecentIncidentsQuery).toHaveBeenCalledWith(10);
  });

  it('retries loading recent incidents', async (): Promise<void> => {
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
