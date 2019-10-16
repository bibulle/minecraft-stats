
var	mongodb = require('mongodb')
	, log = require('./log.js');

var db;
var collection;
var url;

/**
 * Connect to the Db
 */
module.exports.connect = function(url1, callback) {
	if (db) {
		return callback(null);
	}
	url = url1;
	mongodb.MongoClient.connect(url, function(err, db1) {
		if(err) {throw err;}

		db = db1;
		collection = db.collection('values');
		
		callback(null);
	});
};

/**
 * find all 
 */
module.exports.findAll = function(callback) {
	collection.find().toArray(function(err, docs) {
		if(err) {throw err;}
		
		callback(null, docs);
	});
};

/**
 * find query 
 */
module.exports.findQuery = function(query, callback) {
	collection.find(query).toArray(function(err, docs) {
		if(err) {throw err;}
		
		callback(null, docs);
	});
};

/**
 * count 
 */
module.exports.count = function(callback) {
	collection.count(function(err, count) {
		if(err) {throw err;}
		
		callback(null, count);
	});
};

/**
 * count by date 
 */
module.exports.countByDate = function(date, callback) {
	collection.count({date: date}, function(err, count) {
		if(err) {throw err;}
		
		callback(null, count);
	});
};

/**
 * insert
 */
module.exports.insert = function(jsonObj, callback) {
  //log.debug(JSON.stringify(jsonObj,null,2));
  //log.debug("-----");
  //jsonObj = { item: "card", qty: 15 };
    collection.insertOne(jsonObj, function(err, docs) {
        if(err) {throw err;}

        callback(null, docs);
    });
};

/**
 * delete
 */
module.exports.delete = function(date, callback) {

    if (false) {
        collection.find({date: { $lt : date}}).sort( { date: -1 } ).toArray(function(err, count) {
            if(err) {throw err;}

            log.error(date+" "+count.length);
            console.dir(count[0]);
            console.dir(count[0].users[0]);


            callback(null, count);
        });
    } else {
        collection.remove({date: { $lt : date}}, function(err, count) {
            if(err) {throw err;}

            log.error(date+" -> deleted : "+count);
            console.dir(count);


            callback(null, count);
        });
    }
};

/**
 * save 
 */
module.exports.save = function(jsonObj, callback) {
	collection.save(jsonObj, function(err, docs) {
		if(err) {throw err;}
		
		callback(null, docs);
	});
};

/**
 * close 
 */
module.exports.close = function(callback) {
	db.close();
	db = null;
	callback(null, "closed");
};

