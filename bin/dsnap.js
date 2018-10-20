#!/usr/bin/env node

const fs       = require( 'fs-extra' );
const inquirer = require( 'inquirer' );
const path     = require( 'path' );
const execSync = require( 'child_process' ).execSync;

const validate_not_empty = function( value ) {
    return ( value.trim().length !== 0 ) ? true : 'This field is required';
};

const exec_command = async function( command ) {
	execSync( `docker-compose exec wpsnapshots /snapshots.sh ${command}`, { stdio: 'inherit' });
};

const check_config = async function() {
	let config_exists = await fs.pathExists( path.join( process.cwd(), 'env', 'snapshots', 'config.json' ) );

	if ( config_exists ) {
		return;
	}

	let config_questions = [ {
	    name: 'repository',
	    type: 'input',
	    message: 'What\'s the repository name? (typically client or organization name)',
	    validate: validate_not_empty
	} ];

	const aws_config_vars = {
		key: 'AWS Access Key ID',
		secret : 'AWS Secret Access Key',
		name : 'Your Name',
		email : 'Your Email'
	};

	Object.keys( aws_config_vars ).forEach( function( variable ) {
		const question = aws_config_vars[ variable ];
		const env_var  = 'UDEV_SNAPSHOTS_' + variable.toUpperCase();

		if ( ! process.env[ env_var ] ) {
			config_questions.push( {
				name: variable,
				type: 'input',
				message: question,
				validate: validate_not_empty
			} );
		}
	} );

	let answers = await inquirer.prompt( config_questions );

	console.log( 'Configuring WP Snapshots inside Docker...' );
	exec_command( 'configure ' + answers.repository + ' --region="eu-central-1" --aws_key=' + ( process.env.UDEV_SNAPSHOTS_KEY || answers.key ) + ' --aws_secret=' + ( process.env.UDEV_SNAPSHOTS_SECRET || answers.secret ) + ' --user_name=\'' + ( process.env.UDEV_SNAPSHOTS_NAME || answers.name ) + '\' --user_email="' + ( process.env.UDEV_SNAPSHOTS_EMAIL || answers.email ) + '"' );
	exec_command( 'create-repository ' + answers.repository );
};

const snapshot = async function() {
	let args = Array.prototype.slice.call( process.argv, 2 );

	switch ( args[0] ) {
        case 'push':
            await check_config();
            // @todo: --no_scrub by default.
            await exec_command( 'push' );
            break;
        default:
	        await check_config();
            await exec_command( args.join( ' ' ) );
            break;
    }

};

snapshot();
