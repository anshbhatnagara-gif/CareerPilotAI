const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runMigrations() {
  console.log('Starting TiDB Cloud / MySQL Schema Migrations...');

  const migrationsDir = path.join(__dirname, '../migrations');

  try {
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s): ${files.join(', ')}`);

    let totalStatements = 0;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`\nExecuting migration: ${file}...`);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Strip SQL line comments
      const cleanSql = sqlContent
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

      // Split SQL statements by semicolon while ignoring empty statements
      const statements = cleanSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      let count = 0;
      for (const statement of statements) {
        count++;
        totalStatements++;
        console.log(`  -> Statement [${count}/${statements.length}]...`);
        await pool.query(statement);
      }
    }

    console.log('\n----------------------------------------');
    console.log('Migrations Completed Successfully!');
    console.log(`Total Migration Files Processed: ${files.length}`);
    console.log(`Total SQL Statements Executed: ${totalStatements}`);
    console.log('----------------------------------------');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n----------------------------------------');
    console.error('Error: Migration Execution Failed!');
    console.error(`Message: ${error.message}`);
    console.error('----------------------------------------');
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

runMigrations();
