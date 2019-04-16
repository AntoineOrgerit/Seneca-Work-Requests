const seneca = require('seneca')();

// required for storage
const entities = require('seneca-entity');
seneca.use(entities);

// storage in local json files for reuse
// to uncomment if required for usage
/*const path = require('path');
seneca.use('jsonfile-store', {folder: path.join(__dirname, '../db/stats')});*/

exports.set = function(data, _callback) {
	var stats_entity = seneca.make$('stats_entity');
	stats_entity.list$({applicant: data.applicant}, function(err, entities) {
		if(err) {
			_callback(err);
		} else {
			if(entities.length === 0) {
				switch (data.action) {
					case 'create':
						var entity = {};
						entity.applicant = data.applicant;
						entity.created = 1;
						entity.opened = 1;
						entity.closed = 0;
						stats_entity.save$(entity, function(err, result){
							if(err) {
								_callback(err);
							} else {
								_callback(result);
							}
						});
						break;
					default:
						_callback('stats do not exists for this applicant');
				}
			} else {
				var entity = entities[0];
				switch (data.action) {
					case 'create': 
						entity.created = entity.created + 1;
						entity.opened = entity.opened + 1;
						stats_entity.save$(entity, function(err, result){
							if(err) {
								_callback(err);
							} else {
								_callback(result);
							}
						});
						break;
					case 'delete':
						entity.created = entity.created - 1;
						entity.opened = entity.opened - 1;
						stats_entity.save$(entity, function(err, result){
							if(err) {
								_callback(err);
							} else {
								_callback(result);
							}
						});
						break;
					case 'close': 
						entity.opened = entity.opened - 1;
						entity.closed = entity.closed - 1;
						stats_entity.save$(entity, function(err, result){
							if(err) {
								_callback(err);
							} else {
								_callback(result);
							}
						});
						break;
					default: 
						_callback('stats action not supported');
				}
			}
		}
	});
}

// handling retrieve of one applicant wr stats
exports.get = function(applicant, _callback) {
	var stats_entity = seneca.make$('stats_entity');
	stats_entity.list$({applicant: applicant}, function(err, entities) {
		if(err) {
			_callback(err);
		} else {
			_callback(entities[0]);
		}
	});
};