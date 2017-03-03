import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
} from 'graphql';

import {
  mutationWithClientMutationId,
  connectionArgs,
  connectionFromPromisedArray,
  connectionDefinitions,
  offsetToCursor,
  fromGlobalId,
  globalIdField,
  nodeDefinitions,
} from 'graphql-relay';

import rp from 'request-promise';

const quay = rp.defaults({
  baseUrl: 'https://quay.io/api/v1/repository/ncigdc/portal-ui',
  auth: {
    bearer: process.env.QUAY_NCIGDC_TOKEN,
  },
  json: true,
});

const docker = rp.defaults({
  baseUrl: 'http://unix:/var/run/docker.sock:',
  headers: {
    host: '',
  },
  json: true,
});

function getBuilds() {
  return quay.get('/build', {
    transform: res => res.builds.filter(b => b.phase === 'complete'),
  });
}

function getTags() {
  return quay.get('/tag', {
    transform: res => res.tags.filter(t => !t.end_ts),
  });
}

function getContainers() {
  return docker.get('/containers/json?all=1', {
    transform: res => res.filter(r => r.Image.startsWith('quay.io/ncigdc/portal-ui')),
  });
}

async function getBuild(id) {
  const xs = await getBuilds();
  return xs.find(b => b.id === id);
}

async function getTag(id) {
  const xs = await getTags();
  return xs.find(x => x.name === id);
}

function getContainer(id) {
  return docker.get(`/containers/${id}/json`);
}

const { nodeInterface, nodeField } = nodeDefinitions(
  globalId => {
    const { type, id } = fromGlobalId(globalId);
    if (type === 'Build') {
      return getBuild(id);
    } else if (type === 'Container') {
      return getContainer(id);
    } else if (type === 'Tag') {
      return getTag(id);
    }
    return { id: 1 };
  },
  obj => {
    if (obj.hasOwnProperty('display_name')) {
      return Build; // eslint-disable-line no-use-before-define
    } else if (obj.hasOwnProperty('Names')) {
      return Container; // eslint-disable-line no-use-before-define
    } else if (obj.hasOwnProperty('docker_image_id')) {
      return Tag; // eslint-disable-line no-use-before-define
    }
    return User; // eslint-disable-line no-use-before-define
  }
);

const ContainerPort = new GraphQLObjectType({
  name: 'ContainerPort',
  fields: () => ({
    PrivatePort: {
      type: GraphQLInt,
    },
    PublicPort: {
      type: GraphQLInt,
    },
    Type: {
      type: GraphQLString,
    },
  }),
});

const ContainerHostConfig = new GraphQLObjectType({
  name: 'ContainerHostConfig',
  fields: () => ({
    NetworkMode: {
      type: GraphQLString,
    },
  }),
});

const ContainerNetworkSettingsNetworkBridge = new GraphQLObjectType({
  name: 'ContainerNetworkSettingsNetworkBridge',
  fields: () => ({
    IPAMConfig: {
      type: GraphQLString,
    },
    Links: {
      type: new GraphQLList(GraphQLString),
    },
    Aliases: {
      type: new GraphQLList(GraphQLString),
    },
    NetworkID: {
      type: GraphQLString,
    },
    EndpointID: {
      type: GraphQLString,
    },
    Gateway: {
      type: GraphQLString,
    },
    IPAddress: {
      type: GraphQLString,
    },
    IPPrefixLen: {
      type: GraphQLInt,
    },
    IPv6Gateway: {
      type: GraphQLString,
    },
    GlobalIPv6Address: {
      type: GraphQLString,
    },
    GlobalIPv6PrefixLen: {
      type: GraphQLInt,
    },
    MacAddress: {
      type: GraphQLString,
    },
  }),
});

const ContainerNetworkSettingsNetwork = new GraphQLObjectType({
  name: 'ContainerNetworkSettingsNetwork',
  fields: () => ({
    bridge: {
      type: ContainerNetworkSettingsNetworkBridge,
    },
  }),
});

const ContainerNetworkSettings = new GraphQLObjectType({
  name: 'ContainerNetworkSettings',
  fields: () => ({
    Networks: {
      type: ContainerNetworkSettingsNetwork,
    },
  }),
});

const ContainerMount = new GraphQLObjectType({
  name: 'ContainerMount',
  fields: () => ({
    Name: {
      type: GraphQLString,
    },
    Source: {
      type: GraphQLString,
    },
    Destination: {
      type: GraphQLString,
    },
    Driver: {
      type: GraphQLString,
    },
    Mode: {
      type: GraphQLString,
    },
    RW: {
      type: GraphQLBoolean,
    },
    Propagation: {
      type: GraphQLString,
    },
  }),
});

const Container = new GraphQLObjectType({
  name: 'Container',
  description: 'Deployed Container',
  fields: () => ({
    id: globalIdField('Container', obj => obj.Id),
    Id: {
      type: GraphQLString,
    },
    Names: {
      type: new GraphQLList(GraphQLString),
    },
    Image: {
      type: GraphQLString,
    },
    ImageID: {
      type: GraphQLString,
    },
    Command: {
      type: GraphQLString,
    },
    Created: {
      type: GraphQLInt,
    },
    State: {
      type: GraphQLString,
    },
    Status: {
      type: GraphQLString,
    },
    Ports: {
      type: new GraphQLList(ContainerPort),
    },
    SizeRw: {
      type: GraphQLInt,
    },
    SizeRootFs: {
      type: GraphQLInt,
    },
    HostConfig: {
      type: ContainerHostConfig,
    },
    NetworkSettings: {
      type: ContainerNetworkSettings,
    },
    Mounts: {
      type: new GraphQLList(ContainerMount),
    },
  }),
  interfaces: [nodeInterface],
});

const BuildPullRobot = new GraphQLObjectType({
  name: 'BuildPullRobot',
  fields: () => ({
    is_robot: {
      type: GraphQLString,
    },
    kind: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
  }),
});

const BuildRepository = new GraphQLObjectType({
  name: 'BuildRepository',
  fields: () => ({
    name: {
      type: GraphQLString,
    },
    namespace: {
      type: GraphQLString,
    },
  }),
});

const BuildTriggerMetadataCommitInfoAuthor = new GraphQLObjectType({
  name: 'BuildTriggerMetadataCommitInfoAuthor',
  fields: () => ({
    avatar_url: {
      type: GraphQLString,
    },
    url: {
      type: GraphQLString,
    },
    username: {
      type: GraphQLString,
    },
  }),
});

const BuildTriggerMetadataCommitInfoCommitter = new GraphQLObjectType({
  name: 'BuildTriggerMetadataCommitInfoCommitter',
  fields: () => ({
    avatar_url: {
      type: GraphQLString,
    },
    url: {
      type: GraphQLString,
    },
    username: {
      type: GraphQLString,
    },
  }),
});
const BuildTriggerMetadataCommitInfo = new GraphQLObjectType({
  name: 'BuildTriggerMetadataCommitInfo',
  fields: () => ({
    author: {
      type: BuildTriggerMetadataCommitInfoAuthor,
    },
    committer: {
      type: BuildTriggerMetadataCommitInfoCommitter,
    },
    date: {
      type: GraphQLString,
    },
    message: {
      type: GraphQLString,
    },
    url: {
      type: GraphQLString,
    },
  }),
});

const BuildTriggerMetadata = new GraphQLObjectType({
  name: 'BuildTriggerMetadata',
  fields: () => ({
    commit: {
      type: GraphQLString,
    },
    commit_info: {
      type: BuildTriggerMetadataCommitInfo,
    },
    default_branch: {
      type: GraphQLString,
    },
    git_url: {
      type: GraphQLString,
    },
    ref: {
      type: GraphQLString,
    },
  }),
});

const BuildTrigger = new GraphQLObjectType({
  name: 'BuildTrigger',
  fields: () => ({
    service: {
      type: GraphQLString,
    },
    is_active: {
      type: GraphQLBoolean,
    },
    repository_url: {
      type: GraphQLString,
    },
    build_source: {
      type: GraphQLString,
    },
    id: {
      type: GraphQLString,
    },
    is_connected_user: {
      type: GraphQLBoolean,
    },
  }),
});

const BuildStatus = new GraphQLObjectType({
  name: 'BuildStatus',
  fields: () => ({
    total_commands: {
      type: GraphQLInt,
    },
    current_command: {
      type: GraphQLBoolean,
    },
    pull_completion: {
      type: GraphQLInt,
    },
    push_completion: {
      type: GraphQLInt,
    },
    heartbeat: {
      type: GraphQLInt,
    },
  }),
});

const Build = new GraphQLObjectType({
  name: 'Build',
  description: 'Docker build in Quay',
  fields: {
    id: globalIdField('Build'),
    display_name: {
      type: GraphQLString,
    },
    error: {
      type: GraphQLString,
    },
    is_writer: {
      type: GraphQLBoolean,
    },
    manual_user: {
      type: GraphQLString,
    },
    phase: {
      type: GraphQLString,
    },
    pull_robot: {
      type: BuildPullRobot,
    },
    repository: {
      type: BuildRepository,
    },
    resource_key: {
      type: GraphQLString,
    },
    started: {
      type: GraphQLString,
    },
    status: {
      type: BuildStatus,
    },
    subdirectory: {
      type: GraphQLString,
    },
    tags: {
      type: new GraphQLList(GraphQLString),
    },
    trigger: {
      type: BuildTrigger,
    },
    trigger_metadata: {
      type: BuildTriggerMetadata,
    },
  },
  interfaces: [nodeInterface],
});

const Tag = new GraphQLObjectType({
  name: 'Tag',
  description: 'Docker tag in Quay',
  fields: {
    id: globalIdField('Tag', obj => obj.name),
    reversion: {
      type: GraphQLBoolean,
    },
    start_ts: {
      type: GraphQLInt,
    },
    name: {
      type: GraphQLString,
    },
    docker_image_id: {
      type: GraphQLString,
    },
  },
  interfaces: [nodeInterface],
});

const {
  connectionType: BuildConnection,
} = connectionDefinitions({ nodeType: Build });
const {
  connectionType: TagConnection,
} = connectionDefinitions({ nodeType: Tag });
const {
  connectionType: ContainerConnection,
  edgeType: ContainerEdge,
} =
  connectionDefinitions({ nodeType: Container });

const User = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: globalIdField('User'),
    builds: {
      type: BuildConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromPromisedArray(getBuilds(), args),
    },
    tags: {
      type: TagConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromPromisedArray(getTags(), args),
    },
    containers: {
      type: ContainerConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromPromisedArray(getContainers(), args),
    },
  },
});

const Root = new GraphQLObjectType({
  name: 'Root',
  fields: () => ({
    viewer: {
      type: User,
      resolve: () => ({ id: 1 }),
    },
    node: nodeField,
  }),
});

async function startDockerContainer(name) {
  try {
    console.log(`Starting container ${name}...`);
    return await docker.post(`/containers/${name}/start`);
  } catch (err) {
    console.log(err.error);
    return err.error;
  }
}

const execSync = require('child_process').execSync;

async function createDockerContainer(Image, name) {
  const image = `${Image}:${name}`;
  try {
    console.log(`checking for image: ${image}...`);
    await docker.post(`/images/${Image}/json`);
  } catch (err) {
    console.log(`${image} not found. Downloading...`);
    // this is currently not working for unknown reason
    // await docker.post(`/images/create?fromImage=${image}`);
    // Reason for "http://wat" is due to https://github.com/docker/docker/issues/26099#issuecomment-256880358
    // eslint-disable-next-line max-len
    const command = `curl -v -XPOST --unix-socket /var/run/docker.sock "http:/wat/images/create?fromImage=${image}"`;
    execSync(command);
  }
  try {
    console.log(`Creating container ${name} from ${image}...`);
    const res = await docker.post('/containers/create', {
      qs: { name },
      body: {
        Image: `${Image}:${name}`,
        HostConfig: {
          PublishAllPorts: true,
        },
      },
    });
    console.log(`Created container ${name} from ${image}`);
    return res.Id;
  } catch (err) {
    console.log(err.error);
    return err.error;
  }
}

const CreateContainerMutation = mutationWithClientMutationId({
  name: 'CreateContainer',
  inputFields: {
    Image: {
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    containerEdge: {
      type: ContainerEdge,
      resolve: async ({ localContainerId }) => {
        const containers = await getContainers();
        const idx = containers.map(c => c.Id).indexOf(localContainerId);
        const node = containers[idx];
        const cursor = offsetToCursor(containers.map(x => x.id), node.id);
        return { cursor, node };
      },
    },
    viewer: {
      type: User,
      resolve: () => ({ id: 1 }),
    },
  },
  mutateAndGetPayload: async ({ Image, name }) => {
    const localContainerId = await createDockerContainer(Image, name);
    await startDockerContainer(name);
    console.log(`Started container ${name}`);
    return { localContainerId };
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createContainer: CreateContainerMutation,
  },
});

export default new GraphQLSchema({
  query: Root,
  mutation: Mutation,
});
