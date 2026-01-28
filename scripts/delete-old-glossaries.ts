import { TranslationServiceClient } from '@google-cloud/translate';

const translationClient = new TranslationServiceClient();
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'project-poke-trade';
const LOCATION = 'us-central1';

async function deleteAllGlossaries() {
  console.log('🗑️  Deleting old glossaries from Google Cloud Translation API\n');
  console.log('='.repeat(60));

  try {
    const parent = translationClient.locationPath(PROJECT_ID, LOCATION);
    const [glossaries] = await translationClient.listGlossaries({ parent });

    if (glossaries.length === 0) {
      console.log('✅ No glossaries to delete');
      return;
    }

    console.log(`\nFound ${glossaries.length} glossaries to delete:\n`);

    for (const glossary of glossaries) {
      const name = glossary.name?.split('/').pop() || 'Unknown';
      const entries = glossary.entryCount || 0;
      
      console.log(`Deleting: ${name} (${entries} entries)`);
      
      try {
        await translationClient.deleteGlossary({ name: glossary.name });
        console.log(`   ✅ Deleted successfully`);
      } catch (error) {
        console.error(`   ❌ Failed to delete:`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Deletion complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllGlossaries().catch(console.error);
