/**
 * Google Cloud Translation API wrapper
 *
 * This module provides translation functionality using Google Cloud Translation API.
 * It supports text translation with caching and card name replacement for Pokemon card names.
 */

import 'server-only';
import { TranslationServiceClient } from '@google-cloud/translate';

// Initialize the Translation client only if credentials are available
// Note: In production, use service account credentials
let translationClient: TranslationServiceClient | null = null;

// Check if Google Cloud credentials are configured
const isTranslationEnabled = !!(
  process.env.GOOGLE_CLOUD_PROJECT_ID && 
  (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_CREDENTIALS)
);

if (isTranslationEnabled) {
  try {
    translationClient = new TranslationServiceClient();
    console.log('Google Cloud Translation API initialized');
  } catch (error) {
    console.warn('Failed to initialize Google Cloud Translation API:', error);
    translationClient = null;
  }
} else {
  console.warn('Google Cloud Translation API not configured - translation features will be disabled');
}

// Project configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'project-poke-trade';
const LOCATION = 'global';
const GLOSSARY_LOCATION = 'us-central1'; // Glossaries require a specific region

// Supported languages
export const SUPPORTED_LANGUAGES = ['ja', 'en', 'zh-cn', 'zh-tw', 'ko', 'fr', 'es', 'de'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Translate text from one language to another
 *
 * @param text - The text to translate
 * @param sourceLanguage - The source language code (e.g., 'ja', 'en')
 * @param targetLanguage - The target language code (e.g., 'en', 'ja')
 * @returns The translated text
 *
 * @example
 * const translated = await translateText('こんにちは', 'ja', 'en');
 * console.log(translated); // "Hello"
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  try {
    // Return original text if translation is not available
    if (!translationClient) {
      console.warn('Translation client not available, returning original text');
      return text;
    }

    // Skip translation if source and target languages are the same
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    // Construct request
    const request = {
      parent: `projects/${PROJECT_ID}/locations/${LOCATION}`,
      contents: [text],
      mimeType: 'text/plain' as const,
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: targetLanguage,
      // Note: Not specifying model uses the default NMT model
    };

    // Run request
    const [response] = await translationClient.translateText(request);

    if (response.translations && response.translations.length > 0) {
      return response.translations[0].translatedText || text;
    }

    return text;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text on error (fail gracefully)
    return text;
  }
}

/**
 * Translate multiple texts at once (batch translation)
 *
 * @param texts - Array of texts to translate
 * @param sourceLanguage - The source language code
 * @param targetLanguage - The target language code
 * @returns Array of translated texts
 *
 * @example
 * const texts = ['こんにちは', 'ありがとう'];
 * const translated = await translateBatch(texts, 'ja', 'en');
 * console.log(translated); // ["Hello", "Thank you"]
 */
export async function translateBatch(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<string[]> {
  try {
    // Return original texts if translation is not available
    if (!translationClient) {
      console.warn('Translation client not available, returning original texts');
      return texts;
    }

    // Skip translation if source and target languages are the same
    if (sourceLanguage === targetLanguage) {
      return texts;
    }

    // Construct request with NMT Advanced model
    const request = {
      parent: `projects/${PROJECT_ID}/locations/${LOCATION}`,
      contents: texts,
      mimeType: 'text/plain' as const,
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: targetLanguage,
      model: 'nmt', // Use Neural Machine Translation Advanced model for better quality
    };

    // Run request
    const [response] = await translationClient.translateText(request);

    if (response.translations && response.translations.length > 0) {
      return response.translations.map(t => t.translatedText || '');
    }

    return texts;
  } catch (error) {
    console.error('Batch translation error:', error);
    // Return original texts on error (fail gracefully)
    return texts;
  }
}

/**
 * Card name dictionary cache (in-memory cache)
 * Used for replacing card names in translated text
 */
let cardNameDictionary: Map<string, Record<string, string>> | null = null;
let dictionaryLoadedAt: number = 0;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Get card name dictionary from database
 * This function caches the dictionary for 1 hour to reduce database queries
 *
 * @param supabase - Supabase client instance
 * @returns Map of Japanese card names to their translations
 */
async function getCardNameDictionary(supabase: any): Promise<Map<string, Record<string, string>>> {
  const now = Date.now();

  // Return cached dictionary if it's still valid
  if (cardNameDictionary && (now - dictionaryLoadedAt) < CACHE_TTL) {
    return cardNameDictionary;
  }

  try {
    // Fetch all cards from database
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name, name_multilingual');

    const dictionary = new Map<string, Record<string, string>>();

    cards?.forEach((card: any) => {
      // Use Japanese name as key, store all language translations as value
      const jaName = card.name_multilingual?.ja || card.name;
      dictionary.set(jaName, card.name_multilingual || { ja: jaName });
    });

    cardNameDictionary = dictionary;
    dictionaryLoadedAt = now;

    return dictionary;
  } catch (error) {
    console.error('Error loading card name dictionary:', error);
    return new Map();
  }
}

/**
 * Replace card names in translated text with correct card names from dictionary
 *
 * This is useful for comments/posts that mention card names.
 * Machine translation may not translate card names correctly,
 * so we replace them with the official card names from our database.
 *
 * @param text - The translated text
 * @param targetLanguage - The target language code
 * @param supabase - Supabase client instance
 * @returns Text with card names replaced
 *
 * @example
 * // Input: "I want a Lizard ex" (mistranslation)
 * // Output: "I want a Charizard ex" (correct card name)
 */
export async function replaceCardNames(
  text: string,
  targetLanguage: string,
  supabase: any
): Promise<string> {
  try {
    const dictionary = await getCardNameDictionary(supabase);
    let result = text;

    // Replace each card name found in the dictionary
    dictionary.forEach((translations, jaName) => {
      const targetName = translations[targetLanguage] || jaName;

      // Only replace if target name is different from Japanese name
      if (targetName !== jaName) {
        // Use word boundary regex to match whole words only
        const regex = new RegExp(`\\b${escapeRegExp(jaName)}\\b`, 'g');
        result = result.replace(regex, targetName);
      }
    });

    return result;
  } catch (error) {
    console.error('Error replacing card names:', error);
    return text;
  }
}

/**
 * Clear the card name dictionary cache
 * Call this when new cards are added to the database
 */
export function clearCardNameCache(): void {
  cardNameDictionary = null;
  dictionaryLoadedAt = 0;
}

/**
 * Escape special characters for regex
 * @param string - String to escape
 * @returns Escaped string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect the language of a given text
 *
 * @param text - The text to detect language for
 * @returns Detected language code
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    // Return default language if translation is not available
    if (!translationClient) {
      console.warn('Translation client not available, returning default language');
      return 'ja';
    }

    const [response] = await translationClient.detectLanguage({
      parent: `projects/${PROJECT_ID}/locations/${LOCATION}`,
      content: text,
    });

    if (response.languages && response.languages.length > 0) {
      return response.languages[0].languageCode || 'ja';
    }

    return 'ja';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'ja';
  }
}

/**
 * Get glossary name for a language pair
 *
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 * @returns Glossary resource name
 */
function getGlossaryName(sourceLang: string, targetLang: string): string {
  const glossaryId = `pokemon-cards-${sourceLang}-${targetLang}`;
  return translationClient.glossaryPath(PROJECT_ID, GLOSSARY_LOCATION, glossaryId);
}

/**
 * Translate text using a glossary for accurate Pokemon card name translation
 *
 * This function uses Google Cloud Translation API glossaries to ensure
 * Pokemon card names are translated accurately and consistently.
 *
 * @param text - The text to translate
 * @param sourceLanguage - The source language code (e.g., 'ja', 'en')
 * @param targetLanguage - The target language code (e.g., 'en', 'ja')
 * @param useGlossary - Whether to use the glossary (default: true)
 * @returns The translated text with accurate card names
 *
 * @example
 * const translated = await translateTextWithGlossary(
 *   'ピカチュウexが強いです',
 *   'ja',
 *   'en'
 * );
 * console.log(translated); // "Pikachu ex is strong"
 */
export async function translateTextWithGlossary(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  useGlossary: boolean = true
): Promise<string> {
  try {
    // Return original text if translation is not available
    if (!translationClient) {
      console.warn('Translation client not available, returning original text');
      return text;
    }

    // Skip translation if source and target languages are the same
    if (sourceLanguage === targetLanguage) {
      return text;
    }

    // Construct request with glossary
    const request: any = {
      parent: `projects/${PROJECT_ID}/locations/${GLOSSARY_LOCATION}`,
      contents: [text],
      mimeType: 'text/plain' as const,
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: targetLanguage,
      // Note: Not specifying model uses the default NMT model
    };

    // Add glossary if requested and available
    if (useGlossary) {
      try {
        const glossaryName = getGlossaryName(sourceLanguage, targetLanguage);
        request.glossaryConfig = {
          glossary: glossaryName,
        };
        console.log(`Using glossary: ${glossaryName}`);
      } catch (error) {
        console.warn('Glossary not available, using standard translation:', error);
        // Continue without glossary
      }
    }

    // Run request
    const [response] = await translationClient.translateText(request);

    if (response.translations && response.translations.length > 0) {
      return response.translations[0].translatedText || text;
    }

    return text;
  } catch (error) {
    console.error('Translation with glossary error:', error);
    // Fallback to standard translation without glossary
    return translateText(text, sourceLanguage, targetLanguage);
  }
}

/**
 * Translate multiple texts using a glossary
 *
 * @param texts - Array of texts to translate
 * @param sourceLanguage - The source language code
 * @param targetLanguage - The target language code
 * @param useGlossary - Whether to use the glossary (default: true)
 * @returns Array of translated texts
 */
export async function translateBatchWithGlossary(
  texts: string[],
  sourceLanguage: string,
  targetLanguage: string,
  useGlossary: boolean = true
): Promise<string[]> {
  try {
    // Return original texts if translation is not available
    if (!translationClient) {
      console.warn('Translation client not available, returning original texts');
      return texts;
    }

    // Skip translation if source and target languages are the same
    if (sourceLanguage === targetLanguage) {
      return texts;
    }

    // Construct request with NMT Advanced model and glossary
    const request: any = {
      parent: `projects/${PROJECT_ID}/locations/${GLOSSARY_LOCATION}`,
      contents: texts,
      mimeType: 'text/plain' as const,
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: targetLanguage,
      model: 'nmt',
    };

    // Add glossary if requested
    if (useGlossary) {
      try {
        const glossaryName = getGlossaryName(sourceLanguage, targetLanguage);
        request.glossaryConfig = {
          glossary: glossaryName,
        };
      } catch (error) {
        console.warn('Glossary not available, using standard translation');
      }
    }

    // Run request
    const [response] = await translationClient.translateText(request);

    if (response.translations && response.translations.length > 0) {
      return response.translations.map(t => t.translatedText || '');
    }

    return texts;
  } catch (error) {
    console.error('Batch translation with glossary error:', error);
    // Fallback to standard batch translation
    return translateBatch(texts, sourceLanguage, targetLanguage);
  }
}
