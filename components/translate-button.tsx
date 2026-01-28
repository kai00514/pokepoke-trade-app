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

  const handleTranslate = async (e?: React.MouseEvent) => {
    // Prevent event propagation to parent elements (e.g., card click to navigate to detail page)
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

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

    // Debug logging
    console.log('[TranslateButton] Translation requested:', {
      sourceLang,
      targetLang: targetLang || '(using locale)',
      locale,
      effectiveTargetLang,
      textPreview: text.substring(0, 50),
    });

    // Translate with explicit target language
    const result = await translate(text, sourceLang, effectiveTargetLang);
    
    console.log('[TranslateButton] Translation result:', {
      originalPreview: text.substring(0, 50),
      translatedPreview: result?.substring(0, 50),
      sourceLang,
      effectiveTargetLang,
      wasTranslated: result !== text,
    });

    if (result && result !== text) {
      setTranslatedText(result);
      setShowTranslation(true);
    } else {
      console.warn('[TranslateButton] Translation returned original text (API may be unavailable)');
    }
  };

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleTranslate}
        disabled={isTranslating}
        className={`
          ${className} 
          ${variant === 'ghost' 
            ? 'border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 hover:text-blue-800' 
            : ''
          }
          transition-all duration-200 shadow-sm hover:shadow-md
        `}
      >
        {isTranslating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            <span className="text-xs font-medium">{t('translating')}</span>
          </>
        ) : showTranslation ? (
          <>
            <X className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs font-medium">{t('hideTranslation')}</span>
          </>
        ) : (
          <>
            <Languages className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs font-medium">{t('translate')}</span>
          </>
        )}
      </Button>

      {showTranslation && translatedText && (
        <div className="pl-4 border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100/50 p-3 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Languages className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-xs text-blue-700 font-bold">
              {t('translatedText')}
            </p>
          </div>
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {translatedText}
          </p>
        </div>
      )}
    </div>
  );
}
