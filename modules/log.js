var util = require('util')
	, clc = require('cli-color');

module.exports.error = function(s) {
	util.log(clc.red.bold("error") + " : " + s);
};
module.exports.info = function(s) {
	util.log(clc.blueBright("info ") + " : " + s);
};
module.exports.debug = function(s) {
	util.log(clc.bold("debug") + " : " + s);
};
module.exports.time = function(s) {
	util.log(clc.bold("time ") + " : " + s);
};
var startTime = [];
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
