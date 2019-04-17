module.exports = function WrService() {
	const seneca = this;
	const wr_entity = require('./wr-entity');
	
	// used to send a unique result (i.e. a unique wr, not a set of wr)
	function sendUniqueResult(result, action, respond) {
		let response = {};
		// checking if it is an error message or not
		if (typeof result === 'string' || result instanceof String) {
			response.success = false;
			response.msg = result;
			respond(null, response);
		} else {
			response.success = true;
			response.data = result;
			if(action){
				// updating stats
				seneca.act({role: 'stats', cmd: 'set', action: action, applicant: result.applicant}, function(err, res){
					if(err){
						response.success = false;
						response.msg = err;
						respond(null, response);
					} else {
						if(res.success === false){
							respond(null, res);
						} else {
							respond(null, response);
						}
					}
				});
			} else {
				respond(null, response);
			}
		}
	}

	// used to check if a valid id has been given in the URL
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

	function isJsonEmpty(jsonObject) {
		for (let key in jsonObject) 
			if (jsonObject.hasOwnProperty(key))
				return false;
		return true;
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
		if (isJsonEmpty(msg.args.query)) {
			// no query params means a regular retrieve command
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
		} else {
			// presence of query params, expecting a content-based search
			let term = msg.args.query.search;
			let response = {};
			if(typeof msg.args.params.id !== 'undefined') {
				response.success = false;
				response.msg = 'concurrent use of id and search term'
				respond(null, response);
			} else {
				if(msg.args.query.hasOwnProperty('search')) {
					if(term === '') {
						response.success = false;
						response.msg = 'search param is empty';
						respond(null, response);
					} else 
						wr_entity.search(term, function(result) {
							if (result instanceof Array) {
								response.success = true;
								response.data = result;
							} else {
								response.success = false;
								response.msg = result;
							}
							respond(null, response);
						});
				} else {
					response.success = false;
					response.msg = 'can only take "search" param';
					respond(null, response);
				}
			}
		}
	});

	// handling update requests
	seneca.add('role:wr, cmd:update', function(msg, respond) {
		checkId(msg, respond, function() {
			// checking if the content to update is valid
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
							action = "close";
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
		// checking if we want to delete many or one wr
		if(typeof msg.args.params.id === 'undefined') {
			// calling wr entity manager
			wr_entity.delete(undefined, function(result) {
				let response = {};
				// checking if the result is not an error message
				if (typeof result === 'string' || result instanceof String) {
					response.success = false;
					response.msg = result;
					respond(null, response);
				} else {
					response.success = true;
					response.data = result;
					for(var i in result){
						// updating stats
						seneca.act({role: 'stats', cmd: 'set', action: "delete", applicant: result[i].applicant}, function(err, res){
							if(err){
								response.success = false;
								response.msg = err;
								respond(null, response);
							} else {
								if(response.success === false){
									respond(null, res);
								} else {
									respond(null, response);
								}
							}
						});
					}
				}
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