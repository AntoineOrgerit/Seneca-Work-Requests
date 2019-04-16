module.exports = function WrService() {
	const seneca = this;
	const wr_entity = require('./wr-entity');
	
	function sendUniqueResult(result, action, respond) {
		let response = {};
		if (typeof result === 'string' || result instanceof String) {
			response.success = false;
			response.msg = result;
		} else {
			response.success = true;
			response.data = result;
			if(action){
				seneca.act({role: 'stats', cmd: 'set', action: action, applicant: result.applicant}, function(err, response){
					if(err){
						console.log(err);
					} else {
						if(response.success === false){
							console.log(response.err);
						}
					}
				});
			}
		}
		respond(null, response);
	}

	function checkId(msg, respond, _callback) {
		let err, valid = true;
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
		_callback();
	}

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
			sendUniqueResult(result, 'create', respond);
		});
	});

	// handling retrieve requests
	seneca.add('role:wr, cmd:retrieve', function(msg, respond) {
		checkId(msg, respond, function() {
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
	});

	// handling update requests
	seneca.add('role:wr, cmd:update', function(msg, respond) {
		checkId(msg, respond, function() {
			let err, valid = true;
			let action = null;
			for (let elem in msg.args.body) {
				switch (elem) {
					case 'work': 
						break;
					case 'state': 
						if (msg.args.body['state'] != 'closed') {
							err = 'invalid value for parameter state (can only be closed)';
							valid = false;
						} else {
							action = msg.args.body['state'];
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
				sendUniqueResult(result, action, respond);
			});
		});
	});

	// handling delete requests
	seneca.add('role:wr, cmd:delete', function(msg, respond) {
		if(msg.args.params.id === 'undefined') {
			wr_entity.delete(undefined, function(result) {
				sendArrayResult(result, respond);
			}); 
		} else {
			checkId(msg, respond, function() {
				// calling wr entity manager
				wr_entity.delete(msg.args.params.id, function(result) {
					sendUniqueResult(result, "delete", respond);
				});
			});
		}
	}); 

	// handling other requests
	seneca.add('role:wr, cmd:notSupported', function(msg, respond) {
		let response = {};
		response.success = false;
		response.msg = 'wr path not supported';
		respond(null, response);
	});
}