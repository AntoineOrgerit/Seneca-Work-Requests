var seneca = require('seneca')();
var entity = require('wr-entity.js')();

// *** implementation of CRUD services ***

//Create
seneca.add('role:wr, cmd:create', function(receivedMsg, respond) {
  let result = entity.create(receivedMsg);

  let success, msg, data;

  if ("entity$" in result) {
    success = true;
    msg = '';
    data = result;
  } else {
    success = false;
    msg = result
    data = '';
  }

  respond(null, jsonic(success, msg, data));

});

//Retrieve
seneca.add('role:wr, cmd:retrieve', function(msg, respond) {
  
});

//Update
seneca.add('role:wr, cmd:update', function(msg, respond) {
  
});

//Delete
seneca.add('role:wr, cmd:delete', function(msg, respond) {
  
});