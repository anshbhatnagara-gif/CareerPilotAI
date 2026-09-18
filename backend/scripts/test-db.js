const pool = require('../src/config/db');

async function testDatabaseConnection() {
  console.log('Testing TiDB Cloud / MySQL connection...');
  try {
    const [versionResult] = await pool.query('SELECT VERSION() AS version');
    const [dbResult] = await pool.query('SELECT DATABASE() AS database_name');

    const version = versionResult[0] ? versionResult[0].version : 'Unknown';
    const databaseName = dbResult[0] ? dbResult[0].database_name : 'Unknown';

    console.log('----------------------------------------');
    console.log('Status: Connection Successful!');
    console.log(`Database Engine Version: ${version}`);
    console.log(`Active Database Name: ${databaseName}`);
    console.log('----------------------------------------');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('----------------------------------------');
    console.error('Error: Connection Failed!');
    console.error(`Message: ${error.message}`);
    console.error('----------------------------------------');
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

testDatabaseConnection();
