const mongodb = require("mongodb"),
  log = require("./log.js");

let client;
let db;
let collection;
let url;

/**
 * Connect to the Db
 */
module.exports.connect = function (url1, name, callback) {
  log.start("connect");
  if (db) {
    log.done("connect");
    return callback(null);
  }
  url = url1;
  // noinspection JSIgnoredPromiseFromCall
  mongodb.MongoClient.connect(url, function (err, client1) {
    if (err) {
      log.done("connect");
      throw err;
    }

    client = client1;
    db = client.db(name);
    collection = db.collection("values");

    log.done("connect");
    callback(null);
  });
};

/**
 * find all
 */
module.exports.findAll = function (callback) {
  log.start("findAll");

  let now = new Date();
  let nowMinus1Month = new Date();
  nowMinus1Month.setMonth(nowMinus1Month.getMonth() - 1);
  let nowMinus3Month = new Date();
  nowMinus3Month.setMonth(nowMinus3Month.getMonth() - 3);
  let nowMinus6Month = new Date();
  nowMinus6Month.setMonth(nowMinus6Month.getMonth() - 6);

  // log.debug(now);
  // log.debug(nowMinus1Month);
  // log.debug(nowMinus6Month); 

  collection
    .aggregate([
      {
        $project: {
          timePart: { $dateToString: { format: "%H:%M:%S:%L", date: "$date" } },
          date: 1,
          users: 1
        },
      },
      {
        $match: {
          $or: [
            {
              date: { $gt: nowMinus1Month }
            },
            {
              date: { $lte: nowMinus1Month },
              date: { $gt: nowMinus3Month },
              $or: [
                {timePart: "00:00:00:000"},
                {timePart: "06:00:00:000"},
                {timePart: "12:00:00:000"},
                {timePart: "18:00:00:000"},
              ]
            },
            {
              date: { $lte: nowMinus3Month },
              date: { $gt: nowMinus6Month },
              $or: [
                {timePart: "00:00:00:000"},
                {timePart: "12:00:00:000"}, 
              ]
            },
            {
              date: { $lte: nowMinus6Month },
              timePart: "12:00:00:000"
            }
          ] 
        },
      },
      {
        $project: {
          date: 1,
          users: 1
        },
      },
    ])
    .toArray(function (err, docs) {
      if (err) {
        log.end("findAll");
        throw err;
      }
      // log.debug("====================");
      // log.debug(docs.map((o) => o.date).join("\n"));
      // log.debug("====================");
      // console.log(docs[0]);
      // log.debug("====================");

      log.end("findAll");
      callback(null, docs);
    });
};

/**
 * find query
 */
module.exports.findQuery = function (query, callback) {
  log.debug("findQuery");
  collection.find(query).toArray(function (err, docs) {
    if (err) {
      throw err;
    }

    callback(null, docs);
  });
};

/**
 * count
 */
module.exports.count = function (callback) {
  log.debug("count");
  collection.count(function (err, count) {
    if (err) {
      throw err;
    }

    callback(null, count);
  });
};

/**
 * count by date
 */
module.exports.countByDate = function (date, callback) {
  log.debug("countByDate");
  collection.countDocuments({ date: date }, function (err, count) {
    if (err) {
      throw err;
    }

    callback(null, count);
  });
};

/**
 * insert
 */
module.exports.insert = function (jsonObj, callback) {
  log.debug("insert");
  //log.debug(JSON.stringify(jsonObj,null,2));
  //log.debug("-----");
  //jsonObj = { item: "card", qty: 15 };
  collection.insertOne(jsonObj, function (err, docs) {
    if (err) {
      throw err;
    }

    callback(null, docs);
  });
};

/**
 * delete before a date
 */
module.exports.deleteBefore = function (date, callback) {
  log.start("deleteBefore");

  collection.deleteMany({ date: { $lt: date } }, function (err, commandResult) {
    if (err) {
      log.end("deleteBefore");
      throw err;
    }

    log.info(date + " -> deleted : " + commandResult.result.n);
    //console.dir(count);

    log.end("deleteBefore");
    callback(null, commandResult.result.n);
  });
};

/**
 * delete a doc
 */
module.exports.deleteOne = function (doc, callback) {
  log.start("deleteOne");

  collection.deleteOne({ _id: doc._id }, function (err, commandResult) {
    if (err) {
      log.end("deleteOne");
      throw err;
    }

    log.info(doc.date + " -> deleted : " + commandResult.result.n);
    //console.dir(count);

    log.end("deleteOne");
    callback(null, commandResult.result.n);
  });
};

/**
 * save
 */
module.exports.save = function (jsonObj, callback) {
  log.debug("save");
  collection.updateOne(
    { date: jsonObj.date },
    { $set: jsonObj },
    function (err, docs) {
      if (err) {
        throw err;
      }

      callback(null, docs);
    }
  );
};

/**
 * close
 */
module.exports.close = function (callback) {
  log.debug("close");
  // client.close();
  // db = null;
  callback(null, "closed");
};
