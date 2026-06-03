// Shared session-level cache for Drive audio blobs.
// Keyed by Drive file ID → blob URL string.
// Persists across mounts so re-expanding a player doesn't re-download.
export const driveAudioCache = new Map();
