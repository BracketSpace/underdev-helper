#!/usr/bin/env node

const execSync = require('child_process').execSync;

execSync( `dwp rewrite structure /%postname%/`, { stdio: 'inherit' });
execSync( `dwp site empty --yes`, { stdio: 'inherit' });
execSync( `dwp plugin delete hello akismet`, { stdio: 'inherit' });
execSync( `dwp theme delete twentyfifteen twentysixteen`, { stdio: 'inherit' });
execSync( `dwp widget delete search-2 recent-posts-2 recent-comments-2 archives-2 categories-2 meta-2`, { stdio: 'inherit' });
