const seneca = require('seneca')();
const SenecaWeb = require('seneca-web');
const Express = require('express');
const BodyParser = require('body-parser');
const wr_entity = require('./wr-entity');

// routes used for the api
const Routes = [{
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
		},
		// 'default redirection' for not supported routes
		notSupported: {
			GET: true,
			POST: true,
			PUT: true,
			DELETE: true,
			name: ''
		}
	}
}];

seneca.use(SenecaWeb, {
  options: { parseBody: false },
  routes: Routes,
  context: Express().use(BodyParser.json()), 
  adapter: require('seneca-web-adapter-express')
});

// handling creation requests
seneca.add('role:wr, cmd:create', function(msg, respond) {
	let entity = {};
	entity.applicant = msg.args.body.applicant;
	entity.work = msg.args.body.work;
	if (msg.args.body.date != null) {
		entity.date = msg.args.body.date;
	}

	// calling wr entity manager
	wr_entity.create(entity, function(result) {
		let response = {};
		if (typeof result === 'string' || result instanceof String) {
			response.success = false;
			response.msg = result;
		} else {
			response.success = true;
			response.data = result;
		}
		respond(null, response);
	});
});

// handling retrieve requests with id
seneca.add('role:wr, cmd:retrieve', function(msg, respond) {
	let err, valid = true;

	// checking parameters
	if(msg.args.params.id === 'undefined'){
		err = 'wr id is not provided';
		valid = false;
	}
	
	if(!/^([a-zA-Z0-9]{6,})$/.test(msg.args.params.id)){
		err = 'invalid id';
		valid = false;
	}
	
	if (!valid) {
		let errResponse = {};
		errResponse.success = false;
		errResponse.msg = err;
		errResponse.data = '';
		respond(null, errResponse);
		return;
	}

	// calling wr entity manager
	wr_entity.get(msg.args.params.id, function(result) {
		let response = {};
		if (result instanceof Array) {
			response.success = true;
			response.data = result;
		} else {
			response.success = false;
			response.msg = result;
		}
		respond(null, response);
	});  
});

// handling retrieve requests without id
seneca.add('role:wr, cmd:retrieveAll', function(msg, respond) {
	// calling wr entity manager
	wr_entity.get(undefined, function(result) {
		let response = {};
		if (result instanceof Array) {
			response.success = true;
			response.data = result;
		} else {
			response.success = false;
			response.msg = result;
		}
		respond(null, response);
	});  
});

// handling update requests
seneca.add('role:wr, cmd:update', function(msg, respond) {
	let err, valid = true;
	
	// checking parameters
	if(!/^([a-zA-Z0-9]{6,})$/.test(msg.args.params.id)){
		err = 'invalid id';
		valid = false;
	}

	for (let elem in msg.args.body) {
		switch (elem) {
			case 'work': 
				break;
			case 'state': 
				if (msg.args.body['state'] != 'closed') {
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
		let errResponse = {};
		errResponse.success = false;
		errResponse.msg = err;
		errResponse.data = '';
		respond(null, errResponse);
		return;
	}

	// calling wr entity manager
	wr_entity.update(msg.args.params.id, msg.args.body, function(result) {
		let response = {};
		if (typeof result === 'string' || result instanceof String) {
			response.success = false;
			response.msg = result;
		} else {
			response.success = true;
			response.data = result;
		}
		respond(null, response);

	});
});

// handling delete requests
seneca.add('role:wr, cmd:delete', function(msg, respond) {
	let err, valid = true;
	
	// checking parameters
	if(msg.args.params.id === 'undefined'){
		err = 'wr id is not provided';
		valid = false;
	}
	
	if(!/^([a-zA-Z0-9]{6,})$/.test(msg.args.params.id)){
		err = 'invalid id';
		valid = false;
	}
	
	if (!valid) {
		let errResponse = {};
		errResponse.success = false;
		errResponse.msg = err;
		errResponse.data = '';
		respond(null, errResponse);
		return;
	}
	
	// calling wr entity manager
	wr_entity.delete(msg.args.params.id, function(result) {
		let response = {};
		if(typeof result === 'string' || result instanceof String){
			response.success = false;
			response.msg = result;
		} else {
			response.success = true;
			response.data = result;
		}
		respond(null, response);

	});
}); 

// handling other requests
seneca.add('role:wr, cmd:notSupported', function(msg, respond) {
	let response = {};
	response.success = false;
	response.msg = 'wr path not supported';
	response.data = '';
	respond(null, response);
});

// exposing micro-service
seneca.ready(() => {
  let app = seneca.export('web/context')();
  app.listen(3000);
});