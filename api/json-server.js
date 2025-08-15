const jsonServer = require('json-server');
const path = require('path');
const router = jsonServer.router(path.join(__dirname, '../db/db.json'));  
const middlewares = jsonServer.defaults();

module.exports = async (req, res) => {
  const server = jsonServer.create();

  server.use(middlewares);  
  server.use(router);       

  server(req, res);
};
