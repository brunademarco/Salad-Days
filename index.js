const fs = require('fs');
const path = require('path');
const jsonServer = require(path.resolve(__dirname, 'node_modules/json-server'));
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

const receitas = JSON.parse(fs.readFileSync(path.join(__dirname, 'db/receitas.json'), 'utf-8'));
const usuarios = JSON.parse(fs.readFileSync(path.join(__dirname, 'db/usuarios.json'), 'utf-8'));

const db = {
  ...receitas,
  usuarios: usuarios
};

const router = jsonServer.router(() => db);

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
