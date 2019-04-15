var seneca = require('seneca')();
var entities = require('seneca-entity');

seneca.use(entities);
var wr_entity = seneca.make$('wr_entity');

exports.create = function(entity, _callback) {
	console.log(entity);
	entity.state = 'created';
	wr_entity.save$(entity, function(err, result){
		console.log(err);
		console.log(result);
		if(err) {
			_callback(err);
		} else {
			_callback(result);
		}
	});
};

exports.get = function(id) {
	if(typeof id !== 'undefined'){
		wr_entity.list$({id: id}, function(err, entity){
			if(err) {
				return err;
			} else {
				return entity;
			}
		});
	} else {
		wr_entity.list$(function(err, entities) {
			if(err) {
				return err;
			} else {
				return entities;
			}
		});
	}
};

exports.update = function(id, fields) {
	wr_entity.load$(id, function(err, existing_entity) {
		if(err) {
			return 'wr not found';
		} else {
			if(typeof existing_entity.state !== 'undefined' && existing_entity.state === 'closed') {
				return 'wr is already closed';
			} else {
				for(var key in fields){
					existing_entity[key] = fields[key];
				}
				wr_entity.save$(existing_entity, function(err, result){
					if(err) {
						return err;
					} else {
						return result;
					}
				});
			}
		}
	});
};

exports.delete = function(id) {
	wr_entity.load$(id, function(err, existing_entity) {
		if(err) {
			return 'wr not found';
		} else {
			if(typeof existing_entity.state !== 'undefined' && existing_entity.state === 'closed') {
				return 'wr is already closed';
			} else {
				wr_entity.remove$(id, function(err){
					if(err) {
						return err;
					} else {
						return null;
					}
				});
			}
		}
	});
};

