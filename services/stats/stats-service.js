module.exports = function StatsService() {
	const seneca = this;
	const stats_entity = require('./stats-entity');
	
	// handling stats updates
	seneca.add('role:stats, cmd:set', function(msg, respond) {
		let data = {};
		data.applicant = msg.applicant;
		data.action = msg.action;
		// calling stats entity manager
		stats_entity.set(data, function(result) {
			if (typeof result === 'string' || result instanceof String) {
				respond(null, {success: false, err: result});
			} else {
				respond(null, {success: true});
			}
		});
	});
	
	// used to send a result
	function sendResult(result, respond) {
		let response = {};
		// checking if it is an error message or not
		if (result instanceof String) {
			response.success = false;
			response.msg = result;
		} else {
			response.success = true;
			response.data = result;
		}
		respond(null, response);
	}

	// handling stats retrieve
	seneca.add('role:stats, cmd:get', function(msg, respond) {
		if(typeof msg.args.params.applicant === 'undefined') {
			stats_entity.getGlobal(function(result) {
				sendResult(result, respond);
			});
		} else {
			stats_entity.get(msg.args.params.applicant, function(result) {
				sendResult(result, respond);
			});
		}
	});

	// handling other requests
	seneca.add('role:stats, cmd:notSupported', function(msg, respond) {
		let response = {};
		response.success = false;
		response.msg = 'stats path not supported';
		respond(null, response);
	});
}