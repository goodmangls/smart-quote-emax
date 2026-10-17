import { render, screen } from '@testing-library/react';
import { RateTableViewer } from '../RateTableViewer';

describe('RateTableViewer accessibility', () => {
  it('names the carrier selector', () => {
    render(<RateTableViewer />);
    expect(screen.getByRole('combobox', { name: 'Carrier' })).toBeInTheDocument();
  });

  it('names the product selector', () => {
    render(<RateTableViewer />);
    expect(screen.getByRole('combobox', { name: 'Product' })).toBeInTheDocument();
  });

  it('names the table mode selector', () => {
    render(<RateTableViewer />);
    expect(screen.getByRole('combobox', { name: 'Table mode' })).toBeInTheDocument();
  });

  it('leaves no combobox without an accessible name', () => {
    render(<RateTableViewer />);
    // getAllByRole throws when nothing matches, so this also proves the selectors rendered.
    const selectors = screen.getAllByRole('combobox');
    const unnamed = selectors.filter((el) => !(el.getAttribute('aria-label') || '').trim());
    expect(unnamed).toHaveLength(0);
  });
});
