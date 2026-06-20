export const reservedUsernames = new Set([
  'api',
  'beranda',
  'community',
  'frame-editor',
  'login',
  'pricing',
  'profil',
  'settings',
  'shoot',
  'templates',
])

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/[-_.]{2,}/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
}

export function getUsernameError(username: string) {
  if (!username) return 'Username wajib diisi.'
  if (username.length < 3) return 'Username minimal 3 karakter.'
  if (username.length > 24) return 'Username maksimal 24 karakter.'
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) return 'Username hanya boleh berisi huruf kecil, angka, titik, underscore, atau strip.'
  if (reservedUsernames.has(username)) return 'Username ini dipakai untuk halaman Fotbarin. Pilih username lain.'
  return ''
}
