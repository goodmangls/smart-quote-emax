import { render, screen } from '@testing-library/react';
import { SurchargeForm } from '../surcharge/SurchargeForm';

const noop = () => {};

const renderForm = () =>
  render(
    <SurchargeForm
      form={{}}
      editingId={null}
      saving={false}
      onUpdateForm={noop}
      onSave={noop}
      onCancel={noop}
    />,
  );

describe('SurchargeForm accessibility', () => {
  it.each([
    ['Code *', 'textbox'],
    ['Carrier', 'combobox'],
    ['Name (EN) *', 'textbox'],
    ['Name (KO)', 'textbox'],
    ['Type', 'combobox'],
    ['Amount *', 'spinbutton'],
    ['Zone', 'textbox'],
    ['Country Codes', 'textbox'],
    ['Source URL', 'textbox'],
  ])('associates the visible label "%s" with its control', (label, role) => {
    renderForm();
    expect(screen.getByRole(role, { name: label })).toBeInTheDocument();
  });

  // <input type="date"> has no implicit ARIA role, so query these by their label text.
  it.each(['Effective From', 'Effective To'])(
    'associates the visible label "%s" with its date control',
    (label) => {
      renderForm();
      expect(screen.getByLabelText(label)).toHaveAttribute('type', 'date');
    },
  );

  it('keeps the Active checkbox named by its wrapping label', () => {
    renderForm();
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeInTheDocument();
  });
});
