/**
 * Test Translation with Glossary
 *
 * Tests the translation functionality locally with glossary support
 */

import { TranslationServiceClient } from '@google-cloud/translate';

const translationClient = new TranslationServiceClient();
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'project-poke-trade';
const LOCATION = 'us-central1';

function normalizeLanguageCode(code: string): string {
  const mapping: { [key: string]: string } = {
    'zh-cn': 'zh-CN',
    'zh-tw': 'zh-TW',
  };
  return mapping[code.toLowerCase()] || code;
}

function getGlossaryName(sourceLang: string, targetLang: string): string {
  const glossaryId = `pokemon-cards-${sourceLang}-${targetLang}`;
  return translationClient.glossaryPath(PROJECT_ID, LOCATION, glossaryId);
}

async function translateWithGlossary(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const normalizedSource = normalizeLanguageCode(sourceLang);
  const normalizedTarget = normalizeLanguageCode(targetLang);

  if (normalizedSource === normalizedTarget) {
    return text;
  }

  const request: any = {
    parent: `projects/${PROJECT_ID}/locations/${LOCATION}`,
    contents: [text],
    mimeType: 'text/plain',
    sourceLanguageCode: normalizedSource,
    targetLanguageCode: normalizedTarget,
  };

  try {
    const glossaryName = getGlossaryName(normalizedSource, normalizedTarget);
    request.glossaryConfig = {
      glossary: glossaryName,
    };
    console.log(`      Using glossary: ${glossaryName.split('/').pop()}`);
  } catch (error) {
    console.log(`      ⚠️  Glossary not available, using standard translation`);
  }

  const [response] = await translationClient.translateText(request);

  // IMPORTANT: Prioritize glossaryTranslations over translations
  if (response.glossaryTranslations && response.glossaryTranslations.length > 0) {
    console.log(`      ✅ Using GLOSSARY translation`);
    return response.glossaryTranslations[0].translatedText || text;
  } else if (response.translations && response.translations.length > 0) {
    console.log(`      ⚠️  Using AI translation (glossary not applied)`);
    return response.translations[0].translatedText || text;
  }

  return text;
}

async function testTranslation() {
  console.log('🧪 Testing Translation with Glossary\n');
  console.log('='.repeat(60));

  // Test cases with card names
  const testCases = [
    {
      text: 'ナンジャモのカードが欲しいです',
      source: 'ja',
      target: 'en',
      description: 'Japanese comment with ナンジャモ'
    },
    {
      text: 'ピカチュウexとリザードンexを交換しませんか？',
      source: 'ja',
      target: 'en',
      description: 'Japanese comment with ex cards'
    },
    {
      text: 'I want to trade my Mewtwo ex for your Charizard ex',
      source: 'en',
      target: 'ja',
      description: 'English comment with ex cards'
    },
    {
      text: 'ナンジャモ、ミュウツーex、博士の研究を探しています',
      source: 'ja',
      target: 'en',
      description: 'Japanese comment with multiple cards'
    },
    {
      text: 'ピカチュウとモンスターボールを持っています',
      source: 'ja',
      target: 'en',
      description: 'Japanese comment with Pikachu and Poké Ball'
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. ${testCase.description}`);
    console.log(`   Source (${testCase.source}): ${testCase.text}`);

    try {
      const translated = await translateWithGlossary(
        testCase.text,
        testCase.source,
        testCase.target
      );

      console.log(`   Target (${testCase.target}): ${translated}`);
      console.log('   ✅ Translation successful');
    } catch (error) {
      console.error('   ❌ Translation failed:', error);
    }

    console.log('-'.repeat(60));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Test complete!\n');
  console.log('📝 You can add your own test by passing text as argument:');
  console.log('   npx tsx scripts/test-translation.ts "your text" ja en');
}

// Allow command line arguments for custom testing
async function main() {
  const args = process.argv.slice(2);

  if (args.length >= 3) {
    const [text, source, target] = args;
    console.log('🧪 Custom Translation Test\n');
    console.log('='.repeat(60));
    console.log(`Source (${source}): ${text}`);

    try {
      const translated = await translateWithGlossary(text, source, target);
      console.log(`Target (${target}): ${translated}`);
      console.log('\n✅ Translation successful');
    } catch (error) {
      console.error('\n❌ Translation failed:', error);
    }
  } else {
    await testTranslation();
  }
}

main().catch(console.error);
