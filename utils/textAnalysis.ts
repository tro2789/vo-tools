import { toWords } from 'number-to-words';
import { detectPauses, PauseAnalysis } from './pauseDetection';
import { ExpansionOptions, DEFAULT_EXPANSION_OPTIONS } from './expansionOptions';

/**
 * Normalizes text by expanding various elements into their spoken word equivalents
 * and removing punctuation for accurate counting.
 */
export const calculateSpokenWordCount = (text: string, options: ExpansionOptions = DEFAULT_EXPANSION_OPTIONS): number => {
  if (!text) return 0;

  let processedText = text;

  // 1. Expand URLs if enabled
  if (options.expandURLs) {
    processedText = processedText.replace(/https?:\/\/(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/g, (match) => {
      // Remove protocol
      let url = match.replace(/https?:\/\/(www\.)?/, '');
      // Replace dots with "dot" and slashes with "slash"
      url = url.replace(/\./g, ' dot ').replace(/\//g, ' slash ');
      return url;
    });
  } else {
    // Remove URLs completely if not expanding
    processedText = processedText.replace(/https?:\/\/(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/g, '');
  }

  // 2. Expand dates if enabled (MM/DD/YY, MM/DD/YYYY, DD-MM-YYYY, etc.)
  if (options.expandDates) {
    processedText = processedText.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, (match, p1, p2, p3) => {
      try {
        const month = parseInt(p1, 10);
        const day = parseInt(p2, 10);
        let year = parseInt(p3, 10);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
        
        const monthName = months[month] || toWords(month);
        const dayWord = toWords(day);
        const yearWord = toWords(year);
        
        return `${monthName} ${dayWord} ${yearWord}`;
      } catch (e) {
        return match;
      }
    });
  }

  // 3. Expand measurements if enabled
  if (options.expandMeasurements) {
    // Height (e.g., 5'10")
    processedText = processedText.replace(/(\d+)'(\d+)"/g, (match, feet, inches) => {
      return `${toWords(parseInt(feet))} feet ${toWords(parseInt(inches))} inches`;
    });
    
    // Weight/mass (kg, lbs, g)
    processedText = processedText.replace(/(\d+(?:\.\d+)?)\s*(kg|g|lbs?|pounds?)/gi, (match, num, unit) => {
      const number = toWords(parseFloat(num));
      const unitMap: Record<string, string> = {
        'kg': 'kilograms',
        'g': 'grams',
        'lb': 'pounds',
        'lbs': 'pounds',
        'pound': 'pounds',
        'pounds': 'pounds'
      };
      return `${number} ${unitMap[unit.toLowerCase()] || unit}`;
    });
    
    // Speed (mph, km/h)
    processedText = processedText.replace(/(\d+(?:\.\d+)?)\s*(mph|kmh|km\/h)/gi, (match, num, unit) => {
      const number = toWords(parseFloat(num));
      const unitMap: Record<string, string> = {
        'mph': 'miles per hour',
        'kmh': 'kilometers per hour',
        'km/h': 'kilometers per hour'
      };
      return `${number} ${unitMap[unit.toLowerCase()] || unit}`;
    });
    
    // Distance (ft, m, km, mi)
    processedText = processedText.replace(/(\d+(?:\.\d+)?)\s*(ft|feet|m|meters?|km|kilometers?|mi|miles?)/gi, (match, num, unit) => {
      const number = toWords(parseFloat(num));
      return `${number} ${unit}`;
    });
  }

  // 4. Expand percentages if enabled
  if (options.expandPercentages) {
    processedText = processedText.replace(/(\d+(?:\.\d+)?)%/g, (match, num) => {
      return `${toWords(parseFloat(num))} percent`;
    });
  }

  // 5. Expand currencies if enabled
  if (options.expandCurrencies) {
    // Dollar amounts
    processedText = processedText.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, (match, num) => {
      const cleanNum = parseFloat(num.replace(/,/g, ''));
      return `${toWords(cleanNum)} dollars`;
    });
    
    // Euro amounts
    processedText = processedText.replace(/€(\d+(?:,\d{3})*(?:\.\d+)?)/g, (match, num) => {
      const cleanNum = parseFloat(num.replace(/,/g, ''));
      return `${toWords(cleanNum)} euros`;
    });
    
    // Pound amounts
    processedText = processedText.replace(/£(\d+(?:,\d{3})*(?:\.\d+)?)/g, (match, num) => {
      const cleanNum = parseFloat(num.replace(/,/g, ''));
      return `${toWords(cleanNum)} pounds`;
    });
  }

  // 6. Expand numbers if enabled (integers, decimals, numbers with commas)
  if (options.expandNumbers) {
    processedText = processedText.replace(/(\d+(?:,\d{3})*(?:\.\d+)?)/g, (match) => {
      try {
        // Remove commas for parsing (e.g., "10,000" -> "10000")
        const cleanNumber = parseFloat(match.replace(/,/g, ''));
        
        // Handle decimals
        if (match.includes('.')) {
          const parts = match.split('.');
          const whole = parseInt(parts[0].replace(/,/g, ''), 10);
          const decimal = parts[1];
          return `${toWords(whole)} point ${toWords(parseInt(decimal, 10))}`;
        }

        return toWords(cleanNumber);
      } catch (e) {
        // Fallback if parsing fails, return original
        return match;
      }
    });
  }

  // 8. Remove punctuation and special chars (keep alphanumeric and spaces)
  const cleanText = processedText.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');

  // 9. Split by space and count
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

/**
 * Analyzes text and returns pause information
 */
export const analyzePauses = (text: string): PauseAnalysis => {
  return detectPauses(text);
};

/**
 * Calculates total reading time including pauses
 */
export const calculateTotalTimeWithPauses = (
  wordCount: number,
  wpm: number,
  pauseTime: number
): number => {
  // Calculate base reading time in minutes
  const baseReadingMinutes = wordCount / (wpm || 1);
  
  // Convert pause time from seconds to minutes and add to base time
  const totalMinutes = baseReadingMinutes + (pauseTime / 60);
  
  return totalMinutes;
};