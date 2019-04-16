const seneca = require('seneca')();

// required for storage
const entities = require('seneca-entity');
seneca.use(entities);

// storage in local json files for reuse
// to uncomment if required for usage
/*const path = require('path');
seneca.use('jsonfile-store', {folder: path.join(__dirname, '../db/wr')});*/

// handling creation of an element in the storage
exports.create = function(entity, _callback) {
	entity.state = 'created';
	var wr_entity = seneca.make$('wr_entity');
	wr_entity.save$(entity, function(err, result){
		if(err) {
			_callback(err);
		} else {
			_callback(result);
		}
	});
};

// handling retrieve of one or all element(s) from the storage
exports.get = function(id, _callback) {
	var wr_entity = seneca.make$('wr_entity');
	if(typeof id !== 'undefined'){
		wr_entity.list$({id: id}, function(err, entity){
			if(err) {
				_callback(err);
			} else {
				_callback(entity);
			}
		});
	} else {
		wr_entity.list$(function(err, entities) {
			if(err) {
				_callback(err);
			} else {
				_callback(entities);
			}
		});
	}
};

// handling update element of the storage
exports.update = function(id, fields, _callback) {
	var wr_entity = seneca.make$('wr_entity');
	wr_entity.load$(id, function(err, existing_entity) {
		if(err) {
			_callback('wr not found');
		} else {
			if(typeof existing_entity.state !== 'undefined' && existing_entity.state === 'closed') {
				_callback('wr is already closed');
			} else {
				for(var key in fields){
					existing_entity[key] = fields[key];
				}
				wr_entity.save$(existing_entity, function(err, result){
					if(err) {
						_callback(err);
					} else {
						_callback(result);
					}
				});
			}
		}
	});
};

// handling delete element from the storage
exports.delete = function(id, _callback) {
	var wr_entity = seneca.make$('wr_entity');
	wr_entity.load$(id, function(err, existing_entity) {
		if(err) {
			_callback('wr not found');
		} else {
			if(typeof existing_entity.state !== 'undefined' && existing_entity.state === 'closed') {
				_callback('wr is already closed');
			} else {
				wr_entity.remove$(id, function(err){
					if(err) {
						_callback(err);
					} else {
						_callback(existing_entity);
					}
				});
			}
		}
	});
};