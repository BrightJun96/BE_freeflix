const RECENT_MOVIES = "RECENT_MOVIES";
const TOKEN = (value: string) => `TOKEN_${value}`;
const BLOCKED_TOKEN = (value: string) =>
  `BLOCKED_TOKEN_${value}`;
// 캐싱 키
export const CACHE_KEY = {
  RECENT_MOVIES,
  TOKEN,
  BLOCKED_TOKEN,
};
