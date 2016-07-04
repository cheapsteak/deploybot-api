'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var getBuild = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(id) {
    var xs;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return getBuilds();

          case 2:
            xs = _context.sent;
            return _context.abrupt('return', xs.find(function (b) {
              return b.id === id;
            }));

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getBuild(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getTag = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(id) {
    var xs;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return getTags();

          case 2:
            xs = _context2.sent;
            return _context2.abrupt('return', xs.find(function (x) {
              return x.name === id;
            }));

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getTag(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var startDockerContainer = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(name) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return docker.post('/containers/' + name + '/start');

          case 3:
            return _context3.abrupt('return', _context3.sent);

          case 6:
            _context3.prev = 6;
            _context3.t0 = _context3['catch'](0);

            console.log(_context3.t0.error);
            return _context3.abrupt('return', _context3.t0.error);

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[0, 6]]);
  }));

  return function startDockerContainer(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var createDockerContainer = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(Image, name) {
    var res;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            console.log('checking for image ' + Image + '...');
            _context4.next = 4;
            return docker.post('/images/' + Image + '/json');

          case 4:
            _context4.next = 11;
            break;

          case 6:
            _context4.prev = 6;
            _context4.t0 = _context4['catch'](0);

            console.log(Image + ' not found. Downloading...');
            _context4.next = 11;
            return docker.post('/images/create?fromImage=' + Image + ':' + name);

          case 11:
            _context4.prev = 11;

            console.log('Creating container ' + name + ' from ' + Image + ':' + name + '...');
            _context4.next = 15;
            return docker.post('/containers/create', {
              qs: { name: name },
              body: {
                Image: Image + ':' + name,
                HostConfig: {
                  PublishAllPorts: true
                }
              }
            });

          case 15:
            res = _context4.sent;
            return _context4.abrupt('return', res.Id);

          case 19:
            _context4.prev = 19;
            _context4.t1 = _context4['catch'](11);

            console.log(_context4.t1.error);
            return _context4.abrupt('return', _context4.t1.error);

          case 23:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[0, 6], [11, 19]]);
  }));

  return function createDockerContainer(_x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}();

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

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
  baseUrl: 'http://unix:/var/run/docker.sock:',
  headers: {
    host: ''
  },
  json: true
});

function getBuilds() {
  return quay.get('/build', {
    transform: function transform(res) {
      return res.builds.filter(function (b) {
        return b.phase === 'complete';
      });
    }
  });
}

function getTags() {
  return quay.get('/tag', {
    transform: function transform(res) {
      return res.tags.filter(function (t) {
        return !t.end_ts;
      });
    }
  });
}

function getContainers() {
  return docker.get('/containers/json?all=1');
}

function getContainer(id) {
  return docker.get('/containers/' + id + '/json');
}

var _nodeDefinitions = (0, _graphqlRelay.nodeDefinitions)(function (globalId) {
  var _fromGlobalId = (0, _graphqlRelay.fromGlobalId)(globalId);

  var type = _fromGlobalId.type;
  var id = _fromGlobalId.id;

  if (type === 'Build') {
    return getBuild(id);
  } else if (type === 'Container') {
    return getContainer(id);
  } else if (type === 'Tag') {
    return getTag(id);
  }
  return { id: 1 };
}, function (obj) {
  if (obj.hasOwnProperty('display_name')) {
    return Build;
  } else if (obj.hasOwnProperty('Names')) {
    return Container;
  } else if (obj.hasOwnProperty('docker_image_id')) {
    return Tag;
  }
  return User;
});

var nodeInterface = _nodeDefinitions.nodeInterface;
var nodeField = _nodeDefinitions.nodeField;


var ContainerPort = new _graphql.GraphQLObjectType({
  name: 'ContainerPort',
  fields: function fields() {
    return {
      PrivatePort: {
        type: _graphql.GraphQLInt
      },
      PublicPort: {
        type: _graphql.GraphQLInt
      },
      Type: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var ContainerHostConfig = new _graphql.GraphQLObjectType({
  name: 'ContainerHostConfig',
  fields: function fields() {
    return {
      NetworkMode: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var ContainerNetworkSettingsNetworkBridge = new _graphql.GraphQLObjectType({
  name: 'ContainerNetworkSettingsNetworkBridge',
  fields: function fields() {
    return {
      IPAMConfig: {
        type: _graphql.GraphQLString
      },
      Links: {
        type: new _graphql.GraphQLList(_graphql.GraphQLString)
      },
      Aliases: {
        type: new _graphql.GraphQLList(_graphql.GraphQLString)
      },
      NetworkID: {
        type: _graphql.GraphQLString
      },
      EndpointID: {
        type: _graphql.GraphQLString
      },
      Gateway: {
        type: _graphql.GraphQLString
      },
      IPAddress: {
        type: _graphql.GraphQLString
      },
      IPPrefixLen: {
        type: _graphql.GraphQLInt
      },
      IPv6Gateway: {
        type: _graphql.GraphQLString
      },
      GlobalIPv6Address: {
        type: _graphql.GraphQLString
      },
      GlobalIPv6PrefixLen: {
        type: _graphql.GraphQLInt
      },
      MacAddress: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var ContainerNetworkSettingsNetwork = new _graphql.GraphQLObjectType({
  name: 'ContainerNetworkSettingsNetwork',
  fields: function fields() {
    return {
      bridge: {
        type: ContainerNetworkSettingsNetworkBridge
      }
    };
  }
});

var ContainerNetworkSettings = new _graphql.GraphQLObjectType({
  name: 'ContainerNetworkSettings',
  fields: function fields() {
    return {
      Networks: {
        type: ContainerNetworkSettingsNetwork
      }
    };
  }
});

var ContainerMount = new _graphql.GraphQLObjectType({
  name: 'ContainerMount',
  fields: function fields() {
    return {
      Name: {
        type: _graphql.GraphQLString
      },
      Source: {
        type: _graphql.GraphQLString
      },
      Destination: {
        type: _graphql.GraphQLString
      },
      Driver: {
        type: _graphql.GraphQLString
      },
      Mode: {
        type: _graphql.GraphQLString
      },
      RW: {
        type: _graphql.GraphQLBoolean
      },
      Propagation: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var Container = new _graphql.GraphQLObjectType({
  name: 'Container',
  description: 'Deployed Container',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('Container', function (obj) {
        return obj.Id;
      }),
      Id: {
        type: _graphql.GraphQLString
      },
      Names: {
        type: new _graphql.GraphQLList(_graphql.GraphQLString)
      },
      Image: {
        type: _graphql.GraphQLString
      },
      ImageID: {
        type: _graphql.GraphQLString
      },
      Command: {
        type: _graphql.GraphQLString
      },
      Created: {
        type: _graphql.GraphQLInt
      },
      State: {
        type: _graphql.GraphQLString
      },
      Status: {
        type: _graphql.GraphQLString
      },
      Ports: {
        type: new _graphql.GraphQLList(ContainerPort)
      },
      SizeRw: {
        type: _graphql.GraphQLInt
      },
      SizeRootFs: {
        type: _graphql.GraphQLInt
      },
      HostConfig: {
        type: ContainerHostConfig
      },
      NetworkSettings: {
        type: ContainerNetworkSettings
      },
      Mounts: {
        type: new _graphql.GraphQLList(ContainerMount)
      }
    };
  },
  interfaces: [nodeInterface]
});

var BuildPullRobot = new _graphql.GraphQLObjectType({
  name: 'BuildPullRobot',
  fields: function fields() {
    return {
      is_robot: {
        type: _graphql.GraphQLString
      },
      kind: {
        type: _graphql.GraphQLString
      },
      name: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var BuildRepository = new _graphql.GraphQLObjectType({
  name: 'BuildRepository',
  fields: function fields() {
    return {
      name: {
        type: _graphql.GraphQLString
      },
      namespace: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var BuildTriggerMetadataCommitInfoAuthor = new _graphql.GraphQLObjectType({
  name: 'BuildTriggerMetadataCommitInfoAuthor',
  fields: function fields() {
    return {
      avatar_url: {
        type: _graphql.GraphQLString
      },
      url: {
        type: _graphql.GraphQLString
      },
      username: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var BuildTriggerMetadataCommitInfoCommitter = new _graphql.GraphQLObjectType({
  name: 'BuildTriggerMetadataCommitInfoCommitter',
  fields: function fields() {
    return {
      avatar_url: {
        type: _graphql.GraphQLString
      },
      url: {
        type: _graphql.GraphQLString
      },
      username: {
        type: _graphql.GraphQLString
      }
    };
  }
});
var BuildTriggerMetadataCommitInfo = new _graphql.GraphQLObjectType({
  name: 'BuildTriggerMetadataCommitInfo',
  fields: function fields() {
    return {
      author: {
        type: BuildTriggerMetadataCommitInfoAuthor
      },
      committer: {
        type: BuildTriggerMetadataCommitInfoCommitter
      },
      date: {
        type: _graphql.GraphQLString
      },
      message: {
        type: _graphql.GraphQLString
      },
      url: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var BuildTriggerMetadata = new _graphql.GraphQLObjectType({
  name: 'BuildTriggerMetadata',
  fields: function fields() {
    return {
      commit: {
        type: _graphql.GraphQLString
      },
      commit_info: {
        type: BuildTriggerMetadataCommitInfo
      },
      default_branch: {
        type: _graphql.GraphQLString
      },
      git_url: {
        type: _graphql.GraphQLString
      },
      ref: {
        type: _graphql.GraphQLString
      }
    };
  }
});

var BuildTrigger = new _graphql.GraphQLObjectType({
  name: 'BuildTrigger',
  fields: function fields() {
    return {
      service: {
        type: _graphql.GraphQLString
      },
      is_active: {
        type: _graphql.GraphQLBoolean
      },
      repository_url: {
        type: _graphql.GraphQLString
      },
      build_source: {
        type: _graphql.GraphQLString
      },
      id: {
        type: _graphql.GraphQLString
      },
      is_connected_user: {
        type: _graphql.GraphQLBoolean
      }
    };
  }
});

var BuildStatus = new _graphql.GraphQLObjectType({
  name: 'BuildStatus',
  fields: function fields() {
    return {
      total_commands: {
        type: _graphql.GraphQLInt
      },
      current_command: {
        type: _graphql.GraphQLBoolean
      },
      pull_completion: {
        type: _graphql.GraphQLInt
      },
      push_completion: {
        type: _graphql.GraphQLInt
      },
      heartbeat: {
        type: _graphql.GraphQLInt
      }
    };
  }
});

var Build = new _graphql.GraphQLObjectType({
  name: 'Build',
  description: 'Docker build in Quay',
  fields: {
    id: (0, _graphqlRelay.globalIdField)('Build'),
    display_name: {
      type: _graphql.GraphQLString
    },
    error: {
      type: _graphql.GraphQLString
    },
    is_writer: {
      type: _graphql.GraphQLBoolean
    },
    manual_user: {
      type: _graphql.GraphQLString
    },
    phase: {
      type: _graphql.GraphQLString
    },
    pull_robot: {
      type: BuildPullRobot
    },
    repository: {
      type: BuildRepository
    },
    resource_key: {
      type: _graphql.GraphQLString
    },
    started: {
      type: _graphql.GraphQLString
    },
    status: {
      type: BuildStatus
    },
    subdirectory: {
      type: _graphql.GraphQLString
    },
    tags: {
      type: new _graphql.GraphQLList(_graphql.GraphQLString)
    },
    trigger: {
      type: BuildTrigger
    },
    trigger_metadata: {
      type: BuildTriggerMetadata
    }
  },
  interfaces: [nodeInterface]
});

var Tag = new _graphql.GraphQLObjectType({
  name: 'Tag',
  description: 'Docker tag in Quay',
  fields: {
    id: (0, _graphqlRelay.globalIdField)('Tag', function (obj) {
      return obj.name;
    }),
    reversion: {
      type: _graphql.GraphQLBoolean
    },
    start_ts: {
      type: _graphql.GraphQLInt
    },
    name: {
      type: _graphql.GraphQLString
    },
    docker_image_id: {
      type: _graphql.GraphQLString
    }
  },
  interfaces: [nodeInterface]
});

var _connectionDefinition = (0, _graphqlRelay.connectionDefinitions)({ nodeType: Build });

var BuildConnection = _connectionDefinition.connectionType;

var _connectionDefinition2 = (0, _graphqlRelay.connectionDefinitions)({ nodeType: Tag });

var TagConnection = _connectionDefinition2.connectionType;

var _connectionDefinition3 = (0, _graphqlRelay.connectionDefinitions)({ nodeType: Container });

var ContainerConnection = _connectionDefinition3.connectionType;
var ContainerEdge = _connectionDefinition3.edgeType;


var User = new _graphql.GraphQLObjectType({
  name: 'User',
  fields: {
    id: (0, _graphqlRelay.globalIdField)('User'),
    builds: {
      type: BuildConnection,
      args: _graphqlRelay.connectionArgs,
      resolve: function resolve(_, args) {
        return (0, _graphqlRelay.connectionFromPromisedArray)(getBuilds(), args);
      }
    },
    tags: {
      type: TagConnection,
      args: _graphqlRelay.connectionArgs,
      resolve: function resolve(_, args) {
        return (0, _graphqlRelay.connectionFromPromisedArray)(getTags(), args);
      }
    },
    containers: {
      type: ContainerConnection,
      args: _graphqlRelay.connectionArgs,
      resolve: function resolve(_, args) {
        return (0, _graphqlRelay.connectionFromPromisedArray)(getContainers(), args);
      }
    }
  }
});

var Root = new _graphql.GraphQLObjectType({
  name: 'Root',
  fields: function fields() {
    return {
      viewer: {
        type: User,
        resolve: function resolve() {
          return { id: 1 };
        }
      },
      node: nodeField
    };
  }
});

var CreateContainerMutation = (0, _graphqlRelay.mutationWithClientMutationId)({
  name: 'CreateContainer',
  inputFields: {
    Image: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
    },
    name: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLString)
    }
  },
  outputFields: {
    containerEdge: {
      type: ContainerEdge,
      resolve: function () {
        var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(_ref6) {
          var localContainerId = _ref6.localContainerId;
          var containers, idx, node, cursor;
          return regeneratorRuntime.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return getContainers();

                case 2:
                  containers = _context5.sent;
                  idx = containers.map(function (c) {
                    return c.Id;
                  }).indexOf(localContainerId);
                  node = containers[idx];
                  cursor = (0, _graphqlRelay.offsetToCursor)(containers.map(function (x) {
                    return x.id;
                  }), node.id);
                  return _context5.abrupt('return', { cursor: cursor, node: node });

                case 7:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, undefined);
        }));

        return function resolve(_x6) {
          return _ref5.apply(this, arguments);
        };
      }()
    },
    viewer: {
      type: User,
      resolve: function resolve() {
        return { id: 1 };
      }
    }
  },
  mutateAndGetPayload: function () {
    var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(_ref8) {
      var Image = _ref8.Image;
      var name = _ref8.name;
      var localContainerId;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return createDockerContainer(Image, name);

            case 2:
              localContainerId = _context6.sent;
              _context6.next = 5;
              return startDockerContainer(name);

            case 5:
              return _context6.abrupt('return', { localContainerId: localContainerId });

            case 6:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, undefined);
    }));

    return function mutateAndGetPayload(_x7) {
      return _ref7.apply(this, arguments);
    };
  }()
});

var Mutation = new _graphql.GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createContainer: CreateContainerMutation
  }
});

exports.default = new _graphql.GraphQLSchema({
  query: Root,
  mutation: Mutation
});