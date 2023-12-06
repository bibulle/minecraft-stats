var properties = {
    "stats.minecraft:custom.minecraft:play_one_minute./(20*60*60*24)": "Temps joué en jour",
    "stats.minecraft:custom.minecraft:deaths": "Nombre de mort",
    "stats.minecraft:custom.minecraft:mob_kills": "Nombre de mob tué",
    "stats.minecraft:custom.minecraft:walk_one_cm./1000": "Nombre de km marché",
    "stats.minecraft:custom.minecraft:horse_one_cm./1000": "Nombre de km a cheval",
    "stats.minecraft:mined.sum": "Nombre de bloc minés",
    "stats.minecraft:mined.minecraft:stone": "Nombre de bloc de pierre minées",
    "stats.minecraft:mined.minecraft:dirt": "Nombre de bloc de dirt minés",
	"stats.minecraft:mined.minecraft:spruce_log.+.stats.minecraft:mined.minecraft:oak_log.+.stats.minecraft:mined.minecraft:birch_log": "Nombre de bloc de bois minés",
	"stats.minecraft:used.minecraft:spruce_planks.+.stats.minecraft:mined.minecraft:oak_planks.+.stats.minecraft:mined.minecraft:birch_planks": "Nombre de bloc de bois placé",
    "stats.minecraft:mined.minecraft:yellow_flower.+.stats.minecraft:mined.minecraft:red_flower.+.stats.minecraft:mined.minecraft:38": "Nombre de bloc de fleur ramassée",
    "stats.minecraft:mined.minecraft:diamond_ore": "Nombre de bloc de diamant minés",
    "stats.minecraft:crafted.sum": "Nombre d'item crafté",
    "stats.minecraft:used.sum": "Nombre d'item utilisé",
    "stats.minecraft:broken.sum": "Nombre d'item cassé",
    "stats.minecraft:picked_up.minecraft:diamond": "Nombre de diamant minés",
    //"achievement.exploreAllBiomes.progress.length": "Nombre de biome visité",
    //"achievement.length": "Nombre d'achievement",
    //"stat.playerKills": "Nombre de joueur tué",
};

var names = {
    "b5fddd7d-1e32-4d23-872a-0bb17ef16d80": "juju_31",
    "85c14491-3fa3-4638-8322-555294887c4a": "bibulle",
    "f4a67d20-6ea0-4695-9a3d-dea2f6c593db": "Fuc_Kyew",
    "27207827-c41e-49de-a79d-4044d1dfd89f": "ImoSephty",
    "a2cfce79-b013-4ba2-872b-09ab5ede4a70": "lasombras",
    "b13b2cd1-318b-48d8-9c80-a558b5e3497e": "pilouz",
    "a5bbfa65-662e-45f0-9382-965d805882b9": "Marthi_42",
    "ce52c013-c1b4-4054-a1af-e1c5db5a1230": "Jumonline",
    "97fd0b35-fa50-4eb4-ab54-090fe72c8cef": "Nocy_"
};

//var newProp = {};
//for (var i in d3.keys(properties)) {
//	key = d3.keys(properties)[i];
//	val = properties[key];
//	newProp[key] = val;
//	newProp[key+".Week"] = val+" cette semaine";
//	newProp[key+".Day"] = val+" ce jour";
//}
//properties = newProp;

// The date formats
var format1 = d3.time.format("%d-%b-%Y");
var format2 = d3.time.format("%H:00");

// Const
var propertyX = null,
    propertyY = null,
    propertyR = null;

// the data
var stats = null;

var loadData = function () {
    createChart();
    //d3.json("https://www.dropbox.com/s/hwxua8z935wl9lh/stats.json?dl=0", function(d) {
    d3.json("stats.json", function (d) {
        stats = d.sort(function (a, b) {
            if (a.date > b.date) {
                return 1;
            }
            if (a.date < b.date) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });

        updateChart();
    });
};

//Chart dimensions
var margin = {top: 40, right: 80, bottom: 40, left: 70},
    width = 960 - margin.right,
    height = 500 - margin.top - margin.bottom;

var createChart = function () {

    //Create the SVG container
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("class", "all group")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Add the date
    var labelDate = svg.append("g")
        .attr("class", "all date group")
        //.attr("visibility", "hidden")
        .attr("opacity", 0);
    var label1 = labelDate.append("text")
        .attr("class", "date label")
        .attr("text-anchor", "end")
        .attr("x", width - 70)
        .attr("y", height - 24)
        .text("20-Feb-2017");
    var label2 = labelDate.append("text")
        .attr("class", "hour label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 24)
        .text("14:00");

    //Get the box and add the layout
    var box = labelDate.node().getBBox();
    var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height);

    //add the x-axis label
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("")
        .on("click", function () {
            showMenu(-40, 20, false, propertyX, function (newProp) {
                updateChart(newProp, propertyY, propertyR);
            });
            //updateChart(getNextProperties(propertyX), propertyY, propertyR);
        });
    //add the y-axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("")
        .on("click", function (d) {
            showMenu(14, 1, true, propertyY, function (newProp) {
                updateChart(propertyX, newProp, propertyR);
            });
            //updateChart(propertyX, getNextProperties(propertyY), propertyR);
        });

    // define the axis
    var xAxis = d3.svg.axis().orient("bottom").scale(d3.scale.linear().domain([0, 1]).range([0, width])),
        yAxis = d3.svg.axis().scale(d3.scale.linear().domain([0, 1]).range([height, 0])).orient("left");
    // add the x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    // add the y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    //add the radius legend
    legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width - 200) + ", -30)")
        .on("click", function (d) {
            showMenu(width - 300, -30, true, propertyR, function (newProp) {
                updateChart(propertyX, propertyY, newProp);
            });
            //updateChart(propertyX, propertyY, getNextProperties(propertyR));
        });
    legend.append("text")
        .attr("class", "legendTitle label")
        .attr("x", 0)
        .attr("y", 0)
        .text("");

    legend1 = legend.append("g")
        .attr("class", "legend1 group")
        .attr("transform", "translate(70, 56)");
    legend1.append("circle")
        .attr("class", "legend1 circle")
        .attr("r", 0)
        .attr("x", 0)
        .attr("y", 0);
    legend1.append("text")
        .attr("class", "legend1 label")
        .attr("text-anchor", "end")
        .attr("x", -50)
        .attr("y", 0)
        .attr("dy", "0.3em")
        .text("");
    legend1.append("line")
        .attr("class", "legend1 line")
        .attr("x1", -4)
        .attr("y1", 0)
        .attr("x2", -4)
        .attr("y2", 0);

    legend2 = legend.append("g")
        .attr("class", "legend2 group")
        .attr("transform", "translate(70, 20)");
    legend2.append("circle")
        .attr("class", "legend2 circle")
        .attr("r", 0)
        .attr("x", 0)
        .attr("y", 0);
    legend2.append("text")
        .attr("class", "legend2 label")
        .attr("text-anchor", "end")
        .attr("x", -50)
        .attr("y", 0)
        .attr("dy", "0.3em")
        .text("");
    legend2.append("line")
        .attr("class", "legend2 line")
        .attr("x1", -40)
        .attr("y1", 0)
        .attr("x2", -40)
        .attr("y2", 0);


}

var doNotDisplayHour = true;
var updateChart = function (aPropertyX, aPropertyY, aPropertyR) {

    //console.log("updateChart "+new Date());

    //enableInteraction();
    doNotDisplayHour = true;
    d3.select("*")
        .transition()
        .duration(0);

    propertyX = aPropertyX || propertyX || d3.keys(properties)[Math.floor(Math.random() * d3.keys(properties).length)];
    propertyY = aPropertyY || propertyY || d3.keys(properties)[Math.floor(Math.random() * d3.keys(properties).length)];
    propertyR = aPropertyR || propertyR || d3.keys(properties)[Math.floor(Math.random() * d3.keys(properties).length)];
    var labelX = getPropertyLabel(propertyX);
    var labelY = getPropertyLabel(propertyY);
    var labelR = getPropertyLabel(propertyR);

    //Functions to get data
    function x(d) {
        return d.x;
    }

    function y(d) {
        return d.y;
    }

    function radius(d) {
        return d.r;
    }

    function color(d) {
        return d.group;
    }

    function key(d) {
        //if (!names[d.name]) {
        //  console.log(d.name);
        //}

        return names[d.name];
    }

    // define bisector
    var bisect = d3.bisector(function (d) {
        return d.substr(1);
    });


    // get list of hour
    var maxDate = d3.max(stats, function (d) {
        return toHour(d.date);
    });
    var minDate = d3.min(stats, function (d) {
        return toHour(d.date);
    });

    var maxX = minX = 0,
        maxY = minY = 0,
        maxR = minR = 0;

    // Get the data in the good order
    data = [];
    stats.forEach(function (d) {
        var hour = toHour(d.date);
        d.users.forEach(function (u) {
            if (!data[u.name]) {
                data[u.name] = [];
                //data.length = d3.keys(data).length;
            }
            u.hour = hour;
            data[u.name]["h" + hour] = u;

            var tmp = getValue(u, propertyX, data[u.name], hour);
            if (maxX < tmp) {
                maxX = tmp;
            }
            tmp = getValue(u, propertyY, data[u.name], hour);
            if (maxY < tmp) {
                maxY = tmp;
            }
            tmp = getValue(u, propertyR, data[u.name], hour);
            if (maxR < tmp) {
                maxR = tmp;
            }
        });
    });

    //console.log(data);
    console.log()

    // calculate the scales
    var xScale = d3.scale.linear().domain([minX, maxX]).range([0, width]),
        yScale = d3.scale.linear().domain([minY, maxY]).range([height, 0]),
        rScale = d3.scale.linear().domain([minR, maxR]).range([4, 40]),
        colorScale = d3.scale.category20();

    //add the x-axis label
    d3.select(".x.label")
        .transition()
        .duration(1000)
        .text(labelX);
    //add the y-axis label
    d3.select(".y.label")
        .transition()
        .duration(10000)
        .text(labelY);

    // define the axis
    var xAxis = d3.svg.axis().orient("bottom").scale(xScale),
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    // add the x-axis
    d3.select(".x.axis")
        .transition()
        .duration(1000)
        .call(xAxis);
    // add the y-axis
    d3.select(".y.axis")
        .transition()
        .duration(1000)
        .call(yAxis);

    //add the radius legend
    d3.select(".legendTitle.label")
        .transition()
        .duration(1000)
        .text(labelR);

    d3.select(".legend1.group")
        .transition()
        .duration(1000)
        .attr("transform", "translate(70, " + (-20 + 2 * rScale(maxR) - rScale(minR)) + ")");
    d3.select(".legend1.circle")
        .transition()
        .duration(1000)
        .attr("r", rScale(minR));
    d3.select(".legend1.label")
        .transition()
        .duration(1000)
        .attr("x", -10 - rScale(maxR))
        .text(minR);
    d3.select(".legend1.line")
        .transition()
        .duration(1000)
        .attr("x1", -10 - rScale(maxR))
        .attr("x2", -1 * rScale(minR));

    d3.select(".legend2.group")
        .transition()
        .duration(1000)
        .attr("transform", "translate(70, " + (-20 + rScale(maxR)) + ")");
    d3.select(".legend2.circle")
        .transition()
        .duration(1000)
        .attr("r", rScale(maxR));
    d3.select(".legend2.label")
        .transition()
        .duration(1000)
        .attr("x", -10 - rScale(maxR))
        .text(Math.round(maxR));
    d3.select(".legend2.line")
        .transition()
        .duration(1000)
        .attr("x1", -10 - rScale(maxR))
        .attr("x2", -1 * rScale(maxR));

    // Plot the points
    //console.log("before data join "+new Date());
    //   ->Data Join
    var dot = d3.select(".all.group")
        .selectAll(".dot")
        .data(interpolateData(minDate), key);

    // 	-> enter
    //console.log("before enter "+new Date());
    dot.enter()
        .append("circle")
        .style("fill", function (d) {
            return colorScale(color(d));
        })
        .attr("opacity", 0.8)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 0)
        .attr("class", "dot")
        .on("mouseover", function (d) {
            // show username and marks
            d3.select(".all.group")
                .selectAll(".name.label, .x.mark, .y.mark, .r.mark")
                .filter(function (d1) {
                    return (d1.name === d.name);
                })
                .transition()
                .duration(500)
                .attr("visibility", "visible")
                .attr("opacity", 1);
        })
        .on("mouseout", function (d) {
            // hide username
            d3.select(".all.group")
                .selectAll(".name.label, .x.mark, .y.mark, .r.mark")
                .filter(function (d1) {
                    return (d1.name === d.name);
                })
                .transition()
                .duration(1000)
                .attr("visibility", "hidden")
                .attr("opacity", 0);
        });

    // -> enter + update
    //console.log("before transition "+new Date());
    dot.transition()
        .duration(1000)
        .style("fill", function (d) {
            return colorScale(color(d));
        })
        .call(positionCircle)
        .sort(order);

    // -> exit
    dot.exit().remove();

    // The point label
    var text = d3.select(".all.group")
        .selectAll(".name.label")
        .data(interpolateData(minDate), key);

    // 	-> enter
    text.enter()
        .append("text")
        .attr("class", "name label")
        .attr("visibility", "hidden")
        .attr("opacity", 0);

    // -> enter + update
    text
        .transition()
        .duration(1000)
        .attr("opacity", 0)
        .text(function (d) {
            return key(d);
        })
        .call(positionLabel);

    // -> exit
    text.exit().remove();


    // the xMak
    var xMarkLine = d3.select(".all.group")
        .selectAll(".x.mark.line")
        .data(interpolateData(minDate), key);
    xMarkLine.enter()
        .append("line")
        .attr("class", "x mark line")
        .attr("opacity", 0);
    xMarkLine
        .transition()
        .duration(1000)
        .attr("x1", function (d) {
            return xScale(x(d)) - rScale(radius(d));
        })
        .attr("y1", function (d) {
            return yScale(y(d));
        })
        .attr("x2", 0)
        .attr("y2", function (d) {
            return yScale(y(d));
        });
    var xMarkText = d3.select(".all.group")
        .selectAll(".x.mark.text")
        .data(interpolateData(minDate), key);
    xMarkText.enter()
        .append("text")
        .attr("class", "x mark text")
        .attr("text-anchor", "end")
        .attr("dy", "-0.4em")
        .attr("dx", "-0.15em")
        .attr("opacity", 0);
    xMarkText
        .transition()
        .duration(1000)
        .attr("x", function (d) {
            return xScale(x(d)) - rScale(radius(d));
        })
        .attr("y", function (d) {
            return yScale(y(d));
        })
        .text(function (d) {
            return prettyNumber(y(d));
        });

    var yMarkLine = d3.select(".all.group")
        .selectAll(".y.mark.line")
        .data(interpolateData(minDate), key);
    yMarkLine.enter()
        .append("line")
        .attr("class", "y mark line")
        .attr("opacity", 0);
    yMarkLine
        .transition()
        .duration(1000)
        .attr("x1", function (d) {
            return xScale(x(d));
        })
        .attr("y1", function (d) {
            return yScale(y(d)) + rScale(radius(d));
        })
        .attr("x2", function (d) {
            return xScale(x(d));
        })
        .attr("y2", height);
    var yMarkText = d3.select(".all.group")
        .selectAll(".y.mark.text")
        .data(interpolateData(minDate), key);
    yMarkText.enter()
        .append("text")
        .attr("class", "y mark text")
        .attr("text-anchor", "end")
        .attr("dy", "-0.4em")
        .attr("dx", "-0.15em")
        .attr("opacity", 0);
    yMarkText
        .transition()
        .duration(1000)
        //.attr("x", function(d) {return xScale(x(d));})
        //.attr("y", function(d) {return yScale(y(d))+rScale(radius(d));})
        .attr("transform", function (d) {
            return "translate(" + xScale(x(d)) + ", " + (yScale(y(d)) + rScale(radius(d))) + ")rotate(-90)";
        })
        .text(function (d) {
            return prettyNumber(x(d));
        });

    var rMarkLine = d3.select(".all.group")
        .selectAll(".r.mark.line")
        .data(interpolateData(minDate), key);
    rMarkLine.enter()
        .append("line")
        .attr("class", "r mark line")
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("opacity", 0);
    rMarkLine
        .transition()
        .duration(1000)
        .attr("x1", function (d) {
            return rScale(radius(d));
        })
        .attr("x2", function (d) {
            return rScale(radius(d)) + 30;
        })
        .attr("transform", function (d) {
            return "translate(" + xScale(x(d)) + ", " + yScale(y(d)) + ")rotate(160)";
        });
    var rMarkText = d3.select(".all.group")
        .selectAll(".r.mark.text")
        .data(interpolateData(minDate), key);
    rMarkText.enter()
        .append("text")
        .attr("class", "r mark text")
        .attr("text-anchor", "end")
        .attr("y", "0")
        .attr("dy", "1em")
        .attr("dx", "-0.15em")
        .attr("opacity", 0);
    rMarkText
        .transition()
        .duration(1000)
        .attr("x", function (d) {
            return -15 - rScale(radius(d));
        })
        .attr("transform", function (d) {
            return "translate(" + xScale(x(d)) + ", " + yScale(y(d)) + ")rotate(-20)";
        })
        .text(function (d) {
            return prettyNumber(radius(d));
        });

    // Add the overlay interaction
    var box = d3.select(".all.date.group").node().getBBox();
    d3.select(".overlay")
        .on("mouseover", enableInteraction);

    d3.select(".all.date.group")
        .transition()
        .duration(1000)
        //.attr("visibility", "visible")
        .attr("opacity", 1);


    // Let's move time
    d3.select(".all.group")
        .transition()
        .duration(1500)
        .each("end", function () {
            doNotDisplayHour = false;
            //console.log("start moving date "+new Date());
            d3.select(".all.group")
                .transition()
                .duration(5000)
                .ease("linear")
                .tween("date", tweenDate)
                .each("end", enableInteraction);
        });

//	displayHour(minDate);

    // Set the dot positions
    function positionCircle(dotCircle) {
        dotCircle
            .attr("cx", function (d) {
                //if (key(d) === "bibulle") {
                //console.log("positionCircle "+x(d)+" "+y(d)+" "+new Date());
                //}
                return xScale(x(d));
            })
            .attr("cy", function (d) {
                return yScale(y(d));
            })
            .attr("r", function (d) {
                return rScale(radius(d));
            });
    }

    function positionLabel(dotLabel) {
        dotLabel
            .attr("x", function (d) {
                return xScale(x(d)) + rScale(radius(d)) / 2;
            })
            .attr("y", function (d) {
                return yScale(y(d)) - rScale(radius(d)) / 2;
            });
    }

    function order(a, b) {
        return radius(b) - radius(a);
    }


    // Calculate hour from dateS
    function toHour(dateS) {
        return (new Date(dateS).getTime()) / 1000 / 60 / 60;
    }

    function toDate(hour) {
        return new Date(hour * 1000 * 60 * 60);
    }

    // interpolate between dates
    function tweenDate() {
        var hours = d3.interpolate(minDate, maxDate);
        var i = 0;
        return function (t) {
            displayHour(hours(t));
            //console.log(t+" "+hours(t)+" "+minDate+" "+maxDate);
        };
    }

    // display the specified hour
    function displayHour(hour) {
        if (doNotDisplayHour) {
            return;
        }
        //console.log("display hour "+doNotDisplayHour+" "+new Date());
        var dot = d3.select(".all.group")
            .selectAll(".dot")
            .data(interpolateData(hour), key);

        dot.style("fill", function (d) {
            return colorScale(color(d));
        })
            .call(positionCircle)
            .sort(order);

        d3.select(".all.group")
            .selectAll(".name.label")
            .data(interpolateData(hour), key)
            .call(positionLabel);
        d3.select(".all.group")
            .selectAll("line.x.mark")
            .data(interpolateData(hour), key)
            .attr("x1", function (d) {
                return xScale(x(d)) - rScale(radius(d));
            })
            .attr("y1", function (d) {
                return yScale(y(d));
            })
            .attr("x2", 0)
            .attr("y2", function (d) {
                return yScale(y(d));
            });
        d3.select(".all.group")
            .selectAll("text.x.mark")
            .data(interpolateData(hour), key)
            .attr("x", function (d) {
                return xScale(x(d)) - rScale(radius(d));
            })
            .attr("y", function (d) {
                return yScale(y(d));
            })
            .text(function (d) {
                return prettyNumber(y(d));
            });
        d3.select(".all.group")
            .selectAll("line.y.mark")
            .data(interpolateData(hour), key)
            .attr("x1", function (d) {
                return xScale(x(d));
            })
            .attr("y1", function (d) {
                return yScale(y(d)) + rScale(radius(d));
            })
            .attr("x2", function (d) {
                return xScale(x(d));
            })
            .attr("y2", height);
        d3.select(".all.group")
            .selectAll("text.y.mark")
            .data(interpolateData(hour), key)
            .attr("transform", function (d) {
                return "translate(" + xScale(x(d)) + ", " + (yScale(y(d)) + rScale(radius(d))) + ")rotate(-90)";
            })
            .text(function (d) {
                return prettyNumber(x(d));
            });
        d3.select(".all.group")
            .selectAll("line.r.mark")
            .data(interpolateData(hour), key)
            .attr("x1", function (d) {
                return rScale(radius(d));
            })
            .attr("x2", function (d) {
                return rScale(radius(d)) + 30;
            })
            .attr("transform", function (d) {
                return "translate(" + xScale(x(d)) + ", " + yScale(y(d)) + ")rotate(160)";
            });
        d3.select(".all.group")
            .selectAll("text.r.mark")
            .data(interpolateData(hour), key)
            .attr("x", function (d) {
                return -15 - rScale(radius(d));
            })
            .attr("transform", function (d) {
                return "translate(" + xScale(x(d)) + ", " + yScale(y(d)) + ")rotate(-20)";
            })
            .text(function (d) {
                return prettyNumber(radius(d));
            });

        // Set the hour label
        d = toDate(hour);
        d3.select(".date.label").text(format1(d));
        d3.select(".hour.label").text(format2(d));
    }

    // Function get data for the given hour
    function interpolateData(hour) {

        return d3.keys(data).map(function (d) {
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
        if (a === undefined) {
            i = d3.keys(user).length - 1;
            a = user[d3.keys(user)[i]];
        }
        var result = getValue(a, propertyName, user, hour);

        if (i > 0) {
            var b = user[d3.keys(user)[i - 1]],
                t = (hour - a.hour) / (b.hour - a.hour);

            result = result * (1 - t) + getValue(b, propertyName, user, hour) * t;
        }

//		if (tmp !== hour) {
//			console.log(d3.keys(user)[i]+" "+hour+" "+result);
//			tmp = hour;
//		}
        return result;
    }

    // Get the correct value
    function getValue(user, propertyName, fullUser, hour, fullPropertyName) {
        var fullPropertyName = fullPropertyName || propertyName;
        var obj = user;
        var propDone = "";
        propertyName.split('.').every(function (p) {
            propDone += p + ".";
            if (d3.keys(obj).indexOf(p) >= 0) {
                obj = obj[p];
            } else if (p == "length") {
                if (typeof (obj) === "object") {
                    obj = d3.values(obj).length;
                } else {
                    obj = obj.length;
                }
            } else if (p == "sum") {
                var sum = 0;
                d3.values(obj).forEach(function (v) {
                    if (!isNaN(parseFloat(v)) && isFinite(v)) {
                        sum += v;
                    }
                });
                obj = sum;
            } else if (p == "Week") {
                obj = obj - interpolateValues(fullUser, fullPropertyName.replace("." + p, ""), user.hour - (7 * 24));
            } else if (p == "Day") {
                obj = obj - interpolateValues(fullUser, fullPropertyName.replace("." + p, ""), user.hour - 24);
            } else if (p.indexOf("/") == 0) {
                val = eval(p.substr(1));
                obj = obj / val;
            } else if (p.indexOf("+") == 0) {
                //console.log(propDone+" "+obj);
                obj = obj + getValue(user, propertyName.replace(propDone, ""), fullUser, hour, fullPropertyName);
                return false;
            } else {
                obj = 0;
            }
            return true;
        });

        return obj;
    }


    //enable interaction
    function enableInteraction() {
        // Calculate the scale of the movement
        var hourScale = null;
        if (box) {
            hourScale = d3.scale.linear()
                .domain([minDate, maxDate])
                .range([box.x + 10, box.x + box.width - 10])
                .clamp(true);
        }

        // Cancel the current transition, if any.
        d3.select(".all.group").transition().duration(0);

        d3.select(".overlay")
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove)
            .on("touchmove", mousemove);

        function mouseover() {
            d3.select(".date.label").classed("active", true);
            d3.select(".hour.label").classed("active", true);
        }

        function mouseout() {
            d3.select(".date.label").classed("active", false);
            d3.select(".hour.label").classed("active", false);
        }

        function mousemove() {
            displayHour(hourScale.invert(d3.mouse(this)[0]));
        }
    }
};


// get next propetie in the list
function getNextProperties(p) {
    var keys = d3.keys(properties);

    var i = keys.indexOf(p);
    if ((i >= 0) && (i !== keys.length - 1)) {
        return keys[i + 1];
    }
    return keys[0];
}

// get label of a properties
function getPropertyLabel(k) {
    if (k.match(/[.]Week$/)) {
        return properties[k.replace(/[.]Week$/, "")] + " (semaine)";
    }
    if (k.match(/[.]Day$/)) {
        return properties[k.replace(/[.]Day$/, "")] + " (jour)";
    }
    return properties[k];
}


function prettyNumber(f) {
    if (Math.abs(f - Math.floor(f)) < 0.1) {
        return d3.format(",")(d3.round(f));
    } else {
        return d3.format(",")(d3.round(f, 1));
    }

}

function showMenu(x, y, topleft, prop, callback) {
    var html = "<table>";
    d3.keys(properties).forEach(function (k) {
        class1 = "";
        class2 = "";
        class3 = "";
        if (k === prop) {
            class1 = "selected"
        }
        if (k + ".Week" === prop) {
            class2 = "selected"
        }
        if (k + ".Day" === prop) {
            class3 = "selected"
        }
        html += "<tr>";
        html += "<td key='" + k + "' class='" + class1 + "'>" + properties[k] + "</td>";
        html += "<td key='" + k + ".Week' class='" + class2 + "'>Semaine</td>";
        html += "<td key='" + k + ".Day' class='" + class3 + "'>Jour</td>";
        html += "</tr>";
    });

    style = {};
    if (topleft) {
        style = {
            right: null,
            left: (document.getElementById("chart").offsetLeft + margin.left + x) + "px",
            top: (document.getElementById("chart").offsetTop + margin.top + y) + "px",
            bottom: null
        };
    } else {
        style = {
            right: (margin.right + x) + "px",
            left: null,
            top: null,
            bottom: (margin.bottom + y) + "px"
        };
    }

    d3.select("#menubox")
        .html(html)
        .style({display: "block"})
        .transition()
        //.duration(500)
        .style(style)
        .each("end", function () {
            d3.selectAll("#menubox td")
                .on("click", function () {
                    if (this.getAttribute("key")) {
                        d3.select("#menubox")
                            .transition()
                            .style({display: "none"});
                        callback(this.getAttribute("key"));
                    }
                });
        });

}

