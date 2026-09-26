import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Connecting to MySQL database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME || 'cricket_scorecard',
    multipleStatements: true
  });

  console.log('✅ Connected! Reading schema.sql...');
  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Creating tables in database...');
  await connection.query(sql);
  
  console.log('🎉 Database tables created successfully!');
  await connection.end();
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
