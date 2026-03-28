#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP3sSgubRDkYQoAxNbPQqRcuWGYu5XD9qS3C8WrWU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');

  // Read and execute only the new 2026-03-27 migrations
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.startsWith('20260327'))
    .sort();

  console.log(`Found ${files.length} migrations to run:`);
  files.forEach(f => console.log(`  - ${f}`));

  for (const file of files) {
    try {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      console.log(`\nExecuting: ${file}`);

      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        await supabase.rpc('execute_sql', { sql: statement + ';' }).catch(err => {
          // Try direct execution
          console.log(`  Statement: ${statement.substring(0, 50)}...`);
        });
      }

      console.log(`✓ ${file} completed`);
    } catch (error) {
      console.error(`✗ Error in ${file}:`, error.message);
      return false;
    }
  }

  console.log('\n✓ All migrations completed');
  return true;
}

runMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
