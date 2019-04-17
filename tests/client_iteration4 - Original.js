'use strict'

const {expect} = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Restify = require('restify-clients');

const client = Restify.createJsonClient({
    url: 'http://localhost:3000'
});

// test data...
let paulWR = {
    applicant: "paul",
    work: "PC update"
};

let pierreWR = {
    applicant: "pierre",
    work: "PC configuration"
};

let henriWR = {
    applicant: "henry",
    work: "Hard disk installation"
};

let jacquesWR = {
    applicant: "jacques",
    work: "PC installation"
};

// to make asynchronous calls
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

lab.experiment('work request app', () => {

    // delay between each test (if necessary)
    /*
    lab.beforeEach(() => {

        return new Promise( (resolve) => {
            // Wait 50 ms
            setTimeout( () => { resolve(); }, 50);
        });
    });
    */

    lab.test('create a wr from paul', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', paulWR);
        expect(result).to.not.be.null();
        expect(result.success).to.be.true();
        // for creation (post) we use 'include' because fields are added
        expect(result.data).to.include(paulWR);
        expect(result.data.id).to.not.be.undefined();
        expect(result.data.state).to.be.equals('created');
        paulWR = result.data;
    });

    lab.test('get w/ id', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/' + paulWR.id);
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(1);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(0);
    });

    lab.test('get user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    lab.test('search w/ search term: ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    lab.test('search w/ search term: ' + 'PC', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'PC');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    lab.test('search w/ search term: ' + 'update', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'update');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    lab.test('update work item', async () => {
        let newWorkItem = 'PC reinstall';
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"work": newWorkItem});
        expect(result.success).to.be.true();
        paulWR.work = newWorkItem;
        expect(result.data).to.be.equals(paulWR);
    });

    lab.test('search w/ search term: ' + 'update (empty result)', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'update');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([]);
    });

    lab.test('search w/ search term: ' + 'reinstall', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'reinstall');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    lab.test('update state (closing)', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"state": "closed"});
        expect(result.success).to.be.true();
        paulWR.state = 'closed';
        expect(result.data).to.be.equals(paulWR);
    });

    lab.test('search w/ search term: ' + 'closed', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'closed');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(1);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    lab.test('get user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    lab.test('attempt to update a closed wr', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + paulWR.id, {"work": "PC reinstall"});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr is already closed');
    });

    lab.test('attempt to delete a closed wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/' + paulWR.id);
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr is already closed');
    });

    lab.test('search w/ dummy search term', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?toto=');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('query parameter invalid');
    });

    lab.test('search w/ work resquest id', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/999?search=paul');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('query not possible with wr_id');
    });

    lab.test('create a wr from pierre', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', pierreWR);
        expect(result.success).to.be.true();
        expect(result.data).to.include(pierreWR);
        pierreWR = result.data;
    });

    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(2);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    lab.test('get user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    lab.test('get all WR (w/o id)', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr');
        expect(result.success).to.be.true();
        // tests inclusion in both directions to determine equality
        expect(result.data).to.include([paulWR, pierreWR]);
        expect([paulWR, pierreWR]).to.include(result.data);
    });

    lab.test('search w/ search term: ' + 'PC', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'PC');
        expect(result.success).to.be.true();
        expect(result.data).to.include([paulWR, pierreWR]);
        expect([paulWR, pierreWR]).to.include(result.data);
    });


    lab.test('delete an opened wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/' + pierreWR.id);
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals(pierreWR);
    });

    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(2);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    lab.test('get user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    lab.test('search w/ search term: ' + 'PC', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'PC');
        expect(result.success).to.be.true();
        expect(result.data).to.equals([paulWR]);
    });

    lab.test('attempt to update a dummy wr', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/_______', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr not found');
    });

    lab.test('attempt to update a wr w/o id', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr id not provided');
    });

    lab.test('attempt to delete a dummy wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/_______');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('wr not found');
    });

    lab.test('create a wr from henri', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', henriWR);
        expect(result.success).to.be.true();
        expect(result.data).to.include(henriWR);
        henriWR = result.data;
    });

    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(3);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

    lab.test('get user stats for ' + henriWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + henriWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(henriWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    lab.test('create a wr from jacques', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', jacquesWR);
        expect(result.success).to.be.true();
        expect(result.data).to.include(jacquesWR);
        jacquesWR = result.data;
    });

    lab.test('search w/ search term: ' + 'created', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'created');
        expect(result.success).to.be.true();
        expect(result.data).to.include([henriWR, jacquesWR]);
        expect([henriWR, jacquesWR]).to.include(result.data);
    });

    lab.test('update state (closing)', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + jacquesWR.id, {"state": "closed"});
        expect(result.success).to.be.true();
        jacquesWR.state = 'closed';
        expect(result.data).to.be.equals(jacquesWR);
    });

    lab.test('get global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(4);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(2);
    });

    lab.test('get user stats for ' + jacquesWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + jacquesWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(jacquesWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    // drop all work (not closed) requests
    lab.test('delete all wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr');
        expect(result.success).to.be.true();
    });

    lab.test('get all wr (w/o id)', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr');
        expect(result.success).to.be.true();
        // only PaulWR and JacquesWR have not been deleted because there are closed
        expect(result.data).to.include([paulWR, jacquesWR]);
        expect([paulWR, jacquesWR]).to.include(result.data);
    });

    lab.test('get global stats after delete', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(4);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(2);
    });

    lab.test('get user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    lab.test('get user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    lab.test('get user stats for ' + henriWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + henriWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(henriWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

    lab.test('get user stats for ' + jacquesWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + jacquesWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(jacquesWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    lab.test('search w/ search term: ' + 'PC', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'PC');
        expect(result.success).to.be.true();
        expect(result.data).to.include([paulWR, jacquesWR]);
        expect([paulWR, jacquesWR]).to.include(result.data);
    });

    lab.test('search w/ search term: ' + 'reinstall', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'reinstall');
        expect(result.success).to.be.true();
        expect(result.data).to.equals([paulWR]);
    });

    lab.test('search w/ search term: ' + 'installation', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'installation');
        expect(result.success).to.be.true();
        expect(result.data).to.equals([jacquesWR]);
    });

});

