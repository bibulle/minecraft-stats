const dbStatsProvider = require('./dbStatsProvider')
	, async = require('async')
	, log = require('./log.js');

/**
 * Clean the Db
 */
module.exports.cleanDb = function(DB_URL, DB_NAME, callback) {
	
	log.start("cleanDb");
	// Change Db model
	dbStatsProvider.connect(DB_URL, DB_NAME, function(err) {
		if (err) {
			throw err;
		}
        //dbStatsProvider.delete(new Date(2014,7, 3, 21), function(err, data) {
        //    dbStatsProvider.delete(new Date(2014,7, 3, 20), function(err, data) {
        //    });
        //});


		dbStatsProvider.findAll(function(err, data) {
			if (err) {
				throw err;
			}
			
			// the async method to launch
			const calls = [];

			for (let is in data) {
				// noinspection JSUnfilteredForInLoop
				let i = parseInt(is);
				if ((i < 1) || (i > (data.length - 2))) {
					continue;
				}
				const statPrev = data[i - 1];
				const statCurr = data[i];
				const statNext = data[1 + i];

				const newUsers = [];
				for (let j in statCurr.users) {
					// noinspection JSUnfilteredForInLoop
					const userCurr = statCurr.users[j];

					const name = userCurr.name;

					let userPrevJson = null;
					for (let k in statPrev.users) {
						// noinspection JSUnfilteredForInLoop
						if (name === statPrev.users[k].name) {
							// noinspection JSUnfilteredForInLoop
							userPrevJson = JSON.stringify(statPrev.users[k]);
							break;
						}
					}
					let userNextJson = null;
					for (let k in statNext.users) {
						// noinspection JSUnfilteredForInLoop
						if (name === statNext.users[k].name) {
							// noinspection JSUnfilteredForInLoop
							userNextJson = JSON.stringify(statNext.users[k]);
							break;
						}
					}

					if (userPrevJson && (userPrevJson === userNextJson) && (userPrevJson === JSON.stringify(userCurr))) {
						continue;
					}
					newUsers.push(userCurr);
				}

				if (statCurr.users.length !== newUsers.length) {
					// log.info(statCurr.date+" "+statCurr.users.length+" -> "+newUsers.length);
					statCurr.users = newUsers;

					calls.push(function (callback) {
						log.info("data changed : (" + statCurr.date + ")");
						dbStatsProvider.save(statCurr, function (err) {
							if (err) {
								throw err;
							}
							callback(null);
						});
					});
				}
			}
			 async.parallel(calls, function(err) {
				 if (err) {throw err;}
					log.done("cleanDb");
					
					if (typeof(callback) !== "undefined") {
						callback(null);
					}
			 });

		});
	});
};
