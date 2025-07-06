const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Render PostgreSQL connection details
const connectionString = 'postgresql://sanctity:AVj8dJLe56AjeMAybU7Qiqr9e1gJo7IL@dpg-d1laimer433s73dga52g-a.singapore-postgres.render.com/sanctityai';

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Render PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read the init.sql file
    const initSqlPath = path.join(__dirname, 'db', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    console.log('📝 Executing database schema...');
    await client.query(initSql);
    console.log('✅ Database schema created successfully!');

    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    console.log('📊 Created tables:', result.rows.map(row => row.table_name).join(', '));

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase(); 