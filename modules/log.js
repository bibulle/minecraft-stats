const clc = require('cli-color');

error = require('debug')('server:error');
info = require('debug')('server:info');
debug = require('debug')('server:debug');
time = require('debug')('server:time');

module.exports.error = function(s) {
	error(clc['red'].bold("error") + " : " + s);
};
module.exports.info = function(s) {
	info(clc.blueBright("info ") + " : " + s);
};
module.exports.debug = function(s) {
	debug(clc.bold("debug") + " : " + s);
};
module.exports.time = function(s) {
	time(clc.bold("time ") + " : " + s);
};
const startTime = [];
module.exports.start = function(s) {
	this.time("Start " + s + " ...");
	startTime[s] = new Date();
};
module.exports.done = function(s) {
	if (startTime[s]) {
		this.time("Done  " + s + " (" + ((new Date() - startTime[s])) + ")");
		delete startTime[s];
	} else {
		this.time("Done  " + s + " (???)");
	}
};
module.exports.end = function(s) {
	this.done(s);
};
