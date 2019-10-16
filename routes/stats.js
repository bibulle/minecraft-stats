var log = require('../modules/log.js')
	, dbStatsProvider = require('../modules/dbStatsProvider.js')
	, fs = require('fs')
	, zlib = require('zlib');
	
/*
 * GET stats
 */

exports.list = function(req, res){
	var filename = __dirname+"/../stats.json";
	
	//fs.readFile(filename, 'utf8', function(err, data) {
	//	if (err) {throw err;}
		
	//	data = JSON.parse(data);
		
		var raw = fs.createReadStream(filename);
		
		var acceptEncoding = req.headers['accept-encoding'];
		if (!acceptEncoding) {
			acceptEncoding = '';
		}
		if (acceptEncoding.match(/\bdeflate\b/)) {
			res.writeHead(200, { 'content-encoding': 'deflate' });
			raw.pipe(zlib.createDeflate()).pipe(res);
		} else if (acceptEncoding.match(/\bgzip\b/)) {
			res.writeHead(200, { 'content-encoding': 'gzip' });
			raw.pipe(zlib.createGzip()).pipe(res);
		} else {
			res.writeHead(200, {});
			raw.pipe(res);
		}
		
		//res.send(data);

	//});
	
	

	

};