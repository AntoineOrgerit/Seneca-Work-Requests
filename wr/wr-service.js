var seneca = require('seneca')();
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
		retrieveAll: {
			GET: true,
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
seneca.add('role:wr, cmd:create', function(msg, respond) {

	let entity = {};

	entity.applicant = msg.args.body.applicant;
	entity.work = msg.args.body.work;
	if (msg.args.body.date != null) {
		entity.date = msg.args.body.date;
	} else {
		entity.date = Date(Date.now()).toString;
	}

	wr_entity.create(entity, function(result) {

		let response = {};

		if (typeof result === 'string' || result instanceof String) {
			response.success = false;
			response.msg = result;
			response.data = '';
		} else {
			response.success = true;
			response.msg = '';
			response.data = result;
		}
		respond(null, response);

	});
});

//Retrieve
seneca.add('role:wr, cmd:retrieve', function(msg, respond) {

	wr_entity.get(msg.args.params.id, function(result) {

		let response = {};

		if (result instanceof Array) {
			response.success = true;
			response.msg = '';
			response.data = result;
		} else {
			response.success = false;
			response.msg = result;
			response.data = '';
		}

		respond(null, response);

	});  
});

seneca.add('role:wr, cmd:retrieveAll', function(msg, respond) {

	wr_entity.get(undefined, function(result) {

		let response = {};

		if (result instanceof Array) {
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

//Update
seneca.add('role:wr, cmd:update', function(msg, respond) {
	
	let errResponse, err, valid = true;

	for (let elem in msg.args.body) {
		switch (elem) {

			case 'work': 
				break;
			case 'state': 
				if (msg.args.body["state"] != "closed") {
					err = 'invalid value for parameter state (can only be closed)';
					valid = false;
				}
				break;
			default: 
				err = 'invalid parameter';
				valid = false;
		}
	}

	if (!valid) {
		errResponse = {};
		errResponse.success = false;
		errResponse.msg = err;
		errResponse.data = '';

		respond(null, errResponse);
		return;
	}

	wr_entity.update(msg.args.params.id, msg.args.body, function(result) {

		let response = {};

		if (typeof result === 'string' || result instanceof String) {
			response.success = false;
			response.msg = result;
			response.data = '';
		} else {
			response.success = true;
			response.msg = '';
			response.data = result;
		}

		respond(null, response);

	});
});

//Delete
seneca.add('role:wr, cmd:delete', function(msg, respond) {
	
	wr_entity.delete(msg.args.params.id, function(result) {

		let response = {};

		if(result === null){
			response.success = true;
			response.msg = '';
			response.data = '';
		} else {
			response.success = false;
			response.msg = result;
			response.data = '';
		}

		respond(null, response);

	});
}); 

seneca.ready(() => {
  let app = seneca.export('web/context')();
  app.listen(3000);
});
