// In-memory store for rooms (works on single Vercel instance)
// For production, use Redis, Upstash, or a database

const rooms = new Map();

export const roomStore = {
  get: (key) => rooms.get(key),
  set: (key, value) => rooms.set(key, value),
  delete: (key) => rooms.delete(key),
  has: (key) => rooms.has(key),
};