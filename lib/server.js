import restify from 'restify';
import { graphql } from 'graphql';
import schema from './schema.js';

import rp from 'request-promise';

const quay = rp.defaults({
  baseUrl: 'https://quay.io/api/v1/repository/ncigdc/portal-ui',
  auth: {
    bearer: process.env.QUAY_NCIGDC_TOKEN,
  },
  json: true,
});

const docker = rp.defaults({
  baseUrl: 'http://localhost:2376',
  json: true,
});


const imagesResponse = (request, response, next) => {
  quay.get('/api/v1/repository/ncigdc/portal-ui/build/', (err, req, res) => {
    response.send(JSON.parse(res.body));
    next();
  });
};

const containersResponse = (request, response, next) => {
  rp.get('http://unix:/var/run/docker.sock:/images/json', {
    headers: {
      host: '',
    },
    json: true,
  }, (err, req, res) => {
    console.log(err);
    console.log(req);
    console.log(res);
    response.send(res);
    next();
  });
};

const server = restify.createServer({
  name: 'deploybot',
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/images', imagesResponse);
server.get('/containers', containersResponse);

async function createDockerContainer(request, response) {
  try {
    const res = await docker.post('/containers/create', {
      body: {
        // Image: 'quay.io/ncigdc/portal-ui:chore-docker-image',
        Image: request.body.Image,
        HostConfig: {
          PublishAllPorts: true,
        },
      },
    });
    response.send(res);
  } catch (err) {
    response.send(err.error);
  }
}

async function startDockerContainer(request, response) {
  try {
    const res = await docker.post(`/containers/${request.params.id}/start`);
    response.send(res);
  } catch (err) {
    response.send(err.error);
  }
}

async function stopDockerContainer(request, response) {
  try {
    const res = await docker.post(`/containers/${request.params.id}/stop`);
    response.send(res);
  } catch (err) {
    response.send(err.error);
  }
}

server.post('/containers/create', createDockerContainer);
server.post('/containers/:id/start', startDockerContainer);
server.post('/containers/:id/stop', stopDockerContainer);

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
