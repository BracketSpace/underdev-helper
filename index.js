#!/usr/bin/env node

const usage = require( 'command-line-usage' );

const sections = [
  {
    header: 'underdev',
    content: 'Set of usable aliases and scripts for WordPress development on top on Docker.'
  },
  {
    header: 'Command list',
    content: [
      { name: 'dup', summary: 'Starts docker-compose.' },
      { name: 'dupd', summary: 'Starts docker-compose in background.' },
      { name: 'ds', summary: 'Stops docker-compose.' },
      { name: 'drm', summary: 'Removes docker-compose containers.' },
      { name: 'dwp', summary: 'Executes the wp-cli command inside wordpress container. Usage: dwp core version' },
      { name: 'dset', summary: 'Sets up WordPress - cleans default content and unused plugins and themes, sets up permalinks' },
    ]
  }
];

console.log( usage( sections ) );
