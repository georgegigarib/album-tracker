import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '../components/ConfirmModal';

describe('ConfirmModal', () => {
  it('renders title and message when shown', () => {
    render(
      <ConfirmModal
        show={true}
        title="Eliminar"
        message="¿Seguro?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.getByText('¿Seguro?')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    render(
      <ConfirmModal
        show={false}
        title="Eliminar"
        message="¿Seguro?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        show={true}
        title="Eliminar"
        message="¿Seguro?"
        confirmLabel="Sí, eliminar"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    await userEvent.click(screen.getByText('Sí, eliminar'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        show={true}
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
