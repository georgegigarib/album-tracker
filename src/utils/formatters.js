import i18n from '../i18n/i18n';

export function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function calcCompletionPercent(progress) {
  if (!progress) return 0;
  const items = Object.values(progress);
  if (items.length === 0) return 0;
  const completed = items.filter((item) => item.completed).length;
  return Math.round((completed / items.length) * 100);
}

export function getStatusLabel(status) {
  return i18n.t(`common:status.${status}`, { defaultValue: status });
}

export function getStatusVariant(status) {
  const variants = {
    not_started: 'secondary',
    in_progress: 'primary',
    mixing: 'warning',
    done: 'success',
  };
  return variants[status] || 'secondary';
}

export function getStageLabel(stageKey) {
  return i18n.t(`common:stages.${stageKey}`, { defaultValue: stageKey });
}

export function getGoogleDriveFileId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('drive.google.com')) return null;
    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return fileMatch[1];
    return parsed.searchParams.get('id') || null;
  } catch {
    return null;
  }
}

export function getGoogleDriveEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('drive.google.com')) return null;

    // https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;

    // https://drive.google.com/open?id=FILE_ID
    // https://drive.google.com/uc?id=FILE_ID
    const idParam = parsed.searchParams.get('id');
    if (idParam) return `https://drive.google.com/file/d/${idParam}/preview`;

    return null;
  } catch {
    return null;
  }
}

export function calcOverallProgress(stages, stageProgress) {
  const stageItems = stages ? Object.values(stages) : [];
  const instrumentItems = [];
  if (stageProgress) {
    for (const instruments of Object.values(stageProgress)) {
      instrumentItems.push(...Object.values(instruments));
    }
  }
  const allItems = [...stageItems, ...instrumentItems];
  if (allItems.length === 0) return 0;
  const completed = allItems.filter((item) => item.completed).length;
  return Math.round((completed / allItems.length) * 100);
}
