const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.json');

const readDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

module.exports = {
  readDB,
  saveDB,
  dbPath
};
