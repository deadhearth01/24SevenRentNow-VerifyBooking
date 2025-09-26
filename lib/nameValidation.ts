/**
 * Utility functions for validating credit card names against driver's license names
 */

export interface NameValidationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
}

/**
 * Normalizes a name by removing extra spaces, converting to lowercase, and handling common variations
 */
export function normalizeName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[.,\-]/g, ' ') // Replace common punctuation with spaces
    .replace(/\s+/g, ' ') // Clean up spaces again
    .trim();
}

/**
 * Extracts meaningful name parts (first, middle, last names) from a full name
 */
export function extractNameParts(name: string): string[] {
  const normalized = normalizeName(name);
  const parts = normalized.split(' ').filter(part => part.length > 1); // Filter out initials
  return parts;
}

/**
 * Validates if two names likely refer to the same person
 */
export function validateNamesMatch(
  creditCardName: string,
  driversLicenseName: string
): NameValidationResult {
  if (!creditCardName || !driversLicenseName) {
    return {
      isValid: false,
      confidence: 0,
      reason: 'Both names are required for validation'
    };
  }

  const ccParts = extractNameParts(creditCardName);
  const dlParts = extractNameParts(driversLicenseName);

  // Exact match (after normalization)
  if (normalizeName(creditCardName) === normalizeName(driversLicenseName)) {
    return {
      isValid: true,
      confidence: 1.0,
      reason: 'Exact match'
    };
  }

  // Check if all parts of the shorter name are present in the longer name
  const shorterParts = ccParts.length <= dlParts.length ? ccParts : dlParts;
  const longerParts = ccParts.length > dlParts.length ? ccParts : dlParts;

  let matchCount = 0;
  for (const part of shorterParts) {
    if (longerParts.some(longerPart => longerPart.includes(part) || part.includes(longerPart))) {
      matchCount++;
    }
  }

  const matchRatio = matchCount / shorterParts.length;

  // High confidence if most parts match
  if (matchRatio >= 0.8) {
    return {
      isValid: true,
      confidence: matchRatio,
      reason: 'High similarity between names'
    };
  }

  // Medium confidence for partial matches
  if (matchRatio >= 0.5) {
    return {
      isValid: false,
      confidence: matchRatio,
      reason: 'Partial match - manual review may be needed'
    };
  }

  // Low confidence - likely different names
  return {
    isValid: false,
    confidence: matchRatio,
    reason: 'Names do not appear to match'
  };
}

/**
 * Format validation result for user display
 */
export function formatValidationMessage(result: NameValidationResult): string {
  if (result.isValid) {
    return '✅ Names match successfully';
  }
  
  if (result.confidence > 0.5) {
    return '⚠️ Names partially match - please verify they refer to the same person';
  }
  
  return '❌ Names do not match - please ensure the credit card and driver\'s license belong to the same person';
}
