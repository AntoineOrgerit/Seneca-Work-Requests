module.exports = [
	{
		pin: 'role:wr,cmd:*',
		prefix : '/api/wr',
		map: {
			create: {
				POST: true,
				name: ''
			},
			retrieve: {
				GET: true,
				name: '',
				suffix: '/:id?'
			},
			update: {
				PUT: true,
				name: '',
				suffix: '/:id'
			},
			delete: {
				DELETE: true,
				name: '',
				suffix: '/:id?'
			},
			get: {
				GET: true,
				name: '',
				suffix: 'stats/:applicant?'
			},
			// 'default redirection' for not supported routes
			notSupported: {
				GET: true,
				POST: true,
				PUT: true,
				DELETE: true,
				name: ''
			}
		}
	}/*,
	{
		pin: 'role:stats,cmd:*',
		prefix : '/api/wr/stats',
		map: {
			get: {
				GET: true,
				name: '',
				suffix: '/:applicant?'
			},
			// 'default redirection' for not supported routes
			notSupported: {
				GET: true,
				POST: true,
				PUT: true,
				DELETE: true,
				name: ''
			}
		}
	// }*/
];