import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstrumentChecklist from '../components/InstrumentChecklist';

const mockProgress = {
  guitars: { completed: false, label: 'Guitarras' },
  bass: { completed: true, label: 'Bajo' },
  drums: { completed: false, label: 'Batería' },
};

describe('InstrumentChecklist', () => {
  it('renders all instruments', () => {
    render(<InstrumentChecklist progress={mockProgress} onToggle={() => {}} onAdd={() => {}} onRemove={() => {}} />);
    expect(screen.getByText('Guitarras')).toBeInTheDocument();
    expect(screen.getByText('Bajo')).toBeInTheDocument();
    expect(screen.getByText('Batería')).toBeInTheDocument();
  });

  it('shows completed items with line-through', () => {
    render(<InstrumentChecklist progress={mockProgress} onToggle={() => {}} onAdd={() => {}} onRemove={() => {}} />);
    const bajo = screen.getByText('Bajo');
    expect(bajo).toHaveClass('text-decoration-line-through');
  });

  it('calls onToggle when label clicked', async () => {
    const onToggle = vi.fn();
    render(<InstrumentChecklist progress={mockProgress} onToggle={onToggle} onAdd={() => {}} onRemove={() => {}} />);

    await userEvent.click(screen.getByText('Guitarras'));
    expect(onToggle).toHaveBeenCalledWith('guitars');
  });

  it('returns null for null progress', () => {
    const { container } = render(<InstrumentChecklist progress={null} onToggle={() => {}} onAdd={() => {}} onRemove={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows add instrument dropdown', () => {
    render(<InstrumentChecklist progress={mockProgress} onToggle={() => {}} onAdd={() => {}} onRemove={() => {}} />);
    expect(screen.getByText('Agregar instrumento')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const onRemove = vi.fn();
    render(<InstrumentChecklist progress={mockProgress} onToggle={() => {}} onAdd={() => {}} onRemove={onRemove} />);

    const removeButtons = screen.getAllByTitle('Quitar instrumento');
    await userEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith('guitars');
  });
});
