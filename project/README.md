# Getting started #

Please read this section espacially if you are unfamiliar with Docker or Gulp or you have not installed them already.

## Docker ##

### Installation ###

To install Docker itself please download and install package from [docker.com](https://www.docker.com/products/overview).

### Usage ###

To boot Docker, run command from project's root directory:

```
#!bash

docker-compose up
```

After finished work it's good to stop all project's containers with command:

```
#!bash

docker-compose stop
```

While container is working you can use WP-CLI commands, like this:

```
#!bash

docker-compose exec --user www-data wordpress wp --version
```

## Gulp ##

### Installation ###

You need node.js, npm and gulp installed on your machine globally. Too install Gulp follow [this guide](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md).

To install project dependencies run command:

```
#!bash

npm install
```

### Usage ###

Run Gulp default task with command:

```
#!bash

gulp
```

It will:

* Process SASS files
* Process JS files
* watch CSS, JS and PHP files
* boot up Browser Sync

# Developement #

Please use [git-flow](http://danielkummer.github.io/git-flow-cheatsheet/) with default settings.

If you want to use plugin or theme which is available in WordPress.org repository install it as a dependency with [WP-CLI](http://wp-cli.org/commands/) in `/wp.sh` file. Please do not push them to repository nor map them to `/plugins` or `/themes` directory.

If you want to start new plugin or theme please include it in `docker-compose.yml`.

After getting feature done please push them with `git flow feature publish your-name` and create new Pull Request to `develop` branch.

# Repository stucture #

* `/` - root directory where all enviroment files resides
* `/config/` - environment configs
* `/public/` - not editable, ignored files, contains WordPress core
* `/plugins/` - contains project plugins in directories mapped to specific ones in `/public/wp-content/plugins/`
* `/themes/` - contains project themes in directories mapped to specific ones in `/public/wp-content/themes/`
* `/docker-compose.yml` - Docker project configuration file
