import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from '../SignUpPage';

const signup = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ signup }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, language: 'en', setLanguage: vi.fn() }),
}));

vi.mock('@/components/layout/Header', () => ({ Header: () => null }));

function fillAndSubmit(password: string, confirmPassword = password) {
  const set = (id: string, value: string) =>
    fireEvent.change(document.getElementById(id)!, { target: { value } });
  set('name', '  Kim  ');
  set('email', '  a@b.com  ');
  set('password', password);
  set('confirmPassword', confirmPassword);
  fireEvent.click(screen.getByRole('button', { name: 'auth.signup' }));
}

describe('SignUpPage', () => {
  beforeEach(() => {
    signup.mockReset();
    signup.mockResolvedValue({ success: true });
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );
  });

  // Login (AuthContext.login) and password change send the password untouched,
  // and the backend never strips it. If sign-up trimmed, "abc123 " would be
  // stored as "abc123" and the same keystrokes at login would be rejected.
  it('sends the password exactly as typed, surrounding spaces included', async () => {
    fillAndSubmit(' abc123 ');
    await waitFor(() => expect(signup).toHaveBeenCalledTimes(1));
    expect(signup).toHaveBeenCalledWith('a@b.com', ' abc123 ', undefined, 'Kim');
  });

  it('still rejects a password made only of spaces', () => {
    fillAndSubmit('      ');
    expect(screen.getByText('auth.fillAll')).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });

  it('still rejects mismatched confirmation', () => {
    fillAndSubmit('abc123', 'abc123 ');
    expect(screen.getByText('auth.passwordsNotMatch')).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });
});
