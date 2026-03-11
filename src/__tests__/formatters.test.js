import { describe, it, expect } from 'vitest';
import { formatFileSize, calcCompletionPercent, getStatusLabel, getStatusVariant, getStageLabel, calcOverallProgress } from '../utils/formatters';

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('calcCompletionPercent', () => {
  it('returns 0 for null progress', () => {
    expect(calcCompletionPercent(null)).toBe(0);
  });

  it('returns 0 for empty progress', () => {
    expect(calcCompletionPercent({})).toBe(0);
  });

  it('calculates 50% correctly', () => {
    const progress = {
      guitars: { completed: true },
      bass: { completed: false },
    };
    expect(calcCompletionPercent(progress)).toBe(50);
  });

  it('calculates 100% correctly', () => {
    const progress = {
      guitars: { completed: true },
      bass: { completed: true },
    };
    expect(calcCompletionPercent(progress)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    const progress = {
      a: { completed: true },
      b: { completed: false },
      c: { completed: false },
    };
    expect(calcCompletionPercent(progress)).toBe(33);
  });
});

describe('getStatusLabel', () => {
  it('returns correct labels', () => {
    expect(getStatusLabel('not_started')).toBe('Sin iniciar');
    expect(getStatusLabel('in_progress')).toBe('En progreso');
    expect(getStatusLabel('mixing')).toBe('En mezcla');
    expect(getStatusLabel('done')).toBe('Terminada');
  });

  it('returns raw value for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });
});

describe('getStatusVariant', () => {
  it('returns correct Bootstrap variants', () => {
    expect(getStatusVariant('not_started')).toBe('secondary');
    expect(getStatusVariant('in_progress')).toBe('primary');
    expect(getStatusVariant('mixing')).toBe('warning');
    expect(getStatusVariant('done')).toBe('success');
  });
});

describe('getStageLabel', () => {
  it('returns correct stage labels', () => {
    expect(getStageLabel('recording')).toBe('Grabación');
    expect(getStageLabel('editing')).toBe('Edición');
    expect(getStageLabel('mixing_stage')).toBe('Mezcla');
    expect(getStageLabel('mastering')).toBe('Masterización');
  });

  it('returns raw key for unknown stage', () => {
    expect(getStageLabel('unknown')).toBe('unknown');
  });
});

describe('calcOverallProgress', () => {
  it('returns 0 when both are null', () => {
    expect(calcOverallProgress(null, null)).toBe(0);
  });

  it('combines stages and per-stage instruments', () => {
    const stages = {
      recording: { completed: true },
      editing: { completed: false },
    };
    const stageProgress = {
      recording: {
        guitars: { completed: true },
        bass: { completed: false },
      },
      editing: {
        guitars: { completed: false },
        bass: { completed: false },
      },
    };
    // 2 stages + 4 instruments = 6 items, 2 completed = 33%
    expect(calcOverallProgress(stages, stageProgress)).toBe(33);
  });

  it('returns 100% when all completed', () => {
    const stages = {
      recording: { completed: true },
    };
    const stageProgress = {
      recording: {
        guitars: { completed: true },
      },
    };
    expect(calcOverallProgress(stages, stageProgress)).toBe(100);
  });

  it('works with only stages', () => {
    const stages = {
      recording: { completed: true },
      editing: { completed: false },
      mixing_stage: { completed: false },
      mastering: { completed: false },
    };
    expect(calcOverallProgress(stages, null)).toBe(25);
  });

  it('works with multiple stages having different progress', () => {
    const stages = {
      recording: { completed: true },
      editing: { completed: false },
    };
    const stageProgress = {
      recording: {
        guitars: { completed: true },
        bass: { completed: true },
      },
      editing: {
        guitars: { completed: true },
        bass: { completed: false },
      },
    };
    // 2 stages + 4 instruments = 6 items, 4 completed = 67%
    expect(calcOverallProgress(stages, stageProgress)).toBe(67);
  });
});
