import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'Pawan@192', 
  database: 'cricket_scorecard',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

export default pool;
