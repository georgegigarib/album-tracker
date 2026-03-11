import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubtaskList from '../components/SubtaskList';

const mockSubtasks = [
  { id: '1', title: 'Conseguir baterista', completed: false },
  { id: '2', title: 'Afinar guitarra', completed: true },
];

describe('SubtaskList', () => {
  it('renders all subtasks', () => {
    render(<SubtaskList subtasks={mockSubtasks} onAdd={() => {}} onToggle={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Conseguir baterista')).toBeInTheDocument();
    expect(screen.getByText('Afinar guitarra')).toBeInTheDocument();
  });

  it('shows completed subtasks with line-through', () => {
    render(<SubtaskList subtasks={mockSubtasks} onAdd={() => {}} onToggle={() => {}} onDelete={() => {}} />);
    const completed = screen.getByText('Afinar guitarra');
    expect(completed).toHaveClass('text-decoration-line-through');
  });

  it('calls onAdd when form is submitted', async () => {
    const onAdd = vi.fn();
    render(<SubtaskList subtasks={[]} onAdd={onAdd} onToggle={() => {}} onDelete={() => {}} />);
    const input = screen.getByPlaceholderText('Nueva subtarea...');
    await userEvent.type(input, 'Mi nueva subtarea');
    await userEvent.keyboard('{Enter}');
    expect(onAdd).toHaveBeenCalledWith('Mi nueva subtarea');
  });

  it('shows empty message when no subtasks', () => {
    render(<SubtaskList subtasks={[]} onAdd={() => {}} onToggle={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('No hay subtareas.')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn();
    render(<SubtaskList subtasks={mockSubtasks} onAdd={() => {}} onToggle={onToggle} onDelete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith('1', false);
  });
});
