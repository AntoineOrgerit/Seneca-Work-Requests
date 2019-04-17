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
let henriWR = {
    applicant: "henry",
    work: "Hard disk installation",
	date: "13-12-2019"
};
let jacquesWR = {
    applicant: "jacques",
    work: "PC installation",
	date: "16-10-2019"
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

	// testing retrieve of global stats
    lab.test('Retrieving global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(1);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(0);
    });

	// testing retrieve of Paul stats
    lab.test('Retrieving user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
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

	// testing updated stats
    lab.test('Retrieving updated global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(1);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

	// testing Paul's updated stats
    lab.test('Retrieving updated user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

	// testing updated of closed wr
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

	// testing updated global stats
    lab.test('Retrieving updated global stats (new applicant)', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(2);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

	// testing Pierre stats
    lab.test('Retrieving user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
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

	// testing updated global stats
    lab.test('Retrieving updated global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(2);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

	// testing updated Pierre stats
    lab.test('Retrieving updated user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

	// testing update with wrong id
    lab.test('Trying to update with a dummy id', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/_______', {});
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('invalid id');
    });

	// testing update without id
    lab.test('attempt to update a wr w/o id', async () => {
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
    lab.test('Trying to delete with a dummy wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr/_______');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('invalid id');
    });

	// testing wr creation from henri
    lab.test('Creating a wr from henri', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', henriWR);
        expect(result.success).to.be.true();
        expect(result.data).to.include(henriWR);
        henriWR = result.data;
    });

	// testing updated global stats
    lab.test('Retrieving updated global stats', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(3);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(1);
    });

	// testing user stats for Henri
    lab.test('Retrieving user stats for ' + henriWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + henriWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(henriWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(1);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

	// testing wr creation from Jacques
    lab.test('Creating a wr from jacques', async () => {
        const result = await makePromiseRequest(client.post, '/api/wr', jacquesWR);
        expect(result.success).to.be.true();
        expect(result.data).to.include(jacquesWR);
        jacquesWR = result.data;
    });

	// testing update of state
    lab.test('Updating Jacques wr state to "closed"', async () => {
        const result = await makePromiseRequest(client.put, '/api/wr/' + jacquesWR.id, {"state": "closed"});
        expect(result.success).to.be.true();
        jacquesWR.state = 'closed';
        expect(result.data).to.be.equals(jacquesWR);
    });

	// testing updated global stats
    lab.test('Retrieving updated global stats (closed wr)', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(4);
        expect(result.data.global_stats_wr_opened).to.be.equals(1);
        expect(result.data.global_stats_wr_closed).to.be.equals(2);
    });

	// testing Jacques's updated stats
    lab.test('Retrieving updated user stats for ' + jacquesWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + jacquesWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(jacquesWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    // testing drop of all unclosed wr
    lab.test('Deleting all wr', async () => {
        const result = await makePromiseRequest(client.del, '/api/wr');
        expect(result.success).to.be.true();
		expect(result.data).to.be.equals([henriWR]);
    });

	// testing retrieve of all wr
    lab.test('Retrieving all wr after deletion of unclosed ones', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr');
        expect(result.success).to.be.true();
        // only PaulWR and JacquesWR have not been deleted because there are closed
        expect(result.data).to.include([paulWR, jacquesWR]);
        expect([paulWR, jacquesWR]).to.include(result.data);
    });

	// testing updated global stats
    lab.test('Retrieving updated global stats after deletion of unclosed wr', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats');
        expect(result.success).to.be.true();
        expect(result.data.global_stats_wr_created).to.be.equals(4);
        expect(result.data.global_stats_wr_opened).to.be.equals(0);
        expect(result.data.global_stats_wr_closed).to.be.equals(2);
    });

	// testing Paul's updated stats
    lab.test('Retrieving user stats for ' + paulWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + paulWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(paulWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

	// testing Pierre's updated stats
    lab.test('Retrieving user stats for ' + pierreWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + pierreWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(pierreWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

	// testing Henri's updated stats
    lab.test('Retrieving user stats for ' + henriWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + henriWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(henriWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(0);
    });

	// testing Jacques's updated stats
    lab.test('Retrieving user stats for ' + jacquesWR.applicant, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/stats/' + jacquesWR.applicant);
        expect(result.success).to.be.true();
        expect(result.data.applicant).to.be.equals(jacquesWR.applicant);
        expect(result.data.stats_wr_created).to.be.equals(1);
        expect(result.data.stats_wr_opened).to.be.equals(0);
        expect(result.data.stats_wr_closed).to.be.equals(1);
    });

    // testing a work search term that includes both the WRs
    lab.test('search w/ search term: ' + 'PC', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'PC');
        expect(result.success).to.be.true();
        expect(result.data).to.include([paulWR, jacquesWR]);
        expect([paulWR, jacquesWR]).to.include(result.data);
    });

    // testing a work search term that includes only paul's WR
    lab.test('search w/ search term: ' + 'reinstall', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'reinstall');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    // testing a work search term that includes only jacques's WR
    lab.test('search w/ search term: ' + 'installation', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'installation');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([jacquesWR]);
    });

    // testing an invalid parameter
    lab.test('search w/ invalid term', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?foo=' + 'bar');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('can only take "search" param');
    });

    // testing an empty search term
    lab.test('search w/ empty search param', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + '');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('search param is empty');
    });

    // testing an ID search term
    lab.test('search w/ applicant search term: ' + paulWR.id, async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + paulWR.id);
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    // testing an applicant search term
    lab.test('search w/ applicant search term: ' + 'paul', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'paul');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    // testing a date search term
    lab.test('search w/ date search term: ' + '25-04-2019', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + '25-04-2019');
        expect(result.success).to.be.true();
        expect(result.data).to.be.equals([paulWR]);
    });

    // testing a state search term
    lab.test('search w/ state search term: ' + 'closed', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'closed');
        expect(result.success).to.be.true();
        expect(result.data).to.include([paulWR, jacquesWR]);
        expect([paulWR, jacquesWR]).to.include(result.data);
    });

    // testing a search term that is not in the DB
    lab.test('search w/ state search term: ' + 'open', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr?search=' + 'open');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('search returned nothing');
    });

    // testing both a search term and an ID
    lab.test('search w/ an ID', async () => {
        const result = await makePromiseRequest(client.get, '/api/wr/' + jacquesWR.id + '?search=' + 'install');
        expect(result.success).to.be.false();
        expect(result.msg).to.be.equals('concurrent use of id and search term');
    });

});

