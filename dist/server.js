'use strict';

var createDockerContainer = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(request, response) {
    var res;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return docker.post('/containers/create', {
              body: {
                // Image: 'quay.io/ncigdc/portal-ui:chore-docker-image',
                Image: request.body.Image,
                HostConfig: {
                  PublishAllPorts: true
                }
              }
            });

          case 3:
            res = _context.sent;

            response.send(res);
            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context['catch'](0);

            response.send(_context.t0.error);

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 7]]);
  }));

  return function createDockerContainer(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var startDockerContainer = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(request, response) {
    var res;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return docker.post('/containers/' + request.params.id + '/start');

          case 3:
            res = _context2.sent;

            response.send(res);
            _context2.next = 10;
            break;

          case 7:
            _context2.prev = 7;
            _context2.t0 = _context2['catch'](0);

            response.send(_context2.t0.error);

          case 10:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 7]]);
  }));

  return function startDockerContainer(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var stopDockerContainer = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(request, response) {
    var res;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return docker.post('/containers/' + request.params.id + '/stop');

          case 3:
            res = _context3.sent;

            response.send(res);
            _context3.next = 10;
            break;

          case 7:
            _context3.prev = 7;
            _context3.t0 = _context3['catch'](0);

            response.send(_context3.t0.error);

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[0, 7]]);
  }));

  return function stopDockerContainer(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

var _restify = require('restify');

var _restify2 = _interopRequireDefault(_restify);

var _graphql = require('graphql');

var _schema = require('./schema.js');

var _schema2 = _interopRequireDefault(_schema);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var quay = _requestPromise2.default.defaults({
  baseUrl: 'https://quay.io/api/v1/repository/ncigdc/portal-ui',
  auth: {
    bearer: process.env.QUAY_NCIGDC_TOKEN
  },
  json: true
});

var docker = _requestPromise2.default.defaults({
  baseUrl: 'http://localhost:2376',
  json: true
});

var imagesResponse = function imagesResponse(request, response, next) {
  quay.get('/api/v1/repository/ncigdc/portal-ui/build/', function (err, req, res) {
    response.send(JSON.parse(res.body));
    next();
  });
};

var containersResponse = function containersResponse(request, response, next) {
  _requestPromise2.default.get('http://unix:/var/run/docker.sock:/images/json', {
    headers: {
      host: ''
    },
    json: true
  }, function (err, req, res) {
    console.log(err);
    console.log(req);
    console.log(res);
    response.send(res);
    next();
  });
};

var server = _restify2.default.createServer({
  name: 'deployment-dashboard'
});

server.use(_restify2.default.acceptParser(server.acceptable));
server.use(_restify2.default.queryParser());
server.use(_restify2.default.bodyParser());

server.get('/images', imagesResponse);
server.get('/containers', containersResponse);

server.post('/containers/create', createDockerContainer);
server.post('/containers/:id/start', startDockerContainer);
server.post('/containers/:id/stop', stopDockerContainer);

server.post('/graphql', function (req, res, next) {
  var query = req.body.query;
  var _req$body$variables = req.body.variables;
  var variables = _req$body$variables === undefined ? {} : _req$body$variables;

  variables = Object.prototype.toString.call(variables) === '[object String]' ? JSON.parse(variables) : variables;
  (0, _graphql.graphql)(_schema2.default, query, {}, {}, variables).then(function (result) {
    res.send(result);
    next();
  });
});

server.listen(5000, function () {
  console.log('%s listening at %s', server.name, server.url);
});