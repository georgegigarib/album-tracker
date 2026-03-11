import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SongCard from '../components/SongCard';

describe('SongCard progress display', () => {
  const baseSong = {
    id: '1',
    title: 'Test Song',
    status: 'in_progress',
    completionPercent: 67,
    estimatedEndDate: null,
  };

  it('renders song title', () => {
    render(
      <MemoryRouter>
        <SongCard song={baseSong} albumId="album1" />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(
      <MemoryRouter>
        <SongCard song={baseSong} albumId="album1" />
      </MemoryRouter>
    );
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(
      <MemoryRouter>
        <SongCard song={baseSong} albumId="album1" />
      </MemoryRouter>
    );
    expect(screen.getByText('En progreso')).toBeInTheDocument();
  });

  it('shows 0% for songs with no progress', () => {
    render(
      <MemoryRouter>
        <SongCard song={{ ...baseSong, completionPercent: 0 }} albumId="album1" />
      </MemoryRouter>
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
