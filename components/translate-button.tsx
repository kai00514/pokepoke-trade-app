/**
 * Translation Button Component
 *
 * A reusable button component that translates text when clicked.
 * Shows translated text below the original and allows toggling back.
 *
 * Usage:
 * <TranslateButton text={comment.text} sourceLang="ja" />
 */

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Languages, Loader2, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useTranslations, useLocale } from 'next-intl';

interface TranslateButtonProps {
  text: string;
  sourceLang?: string;
  targetLang?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function TranslateButton({
  text,
  sourceLang = 'ja',
  targetLang,
  className = '',
  variant = 'ghost',
  size = 'sm',
}: TranslateButtonProps) {
  const t = useTranslations('common.translation');
  const locale = useLocale();
  const { translate, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // Use provided targetLang or fallback to current locale
  const effectiveTargetLang = targetLang || locale;

  // Don't render button if source and target languages are the same
  if (sourceLang === effectiveTargetLang) {
    return null;
  }

  const handleTranslate = async () => {
    if (showTranslation) {
      // Hide translation
      setShowTranslation(false);
      return;
    }

    // Check if already translated
    if (translatedText) {
      setShowTranslation(true);
      return;
    }

    // Translate with explicit target language
    const result = await translate(text, sourceLang, effectiveTargetLang);
    if (result) {
      setTranslatedText(result);
      setShowTranslation(true);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleTranslate}
        disabled={isTranslating}
        className={className}
      >
        {isTranslating ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            <span className="text-xs">{t('translating')}</span>
          </>
        ) : showTranslation ? (
          <>
            <X className="h-3 w-3 mr-1" />
            <span className="text-xs">{t('hideTranslation')}</span>
          </>
        ) : (
          <>
            <Languages className="h-3 w-3 mr-1" />
            <span className="text-xs">{t('translate')}</span>
          </>
        )}
      </Button>

      {showTranslation && translatedText && (
        <div className="pl-3 border-l-2 border-blue-300 bg-blue-50 p-2 rounded-r">
          <p className="text-xs text-blue-600 font-semibold mb-1">
            {t('translatedText')}
          </p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {translatedText}
          </p>
        </div>
      )}
    </div>
  );
}
