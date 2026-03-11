import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AudioPlayer from '../components/AudioPlayer';

describe('AudioPlayer', () => {
  it('renders audio element with source', () => {
    const { container } = render(<AudioPlayer url="https://example.com/audio.mp3" />);
    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio.querySelector('source').src).toBe('https://example.com/audio.mp3');
  });

  it('has controls attribute', () => {
    const { container } = render(<AudioPlayer url="https://example.com/audio.mp3" />);
    const audio = container.querySelector('audio');
    expect(audio).toHaveAttribute('controls');
  });
});
