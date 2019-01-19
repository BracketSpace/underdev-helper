#!/usr/bin/env node

const fs       = require( 'fs-extra' );
const yaml     = require( 'write-yaml' );
const inquirer = require( 'inquirer' );
const path     = require( 'path' );
const chalk    = require( 'chalk' );
const waitOn   = require( 'wait-on' );
const execSync = require( 'child_process' ).execSync;

const validate_not_empty = function( value ) {
    return ( value.trim().length !== 0 ) ? true : 'This field is required';
};

const parse_hostname = function( value ) {
    value = value.replace( /^https?:\/\//i, '' );
    value = value.replace( /\s/i, '' );
    let parts = value.split( '/' );
    return parts[0];
};

const project = async function() {
	let args     = Array.prototype.slice.call( process.argv, 2 ).join( ' ' );
	let pr_path  = process.cwd();
	let src_path = path.join( path.dirname( path.dirname( require.main.filename ) ), 'project' );

	if ( '-f' == args ) {
		fs.emptyDir( pr_path );
	} else {
		await new Promise( resolve => {
	        fs.readdir( pr_path, function( err, files ) {
			    if ( files.length ) {
			    	console.error( chalk.red( 'Directory not empty! Please ensure this is the right dir and remove the content first or run the script with flag -f.' ) )
			    	process.exit( 1 );
		        }
		        resolve();
			} );
	    });
	}


	let config = {
		'version': '3',
	    'services': {
	    	'wordpress': {
	    		'image': 'bracketspace/wordpress:php7.2',
	    		'links': [
	    			'db:mysql',
	    			'mailhog'
	    		],
	    		'ports': [
	    			'80:80',
	    			'443:443'
	    		],
	    		'volumes': [
	                './public:/var/www/html',
	                './env/config/phpconf.ini:/usr/local/etc/php/conf.d/phpconf.ini',
	                './env/config/xdebug.ini:/usr/local/etc/php/conf.d/xdebug.ini'
	            ],
	            'environment': {
	                'WORDPRESS_DB_PASSWORD': 'docker'
	            },
	            'depends_on': [
	                'db',
	                'mailhog'
	            ]
	    	},
	    	'db': {
	    		'image': 'mysql:5.7',
	    		'ports': [
	    			'3306:3306'
	    		],
	            'environment': {
	                'MYSQL_ROOT_PASSWORD': 'docker'
	            },
	            'volumes': [
	                './database:/var/lib/mysql'
	            ],
	    	},
	    	'mailhog': {
	    		'image': 'mailhog/mailhog',
	    		'ports': [
	    			'1025:1025',
	    			'8025:8025'
	    		]
	    	}
	    }
	}

	let snapshots = {
	    'wpsnapshots': {
    		'image': '10up/wpsnapshots',
    		'links': [
    			'db:mysql'
    		],
    		'volumes': [
                './public:/var/www/html',
                './env/snapshots:/home/wpsnapshots/.wpsnapshots'
            ],
            'depends_on': [
                'db',
                'wordpress'
            ]
    	}
	};

	let network_config = {
	    'networks': {
	        'default': {
	            'external': {
	                'name': 'websites'
	            }
	        }
	    }
	};

	let questions = [ {
	    name: 'php',
	    type: 'list',
	    message: 'What version of PHP would you like to use?',
	    choices: [ '7.2', '7.1', '7.0', '5.6' ],
	    default: '7.2'
	},
	{
	    name: 'existing_network',
	    type: 'confirm',
	    message: 'Should the containers be joined to existing network?'
	},
	{
	    name: 'existing_network_name',
	    type: 'input',
	    message: 'What\'s the network name?',
	    default: 'websites',
	    validate: validate_not_empty,
	    when: function( answers ) {
	        return true === answers.existing_network;
	    }
	},
	{
	    name: 'use_snapshots',
	    type: 'confirm',
	    message: 'Use WP Snapshots?',
	    default: true
	},
	{
	    name: 'git_project',
	    type: 'confirm',
	    message: 'Would you like to initialize an empty Git repository for the whole project?',
	    default: false
	},
	{
	    name: 'git_project_remote',
	    type: 'input',
	    message: 'Provide Git remote address (empty for none)',
	    when: function( answers ) {
	        return true === answers.git_project;
	    }
	},
	{
	    name: 'git_project_initial_commit',
	    type: 'confirm',
	    message: 'Create initial commit and push?',
	    when: function( answers ) {
	        return true === answers.git_project;
	    }
	},
	{
	    name: 'git_project_flow',
	    type: 'confirm',
	    message: 'Enable git-flow with default settings?',
	    when: function( answers ) {
	        return true === answers.git_project && true === answers.git_project_initial_commit;
	    }
	},
	{
	    name: 'start_docker',
	    type: 'confirm',
	    message: 'Start Docker in background?'
	},
	{
	    name: 'setup_wordpress',
	    type: 'confirm',
	    message: 'Setup WordPress with default data and cleanup everything?',
	    when: function( answers ) {
	        return true === answers.start_docker;
	    }
	},
	{
	    name: 'hostname',
	    type: 'input',
	    message: 'What is the primary hostname for your site? (Ex. website.localhost)',
	    validate: validate_not_empty,
	    filter: parse_hostname,
	    when: function( answers ) {
	        return true === answers.setup_wordpress;
	    }
	},
	{
	    name: 'site_name',
	    type: 'input',
	    message: 'What is the website name?',
	    validate: validate_not_empty,
	    default: function( answers ) {
            return answers.hostname;
        },
	    when: function( answers ) {
	        return true === answers.setup_wordpress;
	    }
	},
	{
	    name: 'setup_wordpress_ssl',
	    type: 'confirm',
	    message: 'Setup WordPress on HTTPS?',
	    when: function( answers ) {
	        return true === answers.setup_wordpress;
	    }
	},
	{
	    name: 'setup_wordpress_dev',
	    type: 'confirm',
	    message: 'Prepare WordPress for development?',
	    when: function( answers ) {
	        return true === answers.start_docker && true === answers.setup_wordpress;
	    }
	} ];

	let answers = await inquirer.prompt( questions );

	/**
	 * Initialize Git repo
	 */
	if ( true === answers.git_project ) {
		console.log( 'Initializing empty Git repository...' );
		execSync( `git init`, { stdio: 'inherit' });
		console.log( chalk.green( 'Done!' ) );

		if ( answers.git_project_remote.length > 0 ) {
			console.log( 'Adding remote...' );
			execSync( `git remote add origin ${answers.git_project_remote}`, { stdio: 'inherit' });
			console.log( chalk.green( 'Done!' ) );
		}
	}

	/**
	 * Copy project files
	 */
	console.log( 'Copying required files...' );
    await fs.copy( src_path, pr_path );
    console.log( chalk.green( 'Files has been copied!' ) );

    /**
     * Generate docker-compose file
     */
    console.log( 'Creating your environment configuration...' );

    config.services.wordpress.image = 'bracketspace/wordpress:php' + answers.php;

    if ( true === answers.existing_network ) {
    	network_config.networks.default.external.name = answers.existing_network_name;
    	config = Object.assign( config, network_config );
    }

    if ( true === answers.use_snapshots ) {
    	config.services = Object.assign( config.services, snapshots );
    }

    console.log( chalk.green( 'All config set!' ) );

    /**
     * Save docker-compose file
     */
    console.log( 'Saving docker-compose.yml file...' );

    await new Promise( resolve => {
        yaml( path.join( pr_path, 'docker-compose.yml' ), config, { 'lineWidth': 500 }, function( err ) {
            if ( err ) {
                console.log( err );
            }
            console.log( chalk.green( 'docker-compose.yml file created!' ) );
            resolve();
        });
    });

    /**
	 * Commit
	 */
	if ( true === answers.git_project ) {
		console.log( 'Commiting...' );
		execSync( `git add -A`, { stdio: 'inherit' });
		execSync( `git commit -m "project init"`, { stdio: 'inherit' });
		console.log( chalk.green( 'Done!' ) );

		if ( answers.git_project_remote.length > 0 ) {
			console.log( 'Pushing to remote...' );
			execSync( `git push -u origin master`, { stdio: 'inherit' });
			console.log( chalk.green( 'Pushed successfully!' ) );
		}

		if ( true === answers.git_project_flow ) {
			console.log( 'Enable git-flow...' );
			execSync( `git flow init -fd`, { stdio: 'inherit' });
			console.log( chalk.green( 'Git-flow activated!' ) );
		}
	}

	/**
	 * Start Docker
	 */
	if ( true === answers.start_docker ) {
	 	console.log( 'Starting Docker...' );
		execSync( `dupd`, { stdio: 'inherit' });
		console.log( chalk.green( 'Yo, look! It\'s alive!' ) );
	}

	/**
	 * Setup WordPress
	 */
	if ( true === answers.start_docker && true === answers.setup_wordpress ) {
		console.log( 'Waiting for WordPress...' );
		await waitOn( {
			resources: [
				'http://localhost/wp-admin/install.php',
			],
			delay: 3000,
			interval: 400,
			timeout: 30000
		} );

		let wp_url = answers.setup_wordpress_ssl ? 'https://' + answers.hostname : 'http://' + answers.hostname;

		console.log( 'Installing WordPress...' );
		execSync( `dwp core install --url=${wp_url} --title=${answers.site_name} --admin_user=admin --admin_password=admin --admin_email=admin@${answers.hostname} --skip-email`, { stdio: 'inherit' });
		console.log( chalk.green( 'Your login details are admin:admin.' ) );

		console.log( 'Setting up WordPress...' );
		execSync( `dset`, { stdio: 'inherit' });
		console.log( chalk.green( 'All clean like a... ekhem.' ) );
	}

	/**
	 * Setup development settings
	 */
	if ( true === answers.start_docker && true === answers.setup_wordpress && true === answers.setup_wordpress_dev ) {
		console.log( 'Preparing WordPress for development...' );
		execSync( `dwp config set WP_DEBUG true --raw`, { stdio: 'inherit' });
		execSync( `dwp config set WP_DEBUG_LOG true --raw --type=constant`, { stdio: 'inherit' });
		execSync( `dwp plugin install query-monitor --activate`, { stdio: 'inherit' });
		console.log( chalk.green( 'Handy-dandy!' ) );
	}

};

project();
