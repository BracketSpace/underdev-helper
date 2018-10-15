#!/usr/bin/env node

const execSync = require('child_process').execSync;

let args = Array.prototype.slice.call( process.argv, 2 ).join( ' ' );

execSync( `docker-compose up -d ${args}`, { stdio: 'inherit' });
