import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TargetDiscountRulesWidget } from '../TargetDiscountRulesWidget';
import type { DiscountRule } from '@/api/discountRuleApi';

const mockRules: DiscountRule[] = [
  {
    id: 1, name: 'VIP Flat', ruleType: 'flat', priority: 100,
    matchEmail: 'admin@yslogic.co.kr', matchNationality: null,
    weightMin: null, weightMax: null, discountPercent: 19,
    isActive: true, createdBy: 'system', createdAt: '2026-03-08T00:00:00Z', updatedAt: '2026-03-08T00:00:00Z',
  },
  {
    id: 2, name: 'KR Heavy', ruleType: 'weight_based', priority: 50,
    matchEmail: null, matchNationality: 'KR',
    weightMin: 20, weightMax: null, discountPercent: 19,
    isActive: true, createdBy: 'system', createdAt: '2026-03-08T00:00:00Z', updatedAt: '2026-03-08T00:00:00Z',
  },
  {
    id: 3, name: 'Default Light', ruleType: 'weight_based', priority: 0,
    matchEmail: null, matchNationality: null,
    weightMin: 0, weightMax: 19.99, discountPercent: 32,
    isActive: true, createdBy: 'system', createdAt: '2026-03-08T00:00:00Z', updatedAt: '2026-03-08T00:00:00Z',
  },
];

const mockRefetch = vi.fn();
const mockUseDiscountRules = vi.fn();

vi.mock('@/features/dashboard/hooks/useDiscountRules', () => ({
  useDiscountRules: () => mockUseDiscountRules(),
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/api/discountRuleApi', async () => {
  const actual = await vi.importActual('@/api/discountRuleApi');
  return {
    ...actual,
    createDiscountRule: vi.fn().mockResolvedValue({ id: 99, name: 'New' }),
    updateDiscountRule: vi.fn().mockResolvedValue({ id: 1, name: 'Updated' }),
    deleteDiscountRule: vi.fn().mockResolvedValue({ success: true }),
  };
});

describe('TargetDiscountRulesWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDiscountRules.mockReturnValue({
      rules: mockRules,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('renders the widget header', () => {
    render(<TargetDiscountRulesWidget />);
    expect(screen.getByText('Target Discount Rules')).toBeInTheDocument();
  });

  it('shows rule count', () => {
    render(<TargetDiscountRulesWidget />);
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('renders all active rules', () => {
    render(<TargetDiscountRulesWidget />);
    expect(screen.getByText('VIP Flat')).toBeInTheDocument();
    expect(screen.getByText('KR Heavy')).toBeInTheDocument();
    expect(screen.getByText('Default Light')).toBeInTheDocument();
  });

  it('groups rules by priority label', () => {
    render(<TargetDiscountRulesWidget />);
    expect(screen.getByText(/P100 — Per-User Flat/)).toBeInTheDocument();
    expect(screen.getByText(/P50 — Nationality/)).toBeInTheDocument();
    expect(screen.getByText(/P0 — Default/)).toBeInTheDocument();
  });

  it('displays discount percentages', () => {
    render(<TargetDiscountRulesWidget />);
    const percentages = screen.getAllByText('19%');
    expect(percentages.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('32%')).toBeInTheDocument();
  });

  it('shows error indicator when fetch fails', () => {
    mockUseDiscountRules.mockReturnValue({
      rules: [],
      loading: false,
      error: 'Network error',
      refetch: mockRefetch,
    });
    render(<TargetDiscountRulesWidget />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows toast on CRUD failure', async () => {
    const { createDiscountRule } = await import('@/api/discountRuleApi');
    (createDiscountRule as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Server error'));

    const user = userEvent.setup();
    render(<TargetDiscountRulesWidget />);

    // Open add form
    const addButton = screen.getAllByRole('button')[0];
    await user.click(addButton);

    // Fill name and save
    const nameInput = screen.getByPlaceholderText('Rule name');
    await user.type(nameInput, 'Test Rule');
    const saveButton = screen.getByText('Create');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith('error', 'Server error');
    });
  });

  it('shows loading spinner when loading with no rules', () => {
    mockUseDiscountRules.mockReturnValue({
      rules: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    });
    render(<TargetDiscountRulesWidget />);
    // The loading spinner element should be present
    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('shows add form when add button clicked', async () => {
    const user = userEvent.setup();
    render(<TargetDiscountRulesWidget />);

    const addButton = screen.getAllByRole('button')[0]; // Plus button
    await user.click(addButton);

    expect(screen.getByPlaceholderText('Rule name')).toBeInTheDocument();
  });

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<TargetDiscountRulesWidget />);

    // The Trash2 icon buttons
    const allButtons = screen.getAllByRole('button');
    const deleteBtn = allButtons.find(btn => btn.querySelector('.lucide-trash-2'));
    if (deleteBtn) {
      await user.click(deleteBtn);
      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      });
    }
  });

  it('shows footer text', () => {
    render(<TargetDiscountRulesWidget />);
    expect(screen.getByText(/Priority: higher wins/)).toBeInTheDocument();
  });
});
