const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Use 3-20 characters: letters, numbers, or underscore.";
  }

  return null;
}
