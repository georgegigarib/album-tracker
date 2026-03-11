import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Timeline from '../components/Timeline';

const mockStages = {
  recording: { completed: true, label: 'Grabación' },
  editing: { completed: false, label: 'Edición' },
  mixing_stage: { completed: false, label: 'Mezcla' },
  mastering: { completed: false, label: 'Masterización' },
};

describe('Timeline', () => {
  it('renders all four stages', () => {
    render(<Timeline stages={mockStages} activeStage="recording" onSelectStage={() => {}} />);
    expect(screen.getByText('Grabación')).toBeInTheDocument();
    expect(screen.getByText('Edición')).toBeInTheDocument();
    expect(screen.getByText('Mezcla')).toBeInTheDocument();
    expect(screen.getByText('Masterización')).toBeInTheDocument();
  });

  it('calls onSelectStage when a stage is clicked', async () => {
    const onSelect = vi.fn();
    render(<Timeline stages={mockStages} activeStage="recording" onSelectStage={onSelect} />);
    await userEvent.click(screen.getByText('Edición'));
    expect(onSelect).toHaveBeenCalledWith('editing');
  });

  it('highlights active stage', () => {
    render(<Timeline stages={mockStages} activeStage="editing" onSelectStage={() => {}} />);
    const editingBtn = screen.getByText('Edición').closest('button');
    expect(editingBtn).toHaveClass('active');
  });

  it('returns null for null stages', () => {
    const { container } = render(<Timeline stages={null} activeStage="recording" onSelectStage={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});
