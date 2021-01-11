/**
 * Module dependencies.
 */
const log = require("./modules/log.js"),
  statsProvider = require("./modules/statsProvider.js"),
  dbStatsProvider = require("./modules/dbStatsProvider.js"),
  express = require("express"),
  compression = require('compression'),
  routes = require("./routes"),
  stats = require("./routes/stats"),
  http = require("http"),
  path = require("path"),
  async = require("async"),
  fs = require("fs"),
  os = require("os"),
  socketIo = require("socket.io"),
  Tail = require("tail").Tail,
  zlib = require("zlib"),
  readline = require("readline"),
  favicon = require("serve-favicon"),
  morgan = require("morgan"),
  bodyParser = require("body-parser"),
  methodOverride = require("method-override"),
  errorHandler = require("errorhandler");

//const MINECRAFT_HOME = '/opt/minecraft/minecraft';
const MINECRAFT_HOME1 = process.env.MINECRAFT_HOME || "/data";
const STATS_PATH1 = path.join(MINECRAFT_HOME1, "world", "stats");
const LOGS_PATH1 = path.join(MINECRAFT_HOME1, "logs");
const LOG_LATEST_PATH1 = LOGS_PATH1 + "/latest.log";

const MINECRAFT_HOME2 = path.join(__dirname, "../data");
const STATS_PATH2 = path.join(MINECRAFT_HOME2, "world", "stats");
const LOGS_PATH2 = path.join(MINECRAFT_HOME2, "logs");
const LOG_LATEST_PATH2 = LOGS_PATH2 + "/latest.log";

const OUTPUT_FILENAME = __dirname + "/stats.json";

//const DB_URL1 = "mongodb://192.168.0.128:27017";
const DB_URL1 = process.env.DB_URL || "mongodb://localhost:27017";
const DB_NAME = "mstats";

const MEMORY_SIZE = 5000;

const init = function (callback) {
  log.start("init");

  statsProvider.cleanDb(DB_URL1, DB_NAME, () => {
    log.done("init");
    callback();
  });
};

const messageMemory = [];
let lastMessageTime = 0;

/* --------------------
 calculate and send a line from a file
 -------------------- */
const manageLogLine = function (line, fileDate, io) {
  //log.info('line read : '+line);

  // calculate the date
  const msgDate = new Date();

  const splitRegexp = /^\[([0-9]*):([0-9]*):([0-9]*)]/;
  const match1 = splitRegexp.exec(line);
  if (match1) {
    msgDate.setTime(fileDate.getTime());
    msgDate.setHours(
      parseInt(match1[1]),
      parseInt(match1[2]),
      parseInt(match1[3])
    );
  } else {
    //msgDate.setTime(fileDate.getTime() + msgDate.getTime() % (24 * 3600 * 1000));
    //log.error("Wrong log format : " + line);
    return;
  }

  // if wrong time, add a day (get a 4 hours delay)
  if (
    Math.round(lastMessageTime / 1000) * 1000 - 4 * 3600 * 1000 >
    msgDate.getTime()
  ) {
    //log.info('+++++++ increment day'+ new Date(lastMessageTime)+" "+msgDate);
    //log.info(new Date(Math.round(lastMessageTime / 1000) * 1000 - 4*3600*1000));
    //log.info(line);

    msgDate.setDate(msgDate.getDate() + 1);
  } else if (Math.round(lastMessageTime / 1000) * 1000 === msgDate.getTime()) {
    msgDate.setTime(lastMessageTime + 1);
  }
  lastMessageTime = msgDate.getTime();
  //log.info(msgDate);

  // build the payload
  const payload = {
    date: msgDate,
    value: line,
  };

  //log.info(msgDate+" "+line);
  // add to memory
  messageMemory.push(payload);
  while (messageMemory.length > MEMORY_SIZE) {
    messageMemory.shift();
  }

  io.sockets.emit("new-data", payload);
};

/* --------------------
 Start reading old logs
 -------------------- */
const readOldLogs = function (io, callback) {
  log.start("readOldLogs");
  const files = fs
    .readdirSync(getLogsPath())
    .filter(function (f) {
      return f.endsWith(".gz");
    })
    .sort();

  async.eachSeries(
    files,
    function (file, callback1) {
      const fileDate = new Date(file.substring(0, 10));
      //log.info("reading "+file+" ==================== "+fileDate);

      const lineReader = readline.createInterface({
        input: fs
          .createReadStream(getLogsPath() + "/" + file)
          .pipe(zlib.createGunzip()),
      });

      lineReader.on("line", (line) => {
        manageLogLine(line, fileDate, io);
        //console.log(file + " " + line);
      });
      lineReader.on("close", () => {
        //log.info(file);
        //log.info(callback1);
        //log.info("========")
        callback1();
      });
    },
    function (err) {
      log.done("readOldLogs");
      callback(err);
    }
  );
};

/* --------------------
 Start tailing a log file (if it exists)
 -------------------- */
const launchLogTail = function (io) {
  if (fs.existsSync(getLogLatestPath())) {
    const stat = fs.statSync(getLogLatestPath());
    const fileDate = stat.birthtime;
    fileDate.setHours(0, 0, 0, 0);

    const tailLog = new Tail(getLogLatestPath(), {
      fromBeginning: true,
      follow: false,
    });

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
    log.error("File not found : " + LOG_LATEST_PATH);
    setTimeout(launchLogTail, 1000, io);
  }
};

/* --------------------
 Launch the HTTP server (and ws)
 -------------------- */
const launchServer = function (callback) {
  log.start("launchServer");
  /**
   * Express server configuration
   */
  const appExpress = express();

  // all environments
  appExpress.set("port", process.env.PORT || 3000);
  appExpress.set("views", __dirname + "/views");
  appExpress.set("view engine", "pug");
  appExpress.use(favicon(path.join(__dirname, "public", "img", "favicon.ico")));
  // noinspection JSUnusedGlobalSymbols
  appExpress.use(
    morgan("combined", {
      skip: function (req, res) {
        return res.statusCode < 400;
      },
    })
  );
  appExpress.use(bodyParser.urlencoded({ extended: false }));
  appExpress.use(methodOverride("X-HTTP-Method-Override"));
  // Compress all HTTP responses
  appExpress.use(compression());


  // const logger = function (req, res, next) {
  //     console.log(req.path);
  //     next(); // Passing the request to the next handler in the stack.
  // };
  // appExpress.use(logger);

  appExpress.use(express.static(path.join(__dirname, "public")));

  // development only
  // noinspection JSUnresolvedFunction
  if ("development" === appExpress.get("env")) {
    appExpress.use(errorHandler());
  }

  // noinspection JSUnresolvedFunction
  appExpress.get("/", routes.index);
  // noinspection JSUnresolvedFunction
  appExpress.get("/index.html", routes.index);
  // noinspection JSUnresolvedFunction
  appExpress.get("/stats.json", stats.list);

  const httpServer = http
    .createServer(appExpress)
    .listen(appExpress.get("port"), function () {
      log.info("Express server listening on port " + appExpress.get("port"));
    });

  /**
   * Socket configuration
   */
  const io = socketIo.listen(httpServer);

  // When a client connect, note it
  io.sockets.on("connection", function (socket) {
    log.info("A client is connected !");
    //socket.emit('new-data', 'tail file : '+LOG_PATH);
    //socket.emit('new-data', '-------------');

    sendLoad(io);
    messageMemory.forEach(function (line) {
      socket.emit("new-data", line);
    });
  });

  // start looking for server stats
  setInterval(() => {
    sendLoad(io);
  }, 60000);

  sendLoad(io);

  log.start("prepLog");
  // noinspection JSUnusedLocalSymbols
  async.series(
    [
      function (callback) {
        readOldLogs(io, callback);
      },
      function (callback) {
        launchLogTail(io);
        callback(null);
      },
    ],
    function (err, result) {
      log.done("prepLog");
    }
  );

  callback(null, "launchServer");
  log.done("launchServer");
};

/* --------------------
 Calculate server load
 ---------------------- */
function sendLoad(io) {
  const cpuUsage = os.loadavg();
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  io.sockets.emit("load", {
    cpuUsage: cpuUsage,
    freeMem: freeMem,
    totalMem: totalMem,
  });
}

/* --------------------
 Launch server calculating the statistics
 -------------------- */
const launchStats = function (callback) {
  log.start("launchStats");

  //Load users statistics
  const loadUsersStatistics = function (callback) {
    log.start("loadUsersStatistics");

    // Calculate Hour
    const hour = new Date();
    hour.setMinutes(0, 0, 0);

    // Get data from FTP, then save to Db
    async.waterfall(
      [
        // Connect to Db
        function (callback) {
          //Db access
          log.debug("dbStatsProvider.connect");
          dbStatsProvider.connect(DB_URL1, DB_NAME, callback);
        },
        // If cache file not exist create cached file
        function (callback) {
          if (fs.existsSync(OUTPUT_FILENAME)) {
            log.debug("file exists");
            callback();
          } else {
            createCacheFile(callback);
          }
        },
        // Check if already in Db
        function (callback) {
          // To debug list db
          log.start("Check already in Db");
          dbStatsProvider.countByDate(hour, function (err, count) {
            //log.debug(count);
            if (count > 0) {
              log.done("Check already in Db");
              return callback("Already in Db");
            }
            log.done("Check already in Db");
            callback(null);
          });
        },
        // Get users data
        function (callback) {
          // read dir
          log.debug("fs.readdirSync");
          const files = fs.readdirSync(getStatsPath());

          const jsonObj = {};
          jsonObj.date = hour;
          jsonObj.users = [];

          async.each(files, function (file) {
            const name = file.replace(".json", "");

            delete require.cache[require.resolve(getStatsPath() + "/" + file)];
            const stats = require(getStatsPath() + "/" + file);

            //log.debug("------------"  + name);
            // transform to object
            const obj = {};
            Object.keys(stats).forEach(function (key) {
              //log.debug(key + " -> " + stats[key]);
              const arr = key.split(".");
              let obj1 = obj;
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
          });

          //log.debug(JSON.stringify(jsonObj, null, 2));

          callback(null, jsonObj);
        },
        // Save data to Db
        function (jsonObj, callback) {
          // store to Db
          log.debug("dbStatsProvider.insert");
          dbStatsProvider.insert(jsonObj, function (err) {
            if (err) {
              throw err;
            }
            //console.dir(docs);
            callback(null);
          });
        },
        // Clean the Db
        function (callback) {
          log.debug("statsProvider.cleanDb");
          statsProvider.cleanDb(DB_URL1, DB_NAME, callback);
        },
        // Create cached file
        function (callback) {
          createCacheFile(callback);
        },
      ],
      function (err) {
        log.debug(err);
        //console.dir(err);
        //console.dir(result);
        log.start("close Db");
        dbStatsProvider.close(function () {
          log.done("close Db");
        });

        log.end("loadUsersStatistics");
        callback();
      }
    );
  };

  loadUsersStatistics(callback);

  setTimeout(function () {
    setInterval(function () {
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

/**
 * create the cache file
 */
const createCacheFile = function (callback) {
  log.start("createCacheFile");
  // Read to Db
  log.debug("dbStatsProvider.findAll");
  dbStatsProvider.findAll(function (err, docs) {
    if (err) {
      log.done("createCacheFile");
      throw err;
    }
    log.info(`${docs.length} documents added to '${OUTPUT_FILENAME}'`);

    fs.writeFile(OUTPUT_FILENAME, JSON.stringify(docs), function (err) {
      if (err) {
        log.done("createCacheFile");
        throw err;
      }
      log.debug("stats loaded and saved");
      log.done("createCacheFile");
      callback(null);
    });
  });
};

/**
 * get the logs path
 */
const getLogsPath = function () {
  if (fs.existsSync(LOGS_PATH1)) {
    return LOGS_PATH1;
  }
  if (fs.existsSync(LOGS_PATH2)) {
    return LOGS_PATH2;
  }
  throw new Error(`Path do not exist : ${LOGS_PATH1}`);
};
/**
 * get the latest logs path
 */
const getLogLatestPath = function () {
  if (fs.existsSync(LOG_LATEST_PATH1)) {
    return LOG_LATEST_PATH1;
  }
  if (fs.existsSync(LOG_LATEST_PATH2)) {
    return LOG_LATEST_PATH2;
  }
  throw new Error(`Path do not exist : ${LOG_LATEST_PATH1}`);
};
/**
 * get the stats path
 */
const getStatsPath = function () {
  if (fs.existsSync(STATS_PATH1)) {
    return STATS_PATH1;
  }
  if (fs.existsSync(STATS_PATH2)) {
    return STATS_PATH2;
  }
  throw new Error(`Path do not exist : ${STATS_PATH1}`);
};

// Lets do the job

async.series(
  [
    init,
    function (callback) {
      async.parallel([launchServer, launchStats], function () {
        //console.dir(results);
        callback(null, "Background processes");
      });
    },
  ],
  // optional callback
  function (err) {
    // Nothing here
    if (err) log.error(err);
  }
);
