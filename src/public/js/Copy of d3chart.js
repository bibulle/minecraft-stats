
var properties = { 
		 "stat.playOneMinute./(20*60*60*24)": "Temps joué (jour)",
		 "stat.deaths": "Nombre de mort",
		 "stat.mobKills": "Nombre de mob tué",
		 "stat.walkOneCm./1000": "Nombre de km marché",
		 "stat.horseOneCm./1000": "Nombre de km a cheval",
		 "stat.mineBlock.sum": "Nombre de bloc minés",
		 "stat.craftItem.sum": "Nombre d'item crafté",
		 "stat.useItem.sum": "Nombre d'item utilisé",
		 "stat.breakItem.sum": "Nombre d'item cassé",
		 "achievement.diamonds": "Nombre de diamant minés",
		 "achievement.exploreAllBiomes.progress.length": "Nombre de biome visité",
		 "achievement.length": "Nombre d'achievement",
		 "stat.playerKills": "Nombre de joueur tué",
};

// the data
var stats = null;

var loadData = function() {
	//d3.json("https://dl.dropboxusercontent.com/s/3i51mkyvd2gqoxx/stats.json?dl=1&token_hash=AAGU0_fbeyN4xMp3LYDSbOBz8o6MwmZFzwY-CPY9ZsdWtw", function(d) {
	d3.json("stats.json", function(d) {
		stats = d;
		drawChart();
	});
}


var drawChart = function(propertyX, propertyY, propertyR	) {
	
	
	// Const
	propertyX = propertyX || "stat.playOneMinute./(20*60*60*24)";
	propertyY = propertyY || "stat.deaths";
	propertyR = propertyR || "achievement.diamonds";
	labelX    = properties[propertyX];
	labelY    = properties[propertyY];
	labelR    = properties[propertyR];

	//Functions to get data
function x(d) { return d.x;}
function y(d) { return d.y;}
function radius(d) { return d.r;}
function color(d) { return d.group;}
function key(d) { return d.name;}

// Chart dimensions
var margin = {top: 40, right: 40, bottom: 40, left: 70},
		//margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
		width = 960 - margin.right,
		height = 500 - margin.top - margin.bottom;

// Create the SVG container
d3.select("svg").remove();
var svg = d3.select("#chart").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top +")");

// Add the date
var labelDate = svg.append("g");

var label1 = labelDate.append("text")
			.attr("class", "date label")
			.attr("text-anchor", "end")
			.attr("x", width-70)
			.attr("y", height-24)
			.text("24-Jan-2014");
var label2 = labelDate.append("text")
			.attr("class", "hour label")
			.attr("text-anchor", "end")
			.attr("x", width)
			.attr("y", height-24)
			.text("16:00");

// Get the box and add the layout
var box = labelDate.node().getBBox();
var overlay = svg.append("rect")
			.attr("class", "overlay")
			.attr("x", box.x)
			.attr("y", box.y)
			.attr("width", box.width)
			.attr("height", box.height)
			.on("mouseover", enableInteraction);


//add the x-axis label
svg.append("text")
			.attr("class", "x label")
			.attr("text-anchor", "end")
			.attr("x", width)
			.attr("y", height-6)
			.text(labelX)
			.on("click", function(d) {
				drawChart(getNextProperties(propertyX), propertyY, propertyR);
			});
//add the y-axis label
svg.append("text")
			.attr("class", "y label")
			.attr("text-anchor", "end")
			.attr("y", 6)
			.attr("dy", ".75em")
			.attr("transform", "rotate(-90)")
			.text(labelY)
			.on("click", function(d) {
				drawChart(propertyX, getNextProperties(propertyY), propertyR);
			});
			
			
// load the data
//d3.json("stats.json", function(stats) {
	// get list of hour
	var maxDate = d3.max(stats, function(d) {return toHour(d.date);});
	var minDate = d3.min(stats, function(d) {return toHour(d.date);});
	
	var maxX = minX = 0,
		 	maxY = minY = 0,
		 	maxR = minR = 0;
	
	// Get the data in the good order
	data = [];
	stats.forEach(function(d) {
		var hour = toHour(d.date);
		d.users.forEach(function(u) {
			if (!data[u.name]) {
				data[u.name] = [];
				//data.length = d3.keys(data).length;
			}
			u.hour = hour;
			data[u.name]["h"+hour] = u;
			
			var tmp = getValue(u, propertyX);
			if (maxX < tmp) { maxX = tmp; }
			tmp = getValue(u, propertyY);
			if (maxY < tmp) { maxY = tmp; }
			tmp = getValue(u, propertyR);
			if (maxR < tmp) { maxR = tmp; }
		});
	});
	
	// calculate the scales
	var xScale = d3.scale.linear().domain([minX, maxX]).range([0, width]),
			yScale = d3.scale.linear().domain([minY, maxY]).range([height, 0]),
			rScale = d3.scale.linear().domain([minR, maxR]).range([4, 40]),
			colorScale = d3.scale.category20();
	
	// define bisector
	var bisect = d3.bisector(function(d) {return d.substr(1);});

	// define the axis
	var xAxis = d3.svg.axis().orient("bottom").scale(xScale),
			yAxis = d3.svg.axis().scale(yScale).orient("left");
	
	// add the x-axis
	svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0,"+height+")")
			.call(xAxis);
	// add the y-axis
	svg.append("g")
			.attr("class", "y axis")
			.call(yAxis);

	//add the radius legend
	legend = svg.append("g")
				.attr("class", "legend")
				.attr("transform", "translate("+(width-200)+", -30)")
				.on("click", function(d) {
					drawChart(propertyX, propertyY, getNextProperties(propertyR));
				});
	legend.append("text")
				.attr("class", "legendTitle label")
				.attr("x", 0)
				.attr("y", 0)
				.text(labelR);

	legend1 = legend.append("g")
				.attr("transform", "translate(70, "+(-20+2*rScale(maxR)-rScale(minR))+")");
	legend1.append("circle")
				.attr("r", rScale(minR))
				.attr("x", 0)
				.attr("y", 0);
	legend1.append("text")
				.attr("class", "legend1 label")
				.attr("text-anchor", "end")
				.attr("x", -10-rScale(maxR))
				.attr("y", 0)
				.attr("dy", "0.3em")
				.text(minR);
	legend1.append("line")
				.attr("x1", -10-rScale(maxR))
				.attr("y1", 0)
				.attr("x2", -1*rScale(minR))
				.attr("y2", 0);

	legend2 = legend.append("g")
				.attr("transform", "translate(70, "+(-20+rScale(maxR))+")");
	legend2.append("circle")
				.attr("r", rScale(maxR))
				.attr("x", 0)
				.attr("y", 0);
	legend2.append("text")
				.attr("class", "legend2 label")
				.attr("text-anchor", "end")
				.attr("x", -10-rScale(maxR))
				.attr("y", 0)
				.attr("dy", "0.3em")
				.text(Math.round(maxR));
	legend2.append("line")
				.attr("x1", -10-rScale(maxR))
				.attr("y1", 0)
				.attr("x2", -1*rScale(maxR))
				.attr("y2", 0);

	// Plot the points
	var dot = svg.append("g")
			.attr("class", "dots")
		.selectAll(".dot")
			.data(interpolateData(minDate))
		.enter();
	
	var dotCircle=dot
			.append("circle")
			.attr("class", "dot")
			.style("fill", function(d) { return colorScale(color(d));})
			.call(positionCircle)
			.sort(order);

	var dotLabel=dot
			.append("text")
			.attr("class", "name label")
			.style("visibility", "hidden")
			.text(function(d) {return key(d);})
			.call(positionLabel);
	
	// add on mouse over to circles
	dotCircle
			.on("mouseover", function(d) {
				// show username
				dotLabel.filter(function(d1) {
					return (d1.name == d.name);
				})
					.style("visibility", "visible");
			})
			.on("mouseout", function(d) {
				// hide username
				dotLabel.filter(function(d1) {
					return (d1.name == d.name);
				}).style("visibility", "hidden");
			});
	
	// Let's move
	svg.transition()
			.duration(10000)
			.ease("linear")
			.tween("date", tweenDate)
			.each("end", enableInteraction);
			
	
	// Set the dot positions
	function positionCircle(dotCircle) {
		dotCircle	
				.attr("cx", function(d) { return xScale(x(d));})
				.attr("cy", function(d) { return yScale(y(d));})
				.attr("r" , function(d) { return rScale(radius(d));});
	}
	function positionLabel(dotLabel) {
		dotLabel	
			.attr("x", function(d) { return xScale(x(d))+rScale(radius(d))/2;})
			.attr("y", function(d) { return yScale(y(d))-rScale(radius(d))/2;});
	}
	
	function order(a, b) {
		return radius(b) - radius(a);
	}
	
	// enable interaction
	function enableInteraction() {
		// Calculate the scale of the movement
		var hourScale = d3.scale.linear()
					.domain( [minDate, maxDate])
					.range([box.x + 10, box.x + box.width - 10])
					.clamp(true);

    // Cancel the current transition, if any.
    svg.transition().duration(0);

    overlay
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);

    function mouseover() {
    	label1.classed("active", true);
    	label2.classed("active", true);
    }

    function mouseout() {
    	label1.classed("active", false);
    	label2.classed("active", false);
    }

    function mousemove() {
    	displayHour(hourScale.invert(d3.mouse(this)[0]));
    }
	}
	
	// Calculate hour from dateS
	function toHour(dateS) {
		return (new Date(dateS).getTime())/1000/60/60;
	}
	function toDate(hour) {
		return new Date(hour*1000*60*60);
	}
	
	// interpolate between dates
	function tweenDate() {
		var hours = d3.interpolateRound(minDate, maxDate);
		var i = 0;
		return function(t) { 
			displayHour(hours(t));
			//console.log(i++);
		};
	}
	
	// display the specified hour
	var format1 = d3.time.format("%d-%b-%Y");
	var format2 = d3.time.format("%H:00");
	function displayHour(hour) {
		dotCircle.data(interpolateData(hour), key).call(positionCircle).sort(order);
		dotLabel.data(interpolateData(hour), key).call(positionLabel);
		// Set the hour label
		d = toDate(hour);
		label1.text(format1(d));
		label2.text(format2(d));
	}
	
	// Function get data for the given hour
	function interpolateData(hour) {
		
		return d3.keys(data).map(function(d) {
			var user = data[d];
			return {
				name: d3.values(user)[0].name,
				group: d3.values(user)[0].name,
				x: interpolateValues(user, propertyX, hour),
				y: interpolateValues(user, propertyY, hour),
				r: interpolateValues(user, propertyR, hour),
			}
		});
	}
	
	// Interpolate values
	//var tmp = 0;
	function interpolateValues(user, propertyName, hour) {
		var i = bisect.left(d3.keys(user), hour),
				a = user[d3.keys(user)[i]];
		
		var result = getValue(a, propertyName); 
		
		if (i>0) {
			var b = user[d3.keys(user)[i-1]],
					t = (hour - a.hour) / (b.hour - a.hour);
			
			result = result * (1-t) + getValue(b, propertyName) * t; 
		}

//		if (tmp !== hour) {
//			console.log(d3.keys(user)[i]+" "+hour+" "+result);
//			tmp = hour;
//		}
		return result;
	}
	
	// Get the correct value
	function getValue(user, propertyName) {
		var obj = user;
		propertyName.split('.').forEach( function(p) {
			if (d3.keys(obj).indexOf(p) >= 0) {
				obj = obj[p];
			} else if (p == "length") {
				if (typeof(obj) === "object") {
					obj = d3.values(obj).length;
				} else {
					obj = obj.length;
				}
			} else if (p == "sum") {
					var sum = 0;
					d3.values(obj).forEach(function(v) {
						if (!isNaN(parseFloat(v)) && isFinite(v)) {
							sum+=v;
						}
					});
					obj = sum;
			} else if (p.indexOf("/") == 0) {
				val = eval(p.substr(1));
				obj = obj/val;
			} else {
				obj = null;
			}
		});
		
		return obj;
	}
	
	
//	});
	function getNextProperties(p) {
		var keys = d3.keys(properties);
		
		var i = keys.indexOf(p);
		if ((i>= 0) && (i != keys.length-1)) {
			return keys[i+1];
		}
		return keys[0];
	}
	
}
