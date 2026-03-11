import i18n from '../i18n/i18n';

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5 MB
const MAX_SONG_STORAGE = 50 * 1024 * 1024; // 50 MB per song

export function validateFile(file) {
  if (!file) return { valid: false, error: i18n.t('components:validation.noFile') };

  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

  if (!isAudio && !isImage) {
    return { valid: false, error: i18n.t('components:validation.invalidType') };
  }

  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: i18n.t('components:validation.audioTooLarge') };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: i18n.t('components:validation.imageTooLarge') };
  }

  return { valid: true, type: isAudio ? 'audio' : 'image' };
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  if (password.length < 6) return i18n.t('auth:validation.passwordMinLength');
  return null;
}

export function checkStorageLimit(existingFilesSize, newFileSize) {
  return existingFilesSize + newFileSize <= MAX_SONG_STORAGE;
}

export { ALLOWED_AUDIO_TYPES, ALLOWED_IMAGE_TYPES, MAX_AUDIO_SIZE, MAX_IMAGE_SIZE, MAX_SONG_STORAGE };
