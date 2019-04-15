var seneca = require('seneca')();
seneca.use('seneca-repl', {port: 1021});
var SenecaWeb = require('seneca-web');
var Express = require('express');
var BodyParser = require('body-parser');
var wr_entity = require('./wr-entity');

var Routes = [{
	pin: 'role:wr,cmd:*',
	prefix : '/api/wr',
	map: {
		create: {
		    POST: true,
		    name: ''
		},
		retrieve: {
			GET: true,
			name: '',
			suffix: '/:id'
		},
		update: {
			PUT: true,
			name: '',
			suffix: '/:id'
		},
		delete: {
			DELETE: true,
			name: '',
			suffix: '/:id'
		}
	}
}];

seneca.use(SenecaWeb, {
  options: { parseBody: false },
  routes: Routes,
  context: Express().use(BodyParser.json()), 
  adapter: require('seneca-web-adapter-express')
});

//Create
seneca.add('role:wr, cmd:create', function(receivedMsg, respond) {
	let entity = {};
	entity.applicant = receivedMsg.applicant;
	entity.work = receivedMsg.work;
	wr_entity.create(entity, function(result) {
		let response = {};
		if ("entity$" in result) {
			response.success = true;
			response.msg = '';
			response.data = result;
		} else {
			response.success = false;
			response.msg = result
			response.data = '';
		}
		respond(null, response);
	});
});

//Retrieve
seneca.add('role:wr, cmd:retrieve', function(msg, respond) {
  
});

//Update
seneca.add('role:wr, cmd:update', function(msg, respond) {
  
});

//Delete
seneca.add('role:wr, cmd:delete', function(msg, respond) {
  
});

seneca.ready(() => {
  let app = seneca.export('web/context')()
  app.listen(3000)
});