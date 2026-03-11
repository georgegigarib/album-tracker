import { describe, it, expect } from 'vitest';
import { validateFile, validateEmail, validatePassword, checkStorageLimit } from '../utils/validators';

describe('validateFile', () => {
  it('rejects null file', () => {
    const result = validateFile(null);
    expect(result.valid).toBe(false);
  });

  it('accepts mp3 file under 10MB', () => {
    const file = { type: 'audio/mpeg', size: 5 * 1024 * 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.type).toBe('audio');
  });

  it('accepts png image under 5MB', () => {
    const file = { type: 'image/png', size: 1 * 1024 * 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.type).toBe('image');
  });

  it('rejects audio over 10MB', () => {
    const file = { type: 'audio/mpeg', size: 11 * 1024 * 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 MB');
  });

  it('rejects image over 5MB', () => {
    const file = { type: 'image/png', size: 6 * 1024 * 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 MB');
  });

  it('rejects unsupported file type', () => {
    const file = { type: 'application/pdf', size: 1024 };
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('no permitido');
  });

  it('accepts wav file', () => {
    const file = { type: 'audio/wav', size: 8 * 1024 * 1024 };
    expect(validateFile(file).valid).toBe(true);
  });

  it('accepts webp image', () => {
    const file = { type: 'image/webp', size: 2 * 1024 * 1024 };
    expect(validateFile(file).valid).toBe(true);
  });
});

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('returns null for valid password', () => {
    expect(validatePassword('123456')).toBeNull();
  });

  it('returns error for short password', () => {
    expect(validatePassword('123')).toContain('6 caracteres');
  });
});

describe('checkStorageLimit', () => {
  it('returns true when under limit', () => {
    expect(checkStorageLimit(10 * 1024 * 1024, 5 * 1024 * 1024)).toBe(true);
  });

  it('returns false when over limit', () => {
    expect(checkStorageLimit(45 * 1024 * 1024, 10 * 1024 * 1024)).toBe(false);
  });
});
