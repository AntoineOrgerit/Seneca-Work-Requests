const Seneca = require('seneca');
const SenecaWeb = require('seneca-web');
const Express = require('express');
const BodyParser = require('body-parser');

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
