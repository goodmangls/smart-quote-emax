import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../Header';

const mockSetLanguage = vi.fn();
const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
    logout: mockLogout,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', setLanguage: mockSetLanguage, t: (key: string) => key }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false, toggleDarkMode: vi.fn() }),
}));

vi.mock('@/features/dashboard/components/AccountSettingsModal', () => ({
  AccountSettingsModal: () => null,
}));

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app title', () => {
    renderHeader();
    expect(screen.getAllByText('nav.smartQuote').length).toBeGreaterThanOrEqual(1);
  });

  it('shows current language code', () => {
    renderHeader();
    // In Header.tsx, language is rendered as <span className="text-sm font-medium uppercase font-bold">{language}</span>
    // But the mock has t(key) = key, and language = 'en'
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  it('opens language dropdown on click', () => {
    renderHeader();
    fireEvent.click(screen.getByLabelText('Select language'));
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('한국어')).toBeInTheDocument();
  });

  it('selects a language from dropdown', () => {
    renderHeader();
    fireEvent.click(screen.getByLabelText('Select language'));
    fireEvent.click(screen.getByText('한국어'));
    expect(mockSetLanguage).toHaveBeenCalledWith('ko');
  });

  it('closes language dropdown on outside click', () => {
    renderHeader();
    fireEvent.click(screen.getByLabelText('Select language'));
    expect(screen.getByText('English')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('shows admin link for admin users', () => {
    renderHeader();
    expect(screen.getAllByText('nav.admin').length).toBeGreaterThanOrEqual(1);
  });

  it('shows user email prefix and role', () => {
    renderHeader();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('opens mobile menu on hamburger click', () => {
    renderHeader();
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    // Mobile menu should show nav.smartQuote and nav.admin links
    const quoteLinks = screen.getAllByText('nav.smartQuote');
    expect(quoteLinks.length).toBeGreaterThanOrEqual(2); // desktop + mobile
    expect(screen.getAllByText('nav.admin').length).toBeGreaterThanOrEqual(2);
  });

  it('calls logout on logout button click', () => {
    renderHeader();
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    fireEvent.click(screen.getByText('nav.logout'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
