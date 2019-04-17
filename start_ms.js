const Seneca = require('seneca');
const SenecaWeb = require('seneca-web');
const Express = require('express');
const BodyParser = require('body-parser');
const fs = require('fs');

// checking if the app is launching in testing mode
var argv = require('minimist')(process.argv.slice(2));
if(typeof argv.test !== 'undefined') {
	process.env.NODE_ENV = 'testing';
} else {
	if (!fs.existsSync('./db')) {
		fs.mkdirSync('./db');
	}
	if (!fs.existsSync('./db/wr')) {
		fs.mkdirSync('./db/wr');
	}
	if (!fs.existsSync('./db/stats')) {
		fs.mkdirSync('./db/stats');
	}
}

// loading configurations
require('./config/config.js');

// importing services and routes
const Routes = require('./routes');
const WrService = require('./wr/wr-service');
const StatsService = require('./stats/stats-service');

// configuration for using Express
var config = {
  options: { parseBody: false },
  routes: Routes,
  context: Express().use(BodyParser.json()), 
  adapter: require('seneca-web-adapter-express')
};

// launching app
var seneca = Seneca()
	.use(WrService)
	.use(StatsService)
	.use(SenecaWeb, config)
	.ready(() => {
		var server = seneca.export('web/context')();
		server.listen('3000', () => {
			console.log('Server started on: 3000')
		});
	});
	
// gracefully stopping the app
process.on('SIGINT', function() {
	console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
	seneca.close();
	process.exit(1);
});