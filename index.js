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
			{ name: 'dpr', summary: 'Creates new project.' },
			{ name: 'dup', summary: 'Starts docker-compose.' },
			{ name: 'dupd', summary: 'Starts docker-compose in background.' },
			{ name: 'ds', summary: 'Stops docker-compose.' },
			{ name: 'drm', summary: 'Removes docker-compose containers.' },
			{ name: 'dd', summary: 'Stops and removes docker-compose containers.' },
			{ name: 'dwp', summary: 'Executes the wp-cli command inside wordpress container. Usage: dwp core version' },
			{ name: 'dset', summary: 'Sets up WordPress - cleans default content and unused plugins and themes, sets up permalinks' },
			{ name: 'dsnap', summary: 'Handles WP Snapshots. You can use without explicit configuration, ie: dsnap push' },
		]
	}
];

console.log( usage( sections ) );
