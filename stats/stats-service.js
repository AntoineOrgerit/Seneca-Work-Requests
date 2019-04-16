module.exports = function StatsService() {
	const seneca = this;
	const stats_entity = require('./stats-entity');
	
	seneca.add('role:stats, cmd:set', function(msg, respond) {
		console.log("in set");
		let data = {};
		data.applicant = msg.applicant;
		data.action = msg.action;
		stats_entity.set(data, function(result) {
			console.log("result set: " + result);
			if (typeof result === 'string' || result instanceof String) {
				respond(null, {sucess: false, err: result});
			} else {
				respond(null, {sucess: true});
			}
		});
	});

	seneca.add('role:stats, cmd:get', function(msg, respond) {
		console.log("get request received");
		// calling wr entity manager
		stats_entity.get(msg.args.params.applicant, function(result) {
			//console.log(result);
			let response = {};
			if (result instanceof String) {
				response.success = false;
				response.msg = result;
			} else {
				response.success = true;
				response.data = result;
			}
			//console.log(response);
			respond(null, response);
		});
	});

	// handling other requests
	seneca.add('role:stats, cmd:notSupported', function(msg, respond) {
		console.log("not supported");
		let response = {};
		response.success = false;
		response.msg = 'stats path not supported';
		respond(null, response);
	});
}