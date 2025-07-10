const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db/receitas.json'); 
const middlewares = jsonServer.defaults();

server.use(middlewares);

// Configurar CORS (se necessário)
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Usando o arquivo db.json como a fonte dos dados
server.use(router);

// Inicia o servidor
server.listen(3000, () => {
  console.log('JSON Server is running em http://localhost:3000');
});
