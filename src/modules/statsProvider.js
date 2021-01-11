const dbStatsProvider = require("./dbStatsProvider"),
  async = require("async"),
  log = require("./log.js");

/**
 * Clean the Db
 */
module.exports.cleanDb = function (DB_URL, DB_NAME, callback) {
  log.start("cleanDb");
  // Change Db model
  dbStatsProvider.connect(DB_URL, DB_NAME, function (err) {
    if (err) {
      throw err;
    }

    // dbStatsProvider.deleteBefore(new Date(2021, 1, 9, 15), function (err, data) {
    //     log.debug(err);
    //     log.debug(data);
    // });

    // dbStatsProvider.deleteOne({ _id: "5ff9cfa944e1cebde9fde83e", date: "2021-01-09T15:00:00.000Z" }, function (err, data) {
    //     log.debug(err);
    //     log.debug(data);
    // });

    dbStatsProvider.findAll(function (err, data) {
      if (err) {
        throw err;
      }

      // the async method to launch
      const calls = [];

      for (let is in data) {
        // noinspection JSUnfilteredForInLoop
        let i = parseInt(is);
        if (i < 1 || i > data.length - 2) {
          continue;
        }
        const statPrev = data[i - 1];
        const statCurr = data[i];
        const statNext = data[1 + i];

        if (statCurr.users.length == 0) {
          debug("users vide " + i + " (" + statCurr.date + ")");
          calls.push(function (callback) {
            log.info("data deleted : (" + statCurr.date + ") users vide");
            dbStatsProvider.deleteOne(statCurr, function (err) {
              if (err) {
                throw err;
              }
              callback(null);
            });
          });
          continue;
        }

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

          if (
            userPrevJson &&
            userPrevJson === userNextJson &&
            userPrevJson === JSON.stringify(userCurr)
          ) {
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
      async.series(calls, function (err) {
        if (err) {
          throw err;
        }
        log.done("cleanDb");

        if (typeof callback !== "undefined") {
          callback(null);
        }
      });
    });
  });
};
