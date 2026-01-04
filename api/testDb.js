// api/testDb.js
require('dotenv').config();          // garante que o .env seja lido
const { query } = require('./services/db');

async function main() {
  try {
    const result = await query('SELECT NOW() AS agora');
    console.log('Conectado ao Postgres! Hora do servidor:', result.rows[0].agora);
  } catch (err) {
    console.error('Erro ao conectar no Postgres:', err);
  } finally {
    process.exit();
  }
}

main();
