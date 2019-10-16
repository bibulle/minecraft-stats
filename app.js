/**
 * Module dependencies.
 */

var log = require('./modules/log.js'),
  statsProvider = require('./modules/statsProvider.js'),
  dbStatsProvider = require('./modules/dbStatsProvider.js'),
  ftp = require('ftp'),
  express = require('express'),
  routes = require('./routes'),
  stats = require('./routes/stats'),
  http = require('http'),
  path = require('path'),
  //, domain = require('domain'),
  async = require('async'),
  fs = require('fs'),
  os = require('os'),
  connect = require('connect'),
  socketio = require('socket.io'),
  Tail = require('tail').Tail,
  zlib = require('zlib'),
  readline = require('readline');


//var DB_URL = 'mongodb://bibulle:bibulle@ds157809.mlab.com:57809/mstats';
var STATS_PATH = '/opt/minecraft/minecraft/world/stats/';
var LOGS_PATH = '/opt/minecraft/minecraft/logs';
var LOG_LATEST_PATH = LOGS_PATH + '/latest.log';
var DB_URL='mongodb://192.168.0.128:27017/mstats';
//var STATS_PATH = '/Users/martin/Documents/mine/saves/world/stats/';
//var LOG_PATH = './example.log';

var MEMORY_SIZE = 5000;

var init = function (callback) {
  log.start("init");

  statsProvider.cleanDb(DB_URL);


  log.done("init");
  callback();
};

var messageMemory = [];
var lastMessageTime = 0;


/* --------------------
 calculate and send a line from a file
 -------------------- */
var manageLogLine = function (line, fileDate, io) {
//log.info('line read : '+line);

  // calculate the date
  var msgDate = new Date();

  var splitRegexp = /^\[([0-9]*):([0-9]*):([0-9]*)]/;
  var match1 = splitRegexp.exec(line);
  if (match1) {
    msgDate.setTime(fileDate.getTime());
    msgDate.setHours(match1[1], match1[2], match1[3])
  } else {
    //msgDate.setTime(fileDate.getTime() + msgDate.getTime() % (24 * 3600 * 1000));
    //log.error("Wrong log format : " + line);
    return
  }

  // if wrong time, add a day (get a 4 hours delay)
  if (Math.round(lastMessageTime / 1000) * 1000 - 4 * 3600 * 1000 > msgDate.getTime()) {
    //log.info('+++++++ increment day'+ new Date(lastMessageTime)+" "+msgDate);
    //log.info(new Date(Math.round(lastMessageTime / 1000) * 1000 - 4*3600*1000));
    //log.info(line);

    msgDate.setDate(msgDate.getDate() + 1);
  } else if (Math.round(lastMessageTime / 1000) * 1000 == msgDate.getTime()) {
    msgDate.setTime(lastMessageTime + 1);
  }
  lastMessageTime = msgDate.getTime();
  //log.info(msgDate);

  // build the payload
  var payload = {
    date: msgDate,
    value: line
  };

  //log.info(msgDate+" "+line);
  // add to memory
  messageMemory.push(payload)
  while (messageMemory.length > MEMORY_SIZE) {
    messageMemory.shift();
  }

  io.sockets.emit('new-data', payload);
};

/* --------------------
 Start reading old logs
 -------------------- */
var readOldLogs = function (io, callback) {
  log.start("readOldLogs");
  var files = fs.readdirSync(LOGS_PATH)
    .filter(function (f) {
      return f.endsWith(".gz")
    })
    .sort();

  async.eachSeries(
    files,
    function (file, callback1) {

      var fileDate = new Date(file.substring(0, 10));
      //log.info("reading "+file+" ==================== "+fileDate);

      var lineReader = readline.createInterface({
        input: fs.createReadStream(LOGS_PATH + "/" + file).pipe(zlib.createGunzip())
      });

      lineReader.on('line', (line) => {
        manageLogLine(line, fileDate, io);
        //console.log(file + " " + line);


      });
      lineReader.on('close', () => {
        //log.info(file);
        //log.info(callback1);
        //log.info("========")
        callback1();
      })
    },
    function (err) {
      log.done("readOldLogs");
      callback(err);
    });
};

/* --------------------
 Start tailing a log file (if it exists)
 -------------------- */
var launchLogTail = function (io) {

  if (fs.existsSync(LOG_LATEST_PATH)) {
    var stat = fs.statSync(LOG_LATEST_PATH);
    var fileDate = stat.birthtime;
    fileDate.setHours(0, 0, 0, 0);

    var tailLog = new Tail(LOG_LATEST_PATH, {fromBeginning: true, follow: false});

    tailLog.on("line", function (line) {
      manageLogLine(line, fileDate, io);
    });
    tailLog.on("error", function (error) {
      log.error(error);
      tailLog.unwatch();
      setTimeout(launchLogTail, 1000, io);
    });

    tailLog.watchEvent.call(tailLog, "change");

  } else {
    log.error('File not found : ' + LOG_LATEST_PATH);
    setTimeout(launchLogTail, 1000, io);
  }
};

/* --------------------
 Launch the HTTP server (and ws)
 -------------------- */
var launchServer = function (callback) {
  log.start("launchServer");
  /**
   * Express server configuration
   */
  var appExpress = express();

  // all environments
  appExpress.set('port', process.env.PORT || 3000);
  appExpress.set('views', __dirname + '/views');
  appExpress.set('view engine', 'jade');
  appExpress.use(express.favicon(__dirname + '/public/img/favicon.ico'));
  appExpress.use(express.logger('dev'));
  appExpress.use(express.bodyParser());
  appExpress.use(express.methodOverride());

  var logger = function (req, res, next) {
    console.log(req.path);
    next(); // Passing the request to the next handler in the stack.
  }

  appExpress.use(logger);
  appExpress.use(appExpress.router);
  appExpress.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' === appExpress.get('env')) {
    appExpress.use(express.errorHandler());
  }

  appExpress.get('/', routes.index);
  appExpress.get('/index.html', routes.index);
  appExpress.get('/stats.json', stats.list);

  var httpServer = http.createServer(appExpress).listen(appExpress.get('port'), function () {
    log.info('Express server listening on port ' + appExpress.get('port'));
  });

  /**
   * Socket configuration
   */
  var io = socketio.listen(httpServer);

  // Quand un client se connecte, on le note dans la console
  io.sockets.on('connection', function (socket) {
    log.info('Un client est connecté !');
    //socket.emit('new-data', 'tail file : '+LOG_PATH);
    //socket.emit('new-data', '-------------');

    sendLoad(io);
    messageMemory.forEach(function (line) {
      socket.emit('new-data', line);
    })

  });

  // start looking for server stats
  setInterval(() => {
    sendLoad(io);
  },60000);

  sendLoad(io);

  log.start("prepLog");
  async.series([
      function (callback) {
        readOldLogs(io, callback)
      },
      function (callback) {
        launchLogTail(io);
        callback(null);
      }

    ],
    function (err, result) {
      log.done("prepLog");
    });

  callback(null, 'launchServer');
  log.done("launchServer");
};

/* --------------------
 Calculate server load
 ---------------------- */
function sendLoad(io) {
    var cpuUsage = os.loadavg();
    var freeMem = os.freemem();
    var totalMem = os.totalmem();
    io.sockets.emit('load', {
      cpuUsage: cpuUsage,
      freeMem: freeMem,
      totalMem: totalMem
    });
}

/* --------------------
 Launch server calculating the statistics
 -------------------- */
var launchStats = function (callback) {
  log.start("launchStats");

  //Load users statistics
  var loadUsersStatistics = function (callback) {
    log.start("loadUsersStatistics");

    // Calculate Hour
    var hour = new Date();
    hour.setMinutes(0, 0, 0);

    // Get datas from FTP, then save to Db
    async.waterfall(
      [
        // Connect to Db
        function (callback) {
          //Db access
          dbStatsProvider.connect(DB_URL, callback);
        },
        // Check if already in Db
        function (callback) {
          // To debug list db
          log.start('Check already in Db');
          dbStatsProvider.countByDate(hour, function (err, count) {
            log.debug(count);
            if (count > 0) {
              log.done('Check already in Db');
              return callback("Already in Db");
            }
            log.done('Check already in Db');
            callback(null);
          });
        },
        // Get users data
        function (callback) {
          // read dir
          var files = fs.readdirSync(STATS_PATH);

          var jsonObj = {};
          jsonObj.date = hour;
          jsonObj.users = [];

          async.each(files, function (file) {
            var name = file.replace(".json", "");

            delete require.cache[require.resolve(STATS_PATH + "/" + file)];
            var stats = require(STATS_PATH + "/" + file);

            //log.debug("------------" + name);
            // transform to object
            var obj = {};
            Object.keys(stats).forEach(function (key) {
              //log.debug(key + " -> " + stats[key]);
              var arr = key.split(".");
              var obj1 = obj;
              arr.map(function (val, index) {
                //log.debug(val + " -> " + obj1[val]+" "+(typeof obj1));
                if (typeof obj1 !== "object") {
                  obj1 = {};
                }
                if (!obj1[val]) {
                  if (index !== arr.length - 1) {
                    obj1[val] = {};
                  } else {
                    obj1[val] = stats[key];
                  }
                }
                //log.debug(val + " -> " + obj1[val]);
                obj1 = obj1[val];
              });
            });

            obj.name = name;
            jsonObj.users.push(obj);


            //callback(null);

          })

          log.debug(JSON.stringify(jsonObj,null,2));

          callback(null, jsonObj);

        },
        // Save data to Db
        function (jsonObj, callback) {
          // store to Db
          dbStatsProvider.insert(jsonObj, function (err, docs) {
            if (err) {
              throw err;
            }
            //console.dir(docs);
            callback(null);
          });

        },
        // Clean the Db
        function (callback) {
          statsProvider.cleanDb(DB_URL, callback);
        },
        // Create cached file
        function (callback) {
          // Read to Db
          dbStatsProvider.findAll(function (err, docs) {
            if (err) {
              throw err;
            }
            var outputFilname = __dirname + "/stats.json";

            fs.writeFile(outputFilname, JSON.stringify(docs), function (err) {
              if (err) {
                throw err;
              }
              log.debug("stats loaded and saved");
              callback(null);
            });
          });

        }
      ], function (err, result) {
        //console.dir(err);
        //console.dir(result);
        log.start("close Db");
        dbStatsProvider.close(function (err, results) {
          log.done("close Db");
        });

        log.end("loadUsersStatistics");
        callback();
      }
    );
  };

  loadUsersStatistics(callback);

  setTimeout(function () {
    setInterval(
      function () {
        try {
          loadUsersStatistics(function (err) {
            if (err) {
              log.error(err);
            }
          });
        } catch (e) {
          log.error(e);
        }
      }, 15 * 60 * 1000);
  }, 0);

};


// Lets do the job

async.series(
  [
    init,
    function (callback) {
      async.parallel(
        [
          launchServer,
          launchStats
        ],
        function () {
          //console.dir(results);
          callback(null, "Background processes");
        }
      );
    }

  ],
  // optional callback
  function (err) {
    // Nothing here
    if (err) log.error(err);
  });

