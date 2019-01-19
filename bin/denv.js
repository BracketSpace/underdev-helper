#!/usr/bin/env node

const fs       = require( 'fs-extra' );
const chalk    = require( 'chalk' );
const yaml     = require( 'yamljs' );
const path     = require( 'path' );
const zip      = require( 'node-zip' );
const inquirer = require( 'inquirer' );
const git      = require( 'simple-git/promise' );
const execSync = require( 'child_process' ).execSync;

const parse_volume = async function( volume ) {

	if ( await fs.lstatSync( volume[0] ).isDirectory() ) {

		if ( await git( volume[0] ).checkIsRepo() ) {

			remotes = await git( volume[0] ).getRemotes( true );
			return {
				dir   : volume[0],
				remote: remotes[0].refs.fetch
			};

		} else {
			return 'zip';
			// not repo, zip
		}

	} else {
		return 'file';
	}
	// @todo parse file

}


const dump = async function() {

	let pr_path  = process.cwd();
	let env_file = path.join( pr_path, 'env', 'environment.json' );
	let config   = {};
	let answers  = await inquirer.prompt( [
		{
		    name: 'create_snap',
		    type: 'confirm',
		    message: 'Create snapshot?'
		}
	] );

	console.log( 'Scrapping the docker-compose.yml file...' );

	config.docker_compose = yaml.load( path.join( pr_path, 'docker-compose.yml' ) );

	console.log( 'Parsing project directories...' );
	config.dirs = [];
	volumes     = config.docker_compose.services.wordpress.volumes;

	await new Promise( resolve => {

		let volumes_processed = 0;

		volumes.forEach( async ( volume ) => {

			volumes_processed++;
			volume = volume.split( ':' );

			// Check if path is not "default" and should be parsed
			if ( -1 === volume[0].indexOf( './public' ) && -1 === volume[0].indexOf( './env/' ) ) {
				console.log( await parse_volume( volume ) );
				config.dirs.push( await parse_volume( volume ) );
			}

			console.log( volumes_processed, volumes.length );

		    if ( volumes_processed === volumes.length ) {
				resolve();
		    }

		} );

	} );

// nie czeka na async foraech

	console.log( 'foo' );

	await fs.writeJson( env_file, config, { spaces: 2 } );

};

const command = async function() {

	let args = Array.prototype.slice.call( process.argv, 2 );

	switch ( args[0] ) {
        case 'dump':
        	await dump();
            break;
        default:
        	console.error( chalk.red( 'Wrong command, use `dump` or `build`' ) )
	    	process.exit( 1 );
            break;
    }

};

command();
