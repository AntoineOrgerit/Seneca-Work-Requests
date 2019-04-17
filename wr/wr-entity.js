const seneca = require('seneca')();

// required for storage
const entities = require('seneca-entity');
seneca.use(entities);

//required for file search
const Minisearch = require('minisearch');

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

// extracts all the wr matching the id list
function getEntitiesFromJson(json, _callback) {
	let wr_entity = seneca.make$('wr_entity');
	let IDs = [];
	for (var wr in json) {
		IDs.push(json[wr].id);
	}
	wr_entity.list$(function(err, entities){
		let WRs = []
		for (var entity in entities) {
			if (IDs.includes(entities[entity].id)) 
				WRs.push(entities[entity]);
		}
		_callback(WRs);
	});
}

// handling retrieve of all elements containing the term
exports.search = function(term, _callback) {
	let wr_entity = seneca.make$('wr_entity');
	let minisearch = new Minisearch({
		fields : ['id', 'applicant', 'work', 'date', 'state'],
		tokenize : (string, _fieldname) => string.split(/[^0-9a-zA-Z-]+/u)
	});
	wr_entity.list$(function(err, entities) {
		minisearch.addAll(entities);
		let resultSearch = minisearch.search(term);
		if(err) {
			_callback(err);
		} else {
			if (resultSearch.length === 0) {
				_callback('search returned nothing')
			} else {
				getEntitiesFromJson(resultSearch, _callback);
			}
		}
	});
}

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
	// checking if we delete one or more wr
	if(typeof id === 'undefined'){
		wr_entity.list$(function(err, entities) {
			if(err) {
				_callback(err);
			} else {
				let deleted = [];
				for(var i in entities) {
					if(entities[i].state !== 'closed') {
						wr_entity.remove$(entities[i].id, function(err){
							if(err) {
								_callback(err);
								return;
							}
						});
						deleted.push(entities[i]);
					}
				}
				_callback(deleted);
			}
		});
	} else {
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
	}
};