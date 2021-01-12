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

      // get user list
      // let userList = [];
      // let timePlayed = {};
      // for (let i = 0; i < data.length - 1; i++) {
      //   const statCurr = data[i];
      //   for (let k = 0; k < statCurr.users.length; k++) {
      //     const user = statCurr.users[k];
      //     if (userList.indexOf(user.name) < 0) {
      //       //log.debug(user.name);
      //       userList.push(user.name);

      //       timePlayed[user.name] =
      //         user.stats["minecraft:custom"]["minecraft:play_one_minute"];
      //     } else {
      //       if (
      //         timePlayed[user.name] <
      //         user.stats["minecraft:custom"]["minecraft:play_one_minute"]
      //       ) {
      //         timePlayed[user.name] =
      //           user.stats["minecraft:custom"]["minecraft:play_one_minute"];
      //       }
      //     }
      //   }
      // }
      //console.log(timePlayed);

      // for (let h = 0; h < userList.length; h++) {
      //   const userName = userList[h];
      //   const userShouldBeDeleted = timePlayed[userName] < 2000;

      //   for (let i = 0; i < data.length - 1; i++) {
      //     const statCurr = data[i];
      //     const statNext = data[i + 1];

      //     // if needed, remove the user
      //     if (userShouldBeDeleted) {
      //       statCurr.users = statCurr.users.filter((o) => {
      //         return o.name !== userName;
      //       });
      //       dbStatsProvider.save(statCurr, () => {
      //         log.debug(
      //           `one update done ${statCurr.date} (remove ${userName})`
      //         );
      //       });
      //       statNext.users = statNext.users.filter((o) => {
      //         return o.name !== userName;
      //       });
      //       dbStatsProvider.save(statNext, () => {
      //         log.debug(
      //           `one update done ${statNext.date} (remove ${userName})`
      //         );
      //       });

      //       continue;
      //     }
      //     if (statCurr.date.getTime() >= statNext.date.getTime()) {
      //       log.debug(` !!!!! ${statCurr.date} >= ${statNext.date}`);
      //     } else {
      //       let userCurr;
      //       let valCurr;
      //       let valNext;
      //       for (let k = 0; k < statCurr.users.length; k++) {
      //         const user = statCurr.users[k];
      //         if (user.name === userName) {
      //           // log.debug(`${statCurr.date} ${user.stats["minecraft:mined"]["minecraft:diamond_ore"]}`);
      //           userCurr = user;
      //           if (user.stats["minecraft:custom"])
      //             valCurr =
      //               user.stats["minecraft:custom"]["minecraft:play_one_minute"];
      //         }
      //       }
      //       for (let k = 0; k < statNext.users.length; k++) {
      //         const user = statNext.users[k];
      //         if (user.name === userName) {
      //           // log.debug(`${statNext.date} ${user.stats["minecraft:mined"]["minecraft:diamond_ore"]}`);
      //           if (user.stats["minecraft:custom"])
      //             valNext =
      //               user.stats["minecraft:custom"]["minecraft:play_one_minute"];
      //         }
      //       }

      //       if (valCurr && valNext && valCurr > valNext) {
      //         // time go backward... not good
      //         log.debug(`${userName} ${statCurr.date} ${valCurr} > ${valNext}`);

      //         // remove the user and then add the previous one
      //         statNext.users = statNext.users.filter((o) => {
      //           return o.name !== userName;
      //         });
      //         statNext.users.push(userCurr);
      //         // dbStatsProvider.save(statNext, () => {
      //         //   log.debug(`one update done ${statNext.date}`);
      //         // });

      //       } else if (valCurr && !valNext) {
      //         // a value is undefined add it
      //         log.debug(`${userName} ${statCurr.date} ${valCurr} & !next ${valNext}`);

      //         //console.log(statNext);
      //         statNext.users.push(userCurr);
      //         //console.log(statNext);

      //         dbStatsProvider.save(statNext, () => {
      //           log.debug(`one update done ${statNext.date}`);
      //         });
      //       }

      //       // if (i === data.length - 2) {
      //       //   log.debug(`${userName} ${statNext.date} last ${valNext}`);
      //       // }
      //     }
      //   }
      // }

      log.done("cleanDb");

      if (typeof callback !== "undefined") {
        callback(null);
      }
      // });
    });
  });
};
