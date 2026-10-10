export type AgeCategory = 'under_14' | 'minor' | 'adult' | 'unknown';

function parseDate(birthDate: string): Date | null {
  if (!birthDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  if (date.getTime() > Date.now()) return null;
  return date;
}

export function calculateAge(birthDate: string): number | null {
  const birth = parseDate(birthDate);
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function getAgeCategory(birthDate: string): AgeCategory {
  const age = calculateAge(birthDate);
  if (age === null) return 'unknown';
  if (age < 14) return 'under_14';
  if (age < 18) return 'minor';
  return 'adult';
}

export function canAccessCareer(birthDate: string): boolean {
  const category = getAgeCategory(birthDate);
  return category === 'minor' || category === 'adult';
}
