import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { CustomerManagement } from '../CustomerManagement';
import { ToastProvider } from '@/components/ui/Toast';

const renderWithToast = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

const mockCustomers = [
  { id: 1, companyName: 'Acme Corp', contactName: 'John', email: 'john@acme.com', phone: '', country: 'US', address: '', notes: '', quoteCount: 3 },
  { id: 2, companyName: 'Beta Inc', contactName: '', email: '', phone: '', country: 'KR', address: '', notes: '', quoteCount: 0 },
];

const mockListCustomers = vi.fn().mockResolvedValue(mockCustomers);
const mockCreateCustomer = vi.fn().mockResolvedValue(mockCustomers[0]);
const mockUpdateCustomer = vi.fn().mockResolvedValue(mockCustomers[0]);
const mockDeleteCustomer = vi.fn().mockResolvedValue(undefined);

vi.mock('@/api/customerApi', () => ({
  listCustomers: (...args: unknown[]) => mockListCustomers(...args),
  createCustomer: (...args: unknown[]) => mockCreateCustomer(...args),
  updateCustomer: (...args: unknown[]) => mockUpdateCustomer(...args),
  deleteCustomer: (...args: unknown[]) => mockDeleteCustomer(...args),
}));

vi.mock('@/config/options', () => ({
  COUNTRY_OPTIONS: [
    { code: 'KR', name: 'South Korea' },
    { code: 'US', name: 'United States' },
  ],
}));

describe('CustomerManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListCustomers.mockResolvedValue(mockCustomers);
  });

  it('renders customer list', async () => {
    await act(async () => { renderWithToast(<CustomerManagement />); });
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    });
  });

  it('shows quote count badge', async () => {
    await act(async () => { renderWithToast(<CustomerManagement />); });
    await waitFor(() => {
      expect(screen.getByText('(3 quotes)')).toBeInTheDocument();
    });
  });

  it('displays error when fetch fails', async () => {
    mockListCustomers.mockRejectedValueOnce(new Error('Network error'));
    await act(async () => { renderWithToast(<CustomerManagement />); });
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays error when delete fails', async () => {
    await act(async () => { renderWithToast(<CustomerManagement />); });
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    mockDeleteCustomer.mockRejectedValueOnce(new Error('Delete failed'));

    // Click delete to open confirm dialog
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Delete Acme Corp'));
    });

    // Click the confirm button in the dialog
    await act(async () => {
      fireEvent.click(screen.getByText('Delete'));
    });

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
    });
  });

  it('has aria-labels on edit and delete buttons', async () => {
    await act(async () => { renderWithToast(<CustomerManagement />); });
    await waitFor(() => {
      expect(screen.getByLabelText('Edit Acme Corp')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Acme Corp')).toBeInTheDocument();
    });
  });

  it('opens form when Add is clicked', async () => {
    await act(async () => { renderWithToast(<CustomerManagement />); });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('New Customer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Company Name *')).toBeInTheDocument();
  });

  it('opens edit form with pre-filled data', async () => {
    await act(async () => { renderWithToast(<CustomerManagement />); });
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Edit Acme Corp'));
    expect(screen.getByText('Edit Customer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });
});
