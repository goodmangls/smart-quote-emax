import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuotePagination } from '../QuotePagination';
import { Pagination } from '@/types';

const defaultPagination: Pagination = {
  currentPage: 1,
  totalPages: 5,
  totalCount: 50,
  perPage: 10,
};

describe('QuotePagination', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <QuotePagination
        pagination={{ currentPage: 1, totalPages: 1, totalCount: 5, perPage: 10 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows Page X of Y text', () => {
    render(
      <QuotePagination
        pagination={defaultPagination}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('renders page buttons', () => {
    render(
      <QuotePagination
        pagination={defaultPagination}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('disables previous button on page 1', () => {
    render(
      <QuotePagination
        pagination={defaultPagination}
        onPageChange={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons[0];
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <QuotePagination
        pagination={{ ...defaultPagination, currentPage: 5 }}
        onPageChange={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons[buttons.length - 1];
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange with correct page number', async () => {
    const onPageChange = vi.fn();
    render(
      <QuotePagination
        pagination={defaultPagination}
        onPageChange={onPageChange}
      />,
    );

    await userEvent.click(screen.getByText('3'));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
