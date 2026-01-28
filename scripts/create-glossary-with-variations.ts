/**
 * Create Translation Glossary with Card Name Variations
 *
 * This script generates CSV files with multiple variations of card names
 * to handle different user input patterns (e.g., "ex" vs "EX" vs " ex")
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All supported languages
const LANGUAGES = ['ja', 'en', 'zh-CN', 'zh-TW', 'ko', 'fr', 'es', 'de'];

// Generate all possible language pairs (bidirectional)
const LANGUAGE_PAIRS: { source: string; target: string }[] = [];
for (const source of LANGUAGES) {
  for (const target of LANGUAGES) {
    if (source !== target) {
      LANGUAGE_PAIRS.push({ source, target });
    }
  }
}

console.log(`\n📊 Total language pairs to generate: ${LANGUAGE_PAIRS.length}`);

/**
 * Generate variations of a card name to handle different user inputs
 * Only generates ONE additional common variation to avoid duplicate ratio issues
 *
 * Examples:
 * - "ピカチュウex" → ["ピカチュウex"] (no variation needed)
 * - "ピカチュウ ex" → ["ピカチュウ ex", "ピカチュウex"] (add without space)
 * - "ピカチュウEX" → ["ピカチュウEX", "ピカチュウex"] (add lowercase)
 */
function generateNameVariations(name: string): string[] {
  const variations = new Set<string>();

  // Add original name
  variations.add(name);

  // Only add the most common variation: lowercase "ex" without space
  // This avoids duplicate ratio issues with Google Cloud Translation API
  if (/ ex$/i.test(name)) {
    // If name has " ex" (with space), also add "ex" (without space)
    const baseName = name.replace(/ ex$/i, '');
    variations.add(baseName + 'ex');
  } else if (/EX$/i.test(name) && !/ex$/.test(name)) {
    // If name ends with "EX" (uppercase), also add "ex" (lowercase)
    const baseName = name.replace(/ex$/i, '');
    variations.add(baseName + 'ex');
  }


  // Remove duplicates and return as array
  return Array.from(variations);
}

/**
 * Fetch ALL cards from Supabase (bypassing default 1000 row limit)
 */
async function fetchAllCards() {
  const allCards: any[] = [];
  let offset = 0;
  const limit = 1000; // Supabase default limit
  
  while (true) {
    const { data: batch, error } = await supabase
      .from('cards')
      .select('id, name, name_multilingual')
      .not('name_multilingual', 'is', null)
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }
    
    if (!batch || batch.length === 0) {
      break;
    }
    
    allCards.push(...batch);
    
    console.log(`   Fetched ${batch.length} cards (offset: ${offset}, total so far: ${allCards.length})`);
    
    // If we got fewer than limit cards, we've reached the end
    if (batch.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  return allCards;
}

/**
 * Generate glossary CSV file for a language pair with variations
 */
async function createGlossaryFile(sourceLang: string, targetLang: string, allCards: any[]) {
  console.log(`\n📝 Creating glossary: ${sourceLang} -> ${targetLang}`);

  if (!allCards || allCards.length === 0) {
    console.log('No cards found with multilingual names');
    return;
  }

  console.log(`   Processing ${allCards.length} cards...`);

  // Create CSV content with variations
  const csvLines: string[] = [];
  const seenPairs = new Set<string>(); // Prevent duplicates
  let validCount = 0;

  allCards.forEach((card: any) => {
    const sourceName = card.name_multilingual?.[sourceLang] || card.name;
    const targetName = card.name_multilingual?.[targetLang];

    // Only add to glossary if both source and target names exist
    if (sourceName && targetName && sourceName !== targetName) {
      // Generate variations for source only
      // Target should remain as-is to avoid duplicates
      const sourceVariations = generateNameVariations(sourceName);

      // Add all source variations pointing to the original target
      for (const sourceVar of sourceVariations) {
        const pairKey = `${sourceVar}|${targetName}`;

        if (!seenPairs.has(pairKey)) {
          const escapedSource = escapeCsv(sourceVar);
          const escapedTarget = escapeCsv(targetName);
          csvLines.push(`${escapedSource},${escapedTarget}`);
          seenPairs.add(pairKey);
          validCount++;
        }
      }
    }
  });

  if (csvLines.length === 0) {
    console.log(`⚠️  No valid entries for ${sourceLang} -> ${targetLang}`);
    return;
  }

  // Write CSV file
  const outputDir = path.join(process.cwd(), 'glossaries');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `glossary-${sourceLang}-${targetLang}.csv`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, csvLines.join('\n'), 'utf-8');

  console.log(`✅ Created: ${filename}`);
  console.log(`   Entries: ${validCount} (including variations)`);
  console.log(`   Path: ${filepath}`);
}

/**
 * Escape CSV special characters
 */
function escapeCsv(text: string): string {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎴 Pokemon Card Name Glossary Generator (With Variations)\n');
  console.log('=' .repeat(60));

  // Test variations first
  console.log('\n🧪 Testing name variations:');
  const testNames = ['ピカチュウex', 'Pikachu ex', 'ピカチュウEX'];
  for (const name of testNames) {
    const variations = generateNameVariations(name);
    console.log(`  "${name}" → ${variations.length} variations`);
    console.log(`    ${variations.join(', ')}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📥 Fetching ALL cards from database...\n');

  // Fetch all cards once at the beginning
  const allCards = await fetchAllCards();
  
  console.log(`\n✅ Total cards fetched: ${allCards.length}`);
  console.log('=' .repeat(60));

  for (const pair of LANGUAGE_PAIRS) {
    await createGlossaryFile(pair.source, pair.target, allCards);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Glossary generation complete!');
  console.log('\n📂 All glossary files are in: ./glossaries/');
  console.log('\n📊 Variation patterns included:');
  console.log('   - " ex" (with space) → also adds "ex" (without space)');
  console.log('   - "EX" (uppercase) → also adds "ex" (lowercase)');
  console.log('\n📖 Next steps:');
  console.log('   1. Upload CSV files to Google Cloud Storage');
  console.log('   2. Create glossaries using create-google-glossaries.ts');
  console.log('   3. Use glossaries in translation requests');
}

main().catch(console.error);
