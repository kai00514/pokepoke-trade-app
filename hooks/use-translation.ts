/**
 * Custom hook for translating text using Google Cloud Translation API
 *
 * This hook provides translation functionality with caching support
 * for use in React components.
 */

import { useState } from 'react';
import { useLocale } from 'next-intl';

interface TranslationResult {
  translatedText: string;
  cached: boolean;
  error?: string;
}

export function useTranslation() {
  const locale = useLocale();
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Translate text from source language to target language
   *
   * @param text - The text to translate
   * @param sourceLang - Source language code (defaults to 'ja')
   * @param targetLang - Target language code (defaults to current locale)
   * @returns Translation result
   */
  const translate = async (
    text: string,
    sourceLang: string = 'ja',
    targetLang: string = locale
  ): Promise<string | null> => {
    console.log('[useTranslation] translate called:', {
      sourceLang,
      targetLang,
      locale,
      textPreview: text.substring(0, 30),
    });

    // Skip translation if source and target are the same
    if (sourceLang === targetLang) {
      console.log('[useTranslation] Skipped: source === target');
      return text;
    }

    setIsTranslating(true);
    setError(null);

    try {
      console.log('[useTranslation] Sending API request:', {
        sourceLang,
        targetLang,
      });

      const response = await fetch('/api/translate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text();
            errorData = { rawError: errorText };
          } catch {
            errorData = { message: 'Unable to parse error response' };
          }
        }
        
        console.warn('[useTranslation] Translation API unavailable, showing original text:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        
        // Return original text on API error (graceful degradation)
        return text;
      }

      const data: TranslationResult = await response.json();
      return data.translatedText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation error';
      setError(errorMessage);
      console.warn('[useTranslation] Translation error, showing original text:', err);
      // Return original text on error (graceful degradation)
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translate,
    isTranslating,
    error,
  };
}
