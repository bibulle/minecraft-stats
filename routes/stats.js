const fs = require('fs'),
	zlib = require('zlib');

/*
 * GET stats
 */

exports.list = function (req, res) {
	const filename = __dirname + "/../stats.json";

	const raw = fs.createReadStream(filename);

	let acceptEncoding = req.headers['accept-encoding'];
	if (!acceptEncoding) {
        acceptEncoding = '';
    }
    if (acceptEncoding.match(/\bdeflate\b/)) {
        res.writeHead(200, {'content-encoding': 'deflate'});
        raw.pipe(zlib.createDeflate()).pipe(res);
    } else if (acceptEncoding.match(/\bgzip\b/)) {
        res.writeHead(200, {'content-encoding': 'gzip'});
        raw.pipe(zlib.createGzip()).pipe(res);
    } else {
        res.writeHead(200, {});
        raw.pipe(res);
    }


};
