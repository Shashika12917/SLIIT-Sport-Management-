/** Shared rules for create-player form (server + markup). */

export const FACULTY_OPTIONS = [
  "Computing",
  "Engineering",
  "Business",
  "Humanities & Sciences",
  "Graduate Studies",
] as const;

export type FacultyOption = (typeof FACULTY_OPTIONS)[number];

const STUDENT_ID = /^IT\d{8}$/;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Contact: digits only, typical phone length range. */
const CONTACT_DIGITS = /^\d{7,15}$/;

export function isValidStudentId(value: string): boolean {
  return STUDENT_ID.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export function isAllowedFaculty(value: string): value is FacultyOption {
  return (FACULTY_OPTIONS as readonly string[]).includes(value);
}

/**
 * Sport is a text name (e.g. Football). Required, non-empty, and must not be
 * digits-only (no numeric codes).
 */
export function isValidSport(value: string): boolean {
  const t = value.trim();
  if (t.length === 0) return false;
  if (/^\d+$/.test(t)) return false;
  return true;
}

export function isValidContactNumber(value: string): boolean {
  return CONTACT_DIGITS.test(value.trim());
}

/** Empty = ok (e.g. clear contact on update); otherwise same rules as required contact. */
export function isValidContactOptional(value: string): boolean {
  const t = value.trim();
  if (t.length === 0) return true;
  return CONTACT_DIGITS.test(t);
}

const FIELD_MAX = 200;

export function isValidShortText(value: string, maxLen = FIELD_MAX): boolean {
  return value.trim().length <= maxLen;
}

/** Empty = ok; otherwise must be a non-negative integer. */
export function isValidJerseyOptional(raw: string): boolean {
  const t = raw.trim();
  if (t.length === 0) return true;
  if (!/^\d+$/.test(t)) return false;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0;
}
