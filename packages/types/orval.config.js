const fs = require('fs');
const path = require('path');

module.exports = {
  takeaseat: {
    output: {
      target: './src/generated/index.ts',
      client: 'fetch',
      schemas: './src/generated/models',
      mock: false,
    },
    input: {
      target: path.resolve(__dirname, '../../openapi.yaml'),
    },
    hooks: {
      afterAllFilesWrite: ['prettier --write'],
    },
  },
};
