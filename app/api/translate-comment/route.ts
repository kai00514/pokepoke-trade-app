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
          access_count: supabase.sql`access_count + 1`
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
    const translatedText = await translateTextWithGlossary(
      text,
      sourceLang,
      targetLang,
      true // useGlossary
    );

    console.log('[Translation API] Translation result:', {
      original: text.substring(0, 50),
      translated: translatedText.substring(0, 50),
      sourceLang,
      targetLang,
    });

    // Save to cache
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

    return Response.json({
      translatedText,
      cached: false
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return Response.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
