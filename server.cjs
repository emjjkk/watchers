const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());
require('./.next/standalone/server.js');