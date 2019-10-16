var dbStatsProvider = require('./dbStatsProvider')
	, async = require('async')
	,	log = require('./log.js');

/**
 * Clean the Db
 */
module.exports.cleanDb = function(DB_URL, callback) {
	
	log.start("cleanDb");
	// Change Db model
	dbStatsProvider.connect(DB_URL, function(err) {
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
			var calls = [];

			for ( var i in data) {
				i = parseInt(i);
				if ((i < 1) || (i > (data.length - 2))) {
					continue;
				}
				var statPrev = data[i - 1];
				var statCurr = data[i];
				var statNext = data[1 + i];

				var newUsers = [];
				for ( var j in statCurr.users) {
					var userCurr = statCurr.users[j];

					var name = userCurr.name;

					var userPrevJson = null;
					for ( var k in statPrev.users) {
						if (name === statPrev.users[k].name) {
							userPrevJson = JSON.stringify(statPrev.users[k]);
							break;
						}
					}
					var userNextJson = null;
					for ( var k in statNext.users) {
						if (name === statNext.users[k].name) {
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
					
					calls.push(function(callback) {
						log.info("data changed : (" + statCurr.date + ")");
						dbStatsProvider.save(statCurr, function(err, data) {
							if (err) {
								throw err;
							}
							callback(null);
						});
					});
				}
			}
			 async.parallel(calls, function(err, result) {
				 if (err) {throw err;}
					log.done("cleanDb");
					
					if (typeof(callback) !== "undefined") {
						callback(null);
					}
			 });

		});
	});
};