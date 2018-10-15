#!/usr/bin/env node

const execSync = require('child_process').execSync;

execSync( `docker-compose rm -f`, { stdio: 'inherit' });
