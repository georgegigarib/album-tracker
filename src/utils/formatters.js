export function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
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
  const labels = {
    not_started: 'Sin iniciar',
    in_progress: 'En progreso',
    mixing: 'En mezcla',
    done: 'Terminada',
  };
  return labels[status] || status;
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

const STAGE_LABELS = {
  recording: 'Grabación',
  editing: 'Edición',
  mixing_stage: 'Mezcla',
  mastering: 'Masterización',
};

export function getStageLabel(stageKey) {
  return STAGE_LABELS[stageKey] || stageKey;
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
