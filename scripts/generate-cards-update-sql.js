/**
 * CSVからカードデータのUPDATE文を生成するスクリプト
 *
 * 使用方法:
 * node scripts/generate-cards-update-sql.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../docs/cards_update.csv');
const OUTPUT_PATH = path.join(__dirname, 'update-cards-metadata.sql');

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
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

function generateUpdateSQL(cards) {
  const sqlLines = [];

  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- カードメタデータ更新SQL');
  sqlLines.push('-- 生成日: ' + new Date().toISOString().split('T')[0]);
  sqlLines.push('-- 対象レコード数: ' + cards.length);
  sqlLines.push('-- ============================================================================');
  sqlLines.push('');
  sqlLines.push('BEGIN;');
  sqlLines.push('');
  sqlLines.push('-- col_3, col_4, col_5 を一括更新');
  sqlLines.push('');

  // 一時テーブルを使用した効率的な更新方法
  sqlLines.push('-- 一時テーブル作成');
  sqlLines.push('CREATE TEMP TABLE temp_card_updates (');
  sqlLines.push('  id BIGINT,');
  sqlLines.push('  col_3 TEXT,');
  sqlLines.push('  col_4 TEXT,');
  sqlLines.push('  col_5 TEXT');
  sqlLines.push(');');
  sqlLines.push('');

  sqlLines.push('-- データ挿入');
  sqlLines.push('INSERT INTO temp_card_updates (id, col_3, col_4, col_5) VALUES');

  const values = cards.map((card, index) => {
    const isLast = index === cards.length - 1;
    const comma = isLast ? ';' : ',';
    return `  (${card.id}, '${card.col_3}', '${card.col_4}', '${card.col_5}')${comma}`;
  });

  sqlLines.push(...values);
  sqlLines.push('');

  sqlLines.push('-- 一括更新実行');
  sqlLines.push('UPDATE cards');
  sqlLines.push('SET');
  sqlLines.push('  col_3 = temp.col_3,');
  sqlLines.push('  col_4 = temp.col_4,');
  sqlLines.push('  col_5 = temp.col_5');
  sqlLines.push('FROM temp_card_updates temp');
  sqlLines.push('WHERE cards.id = temp.id;');
  sqlLines.push('');

  sqlLines.push('-- 更新されたレコード数を確認');
  sqlLines.push('DO $$');
  sqlLines.push('DECLARE');
  sqlLines.push('  updated_count INT;');
  sqlLines.push('BEGIN');
  sqlLines.push('  SELECT count(*) INTO updated_count FROM cards c');
  sqlLines.push('  JOIN temp_card_updates t ON c.id = t.id');
  sqlLines.push('  WHERE c.col_3 = t.col_3 AND c.col_4 = t.col_4 AND c.col_5 = t.col_5;');
  sqlLines.push('  ');
  sqlLines.push('  RAISE NOTICE \'更新されたレコード数: %\', updated_count;');
  sqlLines.push('  ');
  sqlLines.push('  IF updated_count <> ' + cards.length + ' THEN');
  sqlLines.push('    RAISE WARNING \'期待されたレコード数(' + cards.length + ')と実際の更新数(%)が一致しません\', updated_count;');
  sqlLines.push('  END IF;');
  sqlLines.push('END $$;');
  sqlLines.push('');

  sqlLines.push('-- 一時テーブル削除');
  sqlLines.push('DROP TABLE temp_card_updates;');
  sqlLines.push('');

  sqlLines.push('-- サンプル確認（最初の5件）');
  sqlLines.push('SELECT id, name, col_3, col_4, col_5');
  sqlLines.push('FROM cards');
  sqlLines.push('WHERE id IN (3101, 3102, 3103, 3104, 3105)');
  sqlLines.push('ORDER BY id;');
  sqlLines.push('');

  sqlLines.push('COMMIT;');
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

    console.log('🔨 UPDATE SQLを生成しています...');
    const sql = generateUpdateSQL(cards);

    console.log('💾 SQLファイルを保存しています...');
    fs.writeFileSync(OUTPUT_PATH, sql, 'utf-8');

    console.log('');
    console.log('✨ 完了！');
    console.log('');
    console.log('📄 出力ファイル:', OUTPUT_PATH);
    console.log('📊 対象レコード数:', cards.length);
    console.log('');
    console.log('実行方法:');
    console.log('  psql "$POSTGRES_URL" -f scripts/update-cards-metadata.sql');
    console.log('');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

main();
