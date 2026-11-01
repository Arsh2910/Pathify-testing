export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates password rules:
 * 1. Must be non-empty string.
 * 2. Cannot consist solely of blank spaces.
 * 3. Cannot start or end with whitespace.
 * 4. Must be at least 6 characters of actual content (excluding whitespace).
 * 5. Cannot exceed 128 characters (DoS prevention for bcrypt).
 */
export function validatePassword(password: unknown): PasswordValidationResult {
  if (typeof password !== "string" || !password) {
    return { isValid: false, message: "Password is required." };
  }

  // Reject blank spaces only (e.g. "      ")
  if (password.trim().length === 0) {
    return {
      isValid: false,
      message: "Password cannot consist solely of blank spaces.",
    };
  }

  // Reject leading or trailing spaces
  if (password.startsWith(" ") || password.endsWith(" ")) {
    return {
      isValid: false,
      message: "Password cannot begin or end with spaces.",
    };
  }

  // Minimum length check (excluding any internal whitespace tricks)
  if (password.trim().length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long (excluding spaces).",
    };
  }

  // Maximum length check (prevents bcrypt 72-byte truncation confusion and CPU exhaustion)
  if (password.length > 128) {
    return {
      isValid: false,
      message: "Password cannot exceed 128 characters.",
    };
  }

  return { isValid: true };
}
