const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../../db/db.json');
const readDB = () => JSON.parse(fs.readFileSync(dbPath)); 
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
