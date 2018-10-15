#!/usr/bin/env node

const execSync = require('child_process').execSync;

let ttyFlag = process.stdin.isTTY ? '' : '-T';
let args    = Array.prototype.slice.call( process.argv, 2 ).join( ' ' );

execSync( `docker-compose exec ${ttyFlag} --user www-data wordpress wp ${args}`, { stdio: 'inherit' });
