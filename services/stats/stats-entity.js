const seneca = require('seneca')();

// required for storage
const entities = require('seneca-entity');
seneca.use(entities);

// storage in local json files for reuse if in production
const path = require('path');
if(global.gConfig.config_id === 'production'){
	seneca.use('jsonfile-store', {folder: path.join(__dirname, '../../db/stats')});
}

// used to create stats for an applicant
function createStatsForApplicant(applicant, _callback){
	var stats_entity = seneca.make$('stats_entity');
	let entity = {};
	entity.applicant = applicant;
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
}

// used to updare stats for an applicant
function updateStatsForApplicant(entity, action, _callback) {
	var stats_entity = seneca.make$('stats_entity');
	switch (action) {
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

// handling wr stats modifications
exports.set = function(data, _callback) {
	var stats_entity = seneca.make$('stats_entity');
	// checking if the stats for the applicant exist
	stats_entity.list$({applicant: data.applicant}, function(err, entities) {
		if(err) {
			_callback(err);
		} else {
			// if the stats of the applicant do not exist, we create them if the 'create' action is sent
			if(entities.length === 0) {
				if(data.action === 'create') {
					createStatsForApplicant(data.applicant, _callback);
				} else {
					_callback('stats do not exists for this applicant');
				}
			// if the stats of the applicant exist, we update them depending on the action
			} else {
				updateStatsForApplicant(entities[0], data.action, _callback);
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
			// sending one applicant stats
			_callback(entities[0]);
		}
	});
};

// handling retrieve of global stats
exports.getGlobal = function(_callback) {
	var stats_entity = seneca.make$('stats_entity');
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