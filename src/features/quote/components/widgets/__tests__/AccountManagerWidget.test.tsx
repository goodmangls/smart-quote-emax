import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AccountManagerWidget } from '../AccountManagerWidget';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

describe('AccountManagerWidget', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders first manager by default', () => {
    render(<AccountManagerWidget />);
    expect(screen.getByText('Jaehong Lim')).toBeInTheDocument();
    expect(screen.getByText('widget.manager.role.ops')).toBeInTheDocument();
    expect(screen.getByText('widget.manager.dept.ops')).toBeInTheDocument();
  });

  it('shows contact details with phone, mobile, and email', () => {
    render(<AccountManagerWidget />);
    expect(screen.getByText('+82-2-6961-5763')).toBeInTheDocument();
    expect(screen.getByText('+82-10-2620-7048')).toBeInTheDocument();
    expect(screen.getByText('jhlim725@gmail.com')).toBeInTheDocument();
  });

  it('shows working hours', () => {
    render(<AccountManagerWidget />);
    expect(screen.getByText('09:00 – 18:00 KST')).toBeInTheDocument();
  });

  it('shows online/offline status badge', () => {
    render(<AccountManagerWidget />);
    const statusBadge = screen.getByText(/widget\.manager\.status\.(online|offline)/);
    expect(statusBadge).toBeInTheDocument();
  });

  it('renders chat CTA button', () => {
    render(<AccountManagerWidget />);
    expect(screen.getByText('widget.manager.chat')).toBeInTheDocument();
  });

  it('renders email as mailto link', () => {
    render(<AccountManagerWidget />);
    const emailLink = screen.getByText('jhlim725@gmail.com').closest('a');
    expect(emailLink).toHaveAttribute('href', 'mailto:jhlim725@gmail.com');
  });

  it('renders phone as tel link', () => {
    render(<AccountManagerWidget />);
    const phoneLink = screen.getByText('+82-2-6961-5763').closest('a');
    expect(phoneLink).toHaveAttribute('href', 'tel:+82269615763');
  });

  it('copies contact info to clipboard on copy button click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<AccountManagerWidget />);

    const copyButtons = screen.getAllByLabelText('widget.manager.copy');
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('+82-2-6961-5763');
    });
  });

  it('shows copy button visible on mobile (opacity-100)', () => {
    render(<AccountManagerWidget />);
    const copyButtons = screen.getAllByLabelText('widget.manager.copy');
    expect(copyButtons[0]).toHaveClass('opacity-100');
  });
});
