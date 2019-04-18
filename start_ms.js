const Seneca = require('seneca');
const SenecaWeb = require('seneca-web');
const Express = require('express');
const BodyParser = require('body-parser');
const fs = require('fs');

// checking if the app is launching in testing mode
// to create necessary disk db files
let argv = require('minimist')(process.argv.slice(2));
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

// loading configuration
require('./config/config.js');

// importing services and routes
const Routes = require('./routes');
const WrService = require('./services/wr/wr-service');
const StatsService = require('./services/stats/stats-service');

// configuration for using Express
let config = {
  options: { parseBody: false },
  routes: Routes,
  context: Express().use(BodyParser.json()), 
  adapter: require('seneca-web-adapter-express')
};

// launching app
let seneca = Seneca()
	.use(WrService)
	.use(StatsService)
	.use(SenecaWeb, config)
	.ready(() => {
		let server = seneca.export('web/context')();
		server.listen('3000', () => {
			console.log('Server started on: 3000');
			// launching tests if in testing mode
			if(global.gConfig.config_id === 'testing') {
				console.log("Launching tests... Please wait.");
				let exec = require('child_process').exec;
				exec('node tests/client_iteration4.js', function callback(error, stdout, stderr){
					// displaying results of tests and stopping the app
					if(error){
						console.log("Tests failed with the following error: " + error);
					} else {
						console.log("Tests results:\n" + stdout);
					}
					gracefullStop("end of tests");
				});
			}
		});
	});

// used to gracefully stopping the app
function gracefullStop(reason) {
	console.log( "\nGracefully shutting down from " + reason);
	seneca.close();
	process.exit(0);
}
	
// gracefully stopping the app
process.on('SIGINT', function() {
	gracefullStop("SIGINT (Ctrl-C)");
});