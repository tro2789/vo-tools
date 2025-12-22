import { toWords } from 'number-to-words';

/**
 * Normalizes text by expanding numbers into their spoken word equivalents
 * and removing punctuation for accurate counting.
 */
export const calculateSpokenWordCount = (text: string): number => {
  if (!text) return 0;

  // 1. Replace currency (e.g., $100 -> 100 dollars)
  // We handle the symbol, the number logic comes next
  let processedText = text.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, '$1 dollars');

  // 2. Find numbers (integers, decimals, numbers with commas)
  // Regex explains: look for digits, optionally followed by commas/decimals and more digits
  processedText = processedText.replace(/(\d+(?:,\d{3})*(?:\.\d+)?)/g, (match) => {
    try {
      // Remove commas for parsing (e.g., "10,000" -> "10000")
      const cleanNumber = parseFloat(match.replace(/,/g, ''));
      
      // toWords handles integers well. For decimals, we might need custom logic, 
      // but for estimation, rounding or splitting is usually acceptable. 
      // Here we split decimals to speak them naturally (e.g. "3.5" -> "three point five")
      if (match.includes('.')) {
         const parts = match.split('.');
         const whole = parseInt(parts[0].replace(/,/g, ''), 10);
         const decimal = parts[1]; // speak digits individually usually, but treating as number is close enough for count
         return `${toWords(whole)} point ${toWords(parseInt(decimal, 10))}`;
      }

      return toWords(cleanNumber);
    } catch (e) {
      // Fallback if parsing fails, return original
      return match;
    }
  });

  // 3. Remove punctuation and special chars (keep alphanumeric and spaces)
  const cleanText = processedText.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');

  // 4. Split by space and count
  const words = cleanText.trim().split(' ');
  
  // Handle empty string edge case
  return words[0] === '' ? 0 : words.length;
};

/**
 * Formats minutes into a readable string "X min Y sec"
 */
export const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0) return "0 sec";

  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);

  if (minutes > 0 && seconds > 0) {
    return `${minutes} min ${seconds} sec`;
  }
  
  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${seconds} sec`;
};