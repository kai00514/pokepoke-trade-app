/**
 * 多言語カードデータをインポートするスクリプト
 *
 * CSVから6言語（英語、韓国語、中国語繁体字、フランス語、スペイン語、ドイツ語）のデータを読み込み、
 * cards テーブルの name_multilingual と image_url_multilingual を更新する
 *
 * 使用方法:
 * node scripts/import-multilingual-cards.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../docs/多言語対応カードデータ.csv');
const OUTPUT_PATH = path.join(__dirname, 'import-multilingual-cards.sql');

// 言語コードマッピング
const LANGUAGE_MAPPING = {
  '英語': 'en',
  '韓国語': 'ko',
  '中国語': 'zh-TW',
  'フランス語': 'fr',
  'スペイン語': 'es',
  'ドイツ語': 'de'
};

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    // カンマで分割（簡易的な実装）
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index].trim();
      });
      data.push(row);
    }
  }

  return data;
}

function generateImportSQL(cards) {
  const sqlLines = [];

  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- 多言語カードデータインポートSQL');
  sqlLines.push('-- 生成日: ' + new Date().toISOString().split('T')[0]);
  sqlLines.push('-- 対象レコード数: ' + cards.length);
  sqlLines.push('-- 対応言語: 英語(en), 韓国語(ko), 中国語繁体字(zh-TW), フランス語(fr), スペイン語(es), ドイツ語(de)');
  sqlLines.push('-- ============================================================================');
  sqlLines.push('');
  sqlLines.push('BEGIN;');
  sqlLines.push('');
  sqlLines.push('\\echo \'=== 多言語カードデータインポート開始 ===\'');
  sqlLines.push('');

  // 一時テーブル作成
  sqlLines.push('-- 一時テーブル作成');
  sqlLines.push('CREATE TEMP TABLE temp_multilingual_cards (');
  sqlLines.push('  id BIGINT,');
  sqlLines.push('  name_multilingual JSONB,');
  sqlLines.push('  image_url_multilingual JSONB');
  sqlLines.push(');');
  sqlLines.push('');

  sqlLines.push('-- データ挿入');
  sqlLines.push('INSERT INTO temp_multilingual_cards (id, name_multilingual, image_url_multilingual) VALUES');

  const values = cards.map((card, index) => {
    const isLast = index === cards.length - 1;

    // name_multilingual の構築（既存のjaを保持しつつ、6言語を追加）
    const nameMultilingual = {
      en: card['card_name_英語'] || '',
      ko: card['card_name_韓国語'] || '',
      'zh-TW': card['card_name_中国語'] || '',
      fr: card['card_name_フランス語'] || '',
      es: card['card_name_スペイン語'] || '',
      de: card['card_name_ドイツ語'] || ''
    };

    // image_url_multilingual の構築
    const imageUrlMultilingual = {
      en: card['image_url_英語'] || '',
      ko: card['image_url_韓国語'] || '',
      'zh-TW': card['image_url_中国語'] || '',
      fr: card['image_url_フランス語'] || '',
      es: card['image_url_スペイン語'] || '',
      de: card['image_url_ドイツ語'] || ''
    };

    // JSONをエスケープ
    const nameJson = JSON.stringify(nameMultilingual).replace(/'/g, "''");
    const imageJson = JSON.stringify(imageUrlMultilingual).replace(/'/g, "''");

    const comma = isLast ? ';' : ',';
    return `  (${card.id}, '${nameJson}'::jsonb, '${imageJson}'::jsonb)${comma}`;
  });

  sqlLines.push(...values);
  sqlLines.push('');

  sqlLines.push('-- 既存のname_multilingualとimage_url_multilingualに新しい言語データをマージ');
  sqlLines.push('UPDATE cards');
  sqlLines.push('SET');
  sqlLines.push('  name_multilingual = cards.name_multilingual || temp.name_multilingual,');
  sqlLines.push('  image_url_multilingual = cards.image_url_multilingual || temp.image_url_multilingual');
  sqlLines.push('FROM temp_multilingual_cards temp');
  sqlLines.push('WHERE cards.id = temp.id;');
  sqlLines.push('');

  sqlLines.push('-- 更新されたレコード数を確認');
  sqlLines.push('DO $$');
  sqlLines.push('DECLARE');
  sqlLines.push('  updated_count INT;');
  sqlLines.push('BEGIN');
  sqlLines.push('  SELECT count(*) INTO updated_count FROM cards c');
  sqlLines.push('  JOIN temp_multilingual_cards t ON c.id = t.id');
  sqlLines.push('  WHERE c.name_multilingual ? \'en\' AND c.image_url_multilingual ? \'en\';');
  sqlLines.push('  ');
  sqlLines.push('  RAISE NOTICE \'更新されたレコード数: %\', updated_count;');
  sqlLines.push('  ');
  sqlLines.push('  IF updated_count <> ' + cards.length + ' THEN');
  sqlLines.push('    RAISE WARNING \'期待されたレコード数(' + cards.length + ')と実際の更新数(%)が一致しません\', updated_count;');
  sqlLines.push('  END IF;');
  sqlLines.push('END $$;');
  sqlLines.push('');

  sqlLines.push('-- 一時テーブル削除');
  sqlLines.push('DROP TABLE temp_multilingual_cards;');
  sqlLines.push('');

  sqlLines.push('-- サンプル確認（最初の5件）');
  sqlLines.push('SELECT id, name, name_multilingual, image_url_multilingual');
  sqlLines.push('FROM cards');
  sqlLines.push('WHERE id IN (3101, 3102, 3103, 3104, 3105)');
  sqlLines.push('ORDER BY id;');
  sqlLines.push('');

  sqlLines.push('COMMIT;');
  sqlLines.push('');
  sqlLines.push('\\echo \'=== 多言語カードデータインポート完了 ===\'');
  sqlLines.push('');
  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- 完了');
  sqlLines.push('-- ============================================================================');

  return sqlLines.join('\n');
}

function main() {
  try {
    console.log('📖 CSVファイルを読み込んでいます...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

    console.log('🔄 CSVをパースしています...');
    const cards = parseCSV(csvContent);
    console.log(`✅ ${cards.length} 件のカードデータを読み込みました`);

    // 最初の1件を表示
    console.log('');
    console.log('サンプルデータ (1件目):');
    console.log('  ID:', cards[0].id);
    console.log('  英語名:', cards[0]['card_name_英語']);
    console.log('  韓国語名:', cards[0]['card_name_韓国語']);
    console.log('  中国語名:', cards[0]['card_name_中国語']);
    console.log('');

    console.log('🔨 インポートSQLを生成しています...');
    const sql = generateImportSQL(cards);

    console.log('💾 SQLファイルを保存しています...');
    fs.writeFileSync(OUTPUT_PATH, sql, 'utf-8');

    console.log('');
    console.log('✨ 完了！');
    console.log('');
    console.log('📄 出力ファイル:', OUTPUT_PATH);
    console.log('📊 対象レコード数:', cards.length);
    console.log('🌐 対応言語: 英語, 韓国語, 中国語繁体字, フランス語, スペイン語, ドイツ語');
    console.log('');
    console.log('実行方法:');
    console.log('  psql "$POSTGRES_URL" -f scripts/import-multilingual-cards.sql');
    console.log('');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
