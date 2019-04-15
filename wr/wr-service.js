var seneca = require('seneca')();
seneca.use('seneca-repl', {port: 1021});
var wr_entity = require('./wr-entity');
var jsonic = require('jsonic');

// *** implementation of CRUD services ***

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