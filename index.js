const fs = require('fs');
const path = require('path');
const jsonServer = require('./node_modules/json-server');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();
const CryptoJS = require("crypto-js");

const dbPath = path.join(__dirname, 'db/db.json');

const router = jsonServer.router(dbPath);

server.use(middlewares);  
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

server.use(router); 

server.listen(3000, () => {
  console.log('✅ JSON Server rodando em http://localhost:3000');
});
