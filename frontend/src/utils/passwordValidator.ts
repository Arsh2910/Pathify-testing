export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates password on frontend:
 * 1. Cannot be empty.
 * 2. Cannot consist solely of blank spaces (e.g. "      ").
 * 3. Cannot start or end with spaces.
 * 4. Must have at least 6 characters of actual text (excluding spaces).
 * 5. Maximum 128 characters.
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { isValid: false, message: "Password is required." };
  }

  // Reject all-whitespace passwords
  if (password.trim().length === 0) {
    return {
      isValid: false,
      message: "Password cannot consist solely of blank spaces.",
    };
  }

  // Reject passwords starting or ending with spaces
  if (password.startsWith(" ") || password.endsWith(" ")) {
    return {
      isValid: false,
      message: "Password cannot start or end with blank spaces.",
    };
  }

  // Check minimum length of actual characters
  if (password.trim().length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long (excluding spaces).",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: "Password cannot exceed 128 characters.",
    };
  }

  return { isValid: true };
}
