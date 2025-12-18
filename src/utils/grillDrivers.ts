import { allF1Drivers } from "@/data/allF1Drivers";

// Extract surname from full name (handles accents and special characters)
const extractSurname = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
};

// Normalize string for comparison (removes accents, lowercase)
const normalize = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();
};

// Extract all unique drivers from entire F1 history and group by first letter of surname
export const getDriversBySurnameLetter = (): { [key: string]: string[] } => {
  const surnameSet = new Set<string>();

  // Collect all unique surnames from ALL F1 drivers ever
  allF1Drivers.forEach(driver => {
    const surname = extractSurname(driver.name);
    surnameSet.add(surname);
  });

  // Group by first letter
  const byLetter: { [key: string]: string[] } = {};

  Array.from(surnameSet).forEach(surname => {
    const firstLetter = surname.charAt(0).toUpperCase();
    if (!byLetter[firstLetter]) {
      byLetter[firstLetter] = [];
    }
    byLetter[firstLetter].push(surname);
  });

  return byLetter;
};

// Get all valid surnames for validation
export const getAllDriverSurnames = (): string[] => {
  const surnames = new Set<string>();

  allF1Drivers.forEach(driver => {
    const surname = extractSurname(driver.name);
    surnames.add(normalize(surname));
  });

  return Array.from(surnames);
};

// Check if a surname is valid (case-insensitive, accent-insensitive)
export const isValidDriverSurname = (input: string, letter: string): boolean => {
  if (!input || input.trim().length === 0) return false;

  const validSurnames = getValidSurnamesForLetter(letter);
  const normalizedInput = normalize(input);

  // Must match exactly (full surname)
  const isValid = validSurnames.some(surname => {
    const normalizedSurname = normalize(surname);
    return normalizedSurname === normalizedInput;
  });

  if (isValid) {
    console.log(`✅ "${input}" is valid for letter ${letter}`);
  } else {
    console.log(`❌ "${input}" is NOT valid for letter ${letter}. Valid options: ${validSurnames.join(', ')}`);
  }

  return isValid;
};

// Get valid surnames for a specific letter
export const getValidSurnamesForLetter = (letter: string): string[] => {
  const byLetter = getDriversBySurnameLetter();
  return byLetter[letter.toUpperCase()] || [];
};
