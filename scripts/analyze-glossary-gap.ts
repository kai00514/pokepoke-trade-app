import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyze() {
  console.log('🔍 Analyzing Glossary Data Gap\n');

  // Fetch all cards
  const allCards: any[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data: batch } = await supabase
      .from('cards')
      .select('id, name, name_multilingual')
      .not('name_multilingual', 'is', null)
      .range(offset, offset + limit - 1)
      .order('id', { ascending: true });

    if (!batch || batch.length === 0) break;
    allCards.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  // Categorize cards
  let hasJaAndEn = 0;
  let sameJaEn = 0;
  let diffJaEn = 0;
  let missingJa = 0;
  let missingEn = 0;

  const sampleMissingEn: any[] = [];
  const sampleSameNames: any[] = [];

  allCards.forEach(card => {
    const ml = card.name_multilingual || {};
    const jaName = ml.ja || card.name;
    const enName = ml.en;

    if (!ml.ja) missingJa++;
    if (!ml.en) {
      missingEn++;
      if (sampleMissingEn.length < 10) {
        sampleMissingEn.push({ id: card.id, name: card.name, ja: jaName });
      }
    }

    if (jaName && enName) {
      hasJaAndEn++;
      if (jaName === enName) {
        sameJaEn++;
        if (sampleSameNames.length < 10) {
          sampleSameNames.push({ id: card.id, ja: jaName, en: enName });
        }
      } else {
        diffJaEn++;
      }
    }
  });

  console.log('📊 Card Language Coverage:');
  console.log(`   Total cards: ${allCards.length}`);
  console.log(`   Has both ja & en: ${hasJaAndEn}`);
  console.log(`   - Same ja/en name: ${sameJaEn}`);
  console.log(`   - Different ja/en: ${diffJaEn} ⭐ (should be in glossary)`);
  console.log(`   Missing ja: ${missingJa}`);
  console.log(`   Missing en: ${missingEn}`);

  if (sampleMissingEn.length > 0) {
    console.log('\n🔍 Sample cards missing English names:');
    sampleMissingEn.forEach(c => console.log(`   ID ${c.id}: ${c.ja}`));
  }

  if (sampleSameNames.length > 0) {
    console.log('\n🔍 Sample cards with same ja/en names:');
    sampleSameNames.forEach(c => console.log(`   ID ${c.id}: ${c.ja} = ${c.en}`));
  }

  // Read actual glossary
  const glossaryContent = fs.readFileSync('glossaries/glossary-ja-en.csv', 'utf-8');
  const glossaryLines = glossaryContent.trim().split('\n').length;

  console.log('\n📁 Glossary Status:');
  console.log(`   Expected entries (diff ja/en): ${diffJaEn}`);
  console.log(`   Actual glossary lines: ${glossaryLines}`);
  console.log(`   Coverage: ${(glossaryLines / diffJaEn * 100).toFixed(1)}%`);

  // Check why there's a gap
  const glossarySet = new Set(glossaryContent.trim().split('\n'));
  let inGlossary = 0;
  let notInGlossary = 0;
  const sampleNotInGlossary: any[] = [];

  allCards.forEach(card => {
    const jaName = card.name_multilingual?.ja || card.name;
    const enName = card.name_multilingual?.en;

    if (jaName && enName && jaName !== enName) {
      const csvLine = `${jaName},${enName}`;
      if (glossarySet.has(csvLine)) {
        inGlossary++;
      } else {
        notInGlossary++;
        if (sampleNotInGlossary.length < 10) {
          sampleNotInGlossary.push({ id: card.id, ja: jaName, en: enName });
        }
      }
    }
  });

  console.log('\n🔍 Gap Analysis:');
  console.log(`   Cards in glossary: ${inGlossary}`);
  console.log(`   Cards NOT in glossary: ${notInGlossary}`);

  if (sampleNotInGlossary.length > 0) {
    console.log('\n❓ Sample cards NOT in glossary:');
    sampleNotInGlossary.forEach(c => console.log(`   ID ${c.id}: ${c.ja} → ${c.en}`));
  }
}

analyze().catch(console.error);
