import { TranslationServiceClient } from '@google-cloud/translate';

const translationClient = new TranslationServiceClient();
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'project-poke-trade';
const LOCATION = 'us-central1';

async function listGlossaries() {
  console.log('📋 Listing Google Cloud Translation glossaries...\n');

  try {
    const parent = translationClient.locationPath(PROJECT_ID, LOCATION);
    const [glossaries] = await translationClient.listGlossaries({ parent });

    if (glossaries.length === 0) {
      console.log('❌ No glossaries found in Google Cloud Translation API');
      console.log('   You need to run: npx tsx scripts/create-google-glossaries.ts');
      return;
    }

    console.log(`✅ Found ${glossaries.length} glossaries:\n`);

    glossaries.forEach((glossary, index) => {
      const name = glossary.name?.split('/').pop() || 'Unknown';
      const source = glossary.languagePair?.sourceLanguageCode || '?';
      const target = glossary.languagePair?.targetLanguageCode || '?';
      const entries = glossary.entryCount || 0;

      console.log(`${index + 1}. ${name}`);
      console.log(`   ${source} → ${target}`);
      console.log(`   Entries: ${entries}`);
      console.log('');
    });

    // Check for ja-en specifically
    const jaEnGlossary = glossaries.find(g =>
      g.languagePair?.sourceLanguageCode === 'ja' &&
      g.languagePair?.targetLanguageCode === 'en'
    );

    if (jaEnGlossary) {
      console.log('✅ ja→en glossary exists');
      console.log(`   Entries: ${jaEnGlossary.entryCount}`);
      console.log(`   Name: ${jaEnGlossary.name}`);
    } else {
      console.log('❌ ja→en glossary NOT FOUND');
    }

  } catch (error) {
    console.error('❌ Error listing glossaries:', error);
  }
}

listGlossaries().catch(console.error);
