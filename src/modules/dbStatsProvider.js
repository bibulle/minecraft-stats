const mongodb = require('mongodb')
	, log = require('./log.js');

let client;
let db;
let collection;
let url;

/**
 * Connect to the Db
 */
module.exports.connect = function(url1, name, callback) {
	log.start('connect');
	if (db) {
		log.done('connect');
		return callback(null);
	}
	url = url1;
	// noinspection JSIgnoredPromiseFromCall
	mongodb.MongoClient.connect(url, function(err, client1) {
		if(err) {
			log.done('connect');
			throw err;
		}

		client = client1;
		db = client.db(name);
		collection = db.collection('values');
		
		log.done('connect');
		callback(null);
	});
};

/**
 * find all 
 */
module.exports.findAll = function(callback) {
	log.start('findAll');
	collection.find().toArray(function(err, docs) {
		if(err) {
			log.end('findAll');
			throw err;
		}
		
		log.end('findAll');
		callback(null, docs);
	});
};

/**
 * find query 
 */
module.exports.findQuery = function(query, callback) {
	log.debug('findQuery');
	collection.find(query).toArray(function(err, docs) {
		if(err) {throw err;}
		
		callback(null, docs);
	});
};

/**
 * count 
 */
module.exports.count = function(callback) {
	log.debug('count');
	collection.count(function(err, count) {
		if(err) {throw err;}
		
		callback(null, count);
	});
};

/**
 * count by date 
 */
module.exports.countByDate = function(date, callback) {
	log.debug('countByDate');
	collection.countDocuments({date: date}, function(err, count) {
		if(err) {throw err;}

		callback(null, count);
	});
};

/**
 * insert
 */
module.exports.insert = function(jsonObj, callback) {
	log.debug('insert');
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
	log.debug('delete');

    // if (false) {
    //     collection.find({date: { $lt : date}}).sort( { date: -1 } ).toArray(function(err, count) {
    //         if(err) {throw err;}
	//
    //         log.error(date+" "+count.length);
    //         console.dir(count[0]);
    //         console.dir(count[0].users[0]);
	//
	//
    //         callback(null, count);
    //     });
    // } else {
        collection.remove({date: { $lt : date}}, function(err, count) {
            if(err) {throw err;}

            log.error(date+" -> deleted : "+count);
            console.dir(count);


            callback(null, count);
        });
    // }
};

/**
 * save 
 */
module.exports.save = function(jsonObj, callback) {
	log.debug('save');
	collection.updateOne({date: jsonObj.date}, { $set: jsonObj}, function(err, docs) {
		if(err) {throw err;}
		
		callback(null, docs);
	});
};

/**
 * close 
 */
module.exports.close = function(callback) {
	log.debug('close');
	// client.close();
	// db = null;
	callback(null, "closed");
};

