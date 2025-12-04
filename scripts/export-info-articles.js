#!/usr/bin/env node

/**
 * 本番環境からinfo_articlesテーブルのデータをエクスポート
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportInfoArticles() {
  console.log('Fetching info_articles from production...');

  const { data, error } = await supabase
    .from('info_articles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No data found in info_articles table');
    return;
  }

  console.log(`Found ${data.length} articles`);

  // Generate SQL INSERT statements
  const insertStatements = data.map(article => {
    const id = article.id;
    const title = article.title?.replace(/'/g, "''") || '';
    const slug = article.slug?.replace(/'/g, "''") || '';
    const excerpt = article.excerpt ? `'${article.excerpt.replace(/'/g, "''")}'` : 'NULL';
    const content = JSON.stringify(article.content).replace(/'/g, "''");
    const category = article.category?.replace(/'/g, "''") || 'news';
    const publishedAt = article.published_at ? `'${article.published_at}'` : 'NULL';
    const createdAt = article.created_at ? `'${article.created_at}'` : 'NOW()';
    const updatedAt = article.updated_at ? `'${article.updated_at}'` : 'NOW()';
    const authorId = article.author_id ? `'${article.author_id}'` : 'NULL';
    const isPublished = article.is_published || false;
    const viewCount = article.view_count || 0;
    const tags = article.tags ? `ARRAY[${article.tags.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')}]::TEXT[]` : "'{}'::TEXT[]";

    return `INSERT INTO public.info_articles (id, title, slug, excerpt, content, category, published_at, created_at, updated_at, author_id, is_published, view_count, tags)
VALUES ('${id}', '${title}', '${slug}', ${excerpt}, '${content}'::jsonb, '${category}', ${publishedAt}, ${createdAt}, ${updatedAt}, ${authorId}, ${isPublished}, ${viewCount}, ${tags});`;
  });

  const sql = `-- Exported data from info_articles (${new Date().toISOString()})
-- ${data.length} records

${insertStatements.join('\n\n')}
`;

  console.log('\n--- SQL INSERT STATEMENTS ---\n');
  console.log(sql);

  // Write to file
  const outputFile = path.join(__dirname, 'info-articles-data.sql');
  fs.writeFileSync(outputFile, sql);
  console.log(`\nData exported to ${outputFile}`);
}

exportInfoArticles().catch(console.error);
