import restify from 'restify';
import { graphql } from 'graphql';
import schema from './schema.js';

const server = restify.createServer({
  name: 'deploybot',
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.post('/graphql', (req, res, next) => {
  const { query } = req.body;
  let { variables = {} } = req.body;
  variables = Object.prototype.toString.call(variables) === '[object String]'
    ? JSON.parse(variables)
    : variables;
  graphql(schema, query, {}, {}, variables).then(result => {
    res.send(result);
    next();
  });
});

server.listen(5000, () => {
  console.log('%s listening at %s', server.name, server.url);
});
