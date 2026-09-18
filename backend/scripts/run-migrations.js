const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runMigrations() {
  console.log('Starting TiDB Cloud / MySQL Schema Migrations...');

  const migrationFile = path.join(__dirname, '../migrations/001_initial_schema.sql');

  try {
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found at ${migrationFile}`);
    }

    const sqlContent = fs.readFileSync(migrationFile, 'utf8');

    // Split SQL statements by semicolon while ignoring comments and empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements in 001_initial_schema.sql.`);

    let count = 0;
    for (const statement of statements) {
      count++;
      console.log(`Executing statement [${count}/${statements.length}]...`);
      await pool.query(statement);
    }

    console.log('----------------------------------------');
    console.log('Migrations Completed Successfully!');
    console.log(`Executed Statements: ${count}`);
    console.log('----------------------------------------');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('----------------------------------------');
    console.error('Error: Migration Execution Failed!');
    console.error(`Message: ${error.message}`);
    console.error('----------------------------------------');
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

runMigrations();
