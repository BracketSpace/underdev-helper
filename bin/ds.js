#!/usr/bin/env node

const execSync = require('child_process').execSync;

execSync( `docker-compose stop`, { stdio: 'inherit' });
