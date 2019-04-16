const seneca = require('seneca')();

// required for storage
const entities = require('seneca-entity');
seneca.use(entities);

// storage in local json files for reuse
// to uncomment if required for usage
/*const path = require('path');
seneca.use('jsonfile-store', {folder: path.join(__dirname, '../db/stats')});*/

// handling wr stats modifications
exports.set = function(data, _callback) {
	var stats_entity = seneca.make$('stats_entity');
	// checking if the stats for the applicant exist
	stats_entity.list$({applicant: data.applicant}, function(err, entities) {
		if(err) {
			_callback(err);
		} else {
			// if the stats of the application do not exist, we create them if the 'create' action is sent
			if(entities.length === 0) {
				switch (data.action) {
					case 'create':
						var entity = {};
						entity.applicant = data.applicant;
						entity.stats_wr_created = 1;
						entity.stats_wr_opened = 1;
						entity.stats_wr_closed = 0;
						// saving the applicant stats
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
			// if the stats of the applicant exist, we update them depending on the action
			} else {
				var entity = entities[0];
				switch (data.action) {
					case 'create': 
						entity.stats_wr_created = entity.stats_wr_created + 1;
						entity.stats_wr_opened = entity.stats_wr_opened + 1;
						// update
						stats_entity.save$(entity, function(err, result){
							if(err) {
								_callback(err);
							} else {
								_callback(result);
							}
						});
						break;
					case 'delete':
						entity.stats_wr_opened = entity.stats_wr_opened - 1;
						// update
						stats_entity.save$(entity, function(err, result){
							if(err) {
								_callback(err);
							} else {
								_callback(result);
							}
						});
						break;
					case 'close': 
						entity.stats_wr_opened = entity.stats_wr_opened - 1;
						entity.stats_wr_closed = entity.stats_wr_closed + 1;
						// update
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
	// checking if we want global stats of one applicant stats
	if(typeof applicant !== 'undefined') {
		stats_entity.list$({applicant: applicant}, function(err, entities) {
			if(err) {
				_callback(err);
			} else {
				// sending one applicant stats
				_callback(entities[0]);
			}
		});
	} else {
		stats_entity.list$(function(err, entities) {
			if(err) {
				_callback(err);
			} else {
				// sending global stats
				let stats = {};
				stats.global_stats_wr_created = 0;
				stats.global_stats_wr_opened = 0;
				stats.global_stats_wr_closed = 0;
				for(var i in entities){
					stats.global_stats_wr_created = stats.global_stats_wr_created + entities[i].stats_wr_created;
					stats.global_stats_wr_opened = stats.global_stats_wr_opened + entities[i].stats_wr_opened;
					stats.global_stats_wr_closed = stats.global_stats_wr_closed + entities[i].stats_wr_closed;
				}
				_callback(stats);
			}
		});
	}
};