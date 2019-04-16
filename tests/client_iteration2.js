'use strict'

const {expect} = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

// test client
const Restify = require('restify-clients');
const client = Restify.createJsonClient({
    url: 'http://localhost:3000'
});

// test data...
let paulWR = {
    applicant: "paul",
    work: "PC update",
	date: "25-04-2019"
};
let pierreWR = {
    applicant: "pierre",
    work: "PC configuration",
	date: "22-06-2019"
};

// function used to make asynchronous calls
function makePromiseRequest(request, route, arg) {
    var args = [route];
    var i = 1;
    // the number of arguments depends on the type of the request (only for POST and PUT)
    if (arg !== undefined) {
        args[1] = arg
        i++;
    }
    return new Promise(resolve => {
        args[i] = (err, req, res, result) => {
            resolve(result);
        };
        request.apply(client, args);
    });
}

lab.experiment('Work Request application -', () => {
	// testing creation
    lab.test('Creating a wr from Paul', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', paulWR);
        expect(result).to.not.be.null();
        expect(result.success).to.be.true();
        // for creation (post) we use 'include' because fields are added
        expect(result.data).to.include(paulWR);
        expect(result.data.id).to.not.be.undefined();
        expect(result.data.state).to.be.equals('created');
        paulWR = result.data;
    });

	// testing retrieve of Paul
    lab.test('Retrieving Paul with his id', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/' + paulWR.id);
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

	// testing update of work item
    lab.test('Updating Paul wr work', async () => {
        let newWorkItem = 'PC reinstall';
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"work": newWorkItem});
        expect(result.success).to.be.true();
        paulWR.work = newWorkItem;
        expect(result.data).to.be.equals(paulWR);
    });

	// testing update of state
    lab.test('Updating Paul wr state to "closed"', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"state": "closed"});
        expect(result.success).to.be.true();
        paulWR.state = 'closed';
        expect(result.data).to.be.equals(paulWR);
    });

	// testing update of closed wr
    lab.test('Trying to update Paul wr work after being closed', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"work": "PC reinstall"});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr is already closed');
    });
	
	// testing delete of closed wr
    lab.test('Trying to delete Paul closed wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/' + paulWR.id);
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr is already closed');
    });

	// testing creation of Pierre
    lab.test('Creating a wr from pierre', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', pierreWR);
        expect(result.success).to.be.true();
        expect(result.data).to.include(pierreWR);
        pierreWR = result.data;
    });
	
	// testing unique ids
	lab.test('Checking different ids for Paul and Pierre', async () => {
        expect(paulWR.id).to.not.be.equals(pierreWR.id);
    });

	// testing retrieve of all wr
    lab.test('Retrieving all wr', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr');
        expect(result.success).to.be.true();
        // tests inclusion in both directions to determine equality
        expect(result.data).to.include([paulWR, pierreWR]);
        expect([paulWR, pierreWR]).to.include(result.data);
    });

	// testing delete of opened wr
    lab.test('Deleting Pierre opened wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/' + pierreWR.id);
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals(pierreWR);
    });

	// testing update with wrong id
    lab.test('Trying to update with a dummy id', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/_______', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('invalid id');
    });

	// testing update without id
    lab.test('Trying to update without id', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr path not supported');
    });

    // testing update with prohibited fields
    lab.test('Trying to update pierre wr with a prohibited field', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + pierreWR.id, {"foo": "bar"});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('invalid parameter');
    });

    // testing update with prohibited state value
    lab.test('Trying to update pierre wr state with a prohibited value', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"state": "bar"});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('invalid value for parameter state (can only be closed)');
    });

	// testing delete with wrong id
    lab.test('Trying to delete with a dummy id', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/_______');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('invalid id');
    });
	
	// testing delete without id
	lab.test('Deleting all wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([]);
    });
});