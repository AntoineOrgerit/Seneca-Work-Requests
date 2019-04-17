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
			console.log('Server started on: 3000');
			// launching tests in testing mode
			if(global.gConfig.config_id === 'testing') {
				console.log("Launching tests... Please wait.");
				var exec = require('child_process').exec;
				exec('node tests/client_iteration4.js', function callback(error, stdout, stderr){
					if(error){
						console.log("Tests failed with the following error: " + error);
					} else {
						console.log("Tests results:\n" + stdout);
					}
					seneca.close();
					process.exit(0);
				});
			}
		});
	});
	
// gracefully stopping the app
process.on('SIGINT', function() {
	console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
	seneca.close();
	process.exit(0);
});