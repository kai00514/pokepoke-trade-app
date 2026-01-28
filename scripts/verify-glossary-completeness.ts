import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log('🔍 Verifying Glossary Completeness\n');
  console.log('='.repeat(60));

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

  console.log(`\n📊 Database Statistics:`);
  console.log(`   Total cards: ${allCards.length}`);

  // Count valid ja->en pairs
  let validPairs = 0;
  let withExVariation = 0;
  const missingCards: any[] = [];

  allCards.forEach(card => {
    const jaName = card.name_multilingual?.ja || card.name;
    const enName = card.name_multilingual?.en;

    if (jaName && enName && jaName !== enName) {
      validPairs++;
      if (/ ex$/i.test(jaName) || /EX$/i.test(jaName)) {
        withExVariation++;
      }
    } else if (!enName || !jaName) {
      missingCards.push(card);
    }
  });

  console.log(`   Valid ja→en pairs: ${validPairs}`);
  console.log(`   Cards with "ex" variations: ${withExVariation}`);
  console.log(`   Expected total entries: ${validPairs + withExVariation}`);
  console.log(`   Cards missing ja or en: ${missingCards.length}`);

  // Read generated glossary
  const glossaryPath = 'glossaries/glossary-ja-en.csv';
  const glossaryContent = fs.readFileSync(glossaryPath, 'utf-8');
  const glossaryLines = glossaryContent.trim().split('\n');

  console.log(`\n📁 Glossary File Statistics:`);
  console.log(`   File: ${glossaryPath}`);
  console.log(`   Total lines: ${glossaryLines.length}`);

  // Sample check: verify specific cards
  console.log(`\n✅ Verification Tests:`);

  const testCards = [
    { ja: 'ナンジャモ', en: 'Iono' },
    { ja: 'ピカチュウex', en: 'Pikachu ex' },
    { ja: 'リザードンex', en: 'Charizard ex' },
  ];

  for (const test of testCards) {
    const found = glossaryLines.some(line => {
      const [source, target] = line.split(',');
      return source === test.ja && target === test.en;
    });
    console.log(`   ${test.ja} → ${test.en}: ${found ? '✅ Found' : '❌ Not found'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Verification complete!\n');
}

verify().catch(console.error);
