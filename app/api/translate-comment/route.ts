/**
 * Comment Translation API Endpoint
 *
 * This endpoint translates user comments using Google Cloud Translation API
 * with glossary support for accurate Pokemon card name translation.
 *
 * Features:
 * - Translation caching for cost optimization
 * - Glossary support for card names
 * - Access tracking for cache management
 */

import { createClient } from '@/lib/supabase/server';
import { translateTextWithGlossary } from '@/lib/google-translate';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    // Debug logging
    console.log('[Translation API] Request:', {
      textPreview: text.substring(0, 50),
      sourceLang,
      targetLang,
    });

    // Validate input
    if (!text || !sourceLang || !targetLang) {
      return Response.json(
        { error: 'Missing required fields: text, sourceLang, targetLang' },
        { status: 400 }
      );
    }

    // Skip translation if source and target are the same
    if (sourceLang === targetLang) {
      console.log('[Translation API] Skipped: source === target');
      return Response.json({
        translatedText: text,
        cached: false,
        skipped: true
      });
    }

    const supabase = await createClient();

    // Check cache first (cost optimization)
    const { data: cached } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('source_text', text)
      .eq('source_language', sourceLang)
      .eq('target_language', targetLang)
      .maybeSingle();

    if (cached) {
      // Cache hit: Update access tracking
      await supabase
        .from('translation_cache')
        .update({
          last_accessed_at: new Date().toISOString(),
        })
        .eq('source_text', text)
        .eq('source_language', sourceLang)
        .eq('target_language', targetLang);

      return Response.json({
        translatedText: cached.translated_text,
        cached: true
      });
    }

    // New translation with glossary support
    let translatedText: string;
    let translationError: string | null = null;
    
    try {
      translatedText = await translateTextWithGlossary(
        text,
        sourceLang,
        targetLang,
        true // useGlossary
      );
    } catch (error) {
      translationError = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[Translation API] Google Translate unavailable, returning original text:', error);
      translatedText = text; // Fallback to original text
    }

    console.log('[Translation API] Translation result:', {
      original: text.substring(0, 50),
      translated: translatedText.substring(0, 50),
      sourceLang,
      targetLang,
      wasTranslated: text !== translatedText,
      error: translationError,
    });

    // Check if translation actually happened
    if (text === translatedText && !translationError) {
      console.warn('[Translation API] Warning: Translation returned same text without error');
    }

    // Save to cache only if translation was successful (no error and text changed)
    if (text !== translatedText && !translationError) {
      await supabase
        .from('translation_cache')
        .insert({
          source_text: text,
          source_language: sourceLang,
          target_language: targetLang,
          translated_text: translatedText,
          service_used: 'google-translate-with-glossary',
          char_count: text.length
        });
    }

    // Return success even if translation failed (graceful degradation)
    return Response.json({
      translatedText,
      cached: false,
      translationAvailable: !translationError,
      debug: {
        wasTranslated: text !== translatedText,
        error: translationError,
      }
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return Response.json(
      { 
        error: 'Translation request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
