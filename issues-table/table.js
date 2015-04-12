// global vars
var $graphic = null;
var pymChild = null;

var SIZE = 35;
var HORIZONTAL_GAP = 10;
var Y_OFFSET = 20;
var BAR_GAP = 10;
var BAR_GAP_INNER = 2;
var GRAPHIC_DATA_URL = 'data.csv';
var GRAPHIC_DEFAULT_WIDTH = 600;
var LABEL_MARGIN = 6;
var LABEL_WIDTH = 40;
var MOBILE_THRESHOLD = 500;
var VALUE_MIN_WIDTH = 25;

var legend_labels = {
    'Tuition and fees':'T',
    'Academic experience':'A',
    'Mental health':'M',
    'Sexual assault':'S',
    'Sustainability':'N',
    'Diversity':'D',
    'Crime':'C',
    'Divestment':'V'
};



var colors = {
    'A': 0,
    'T': 1,
    'S': 2,
    'M': 3,
    'N': 4,
    'D': 5,
    'C': 6,
    'V': 7,
    'X': 8
}


var cb = ['rgb(166,206,227)','rgb(31,120,180)','rgb(178,223,138)','rgb(51,160,44)','rgb(251,154,153)','rgb(227,26,28)','rgb(253,191,111)','rgb(255,127,0)','white']

var color;
var graphicData;
var labels;

var isMobile = false;

// D3 formatters
var fmtComma = d3.format(',');
var fmtYearAbbrev = d3.time.format('%y');
var fmtYearFull = d3.time.format('%Y');


/*
 * Initialize
 */
var onWindowLoaded = function() {
    if (Modernizr.svg) {
        $graphic = $('#graphic');

        d3.csv(GRAPHIC_DATA_URL, function(error, data) {
            labels = data[0];

            graphicData = data;

            color = d3.scale.ordinal()
                //.range([colors['blue1'], colors['blue4'], colors['teal3'], colors['teal5']])
                .range(cb)
                .domain(d3.keys(graphicData[0]).filter(function(key) { return key !== 'Group'; }));

            graphicData.forEach(function(d) {
                d['key'] = d['Group'];
                d['value'] = [];
                color.domain().map(function(name) {
                    d['value'].push({ 'label': name, 'amt': d[name]});
                    delete d[name];
                });
                delete d['Group'];

            });

            pymChild = new pym.Child({
                renderCallback: render
            });
        });
    } else {
        pymChild = new pym.Child({ });
    }
}


/*
 * RENDER THE GRAPHIC
 */
var render = function(containerWidth) {
    // fallback if page is loaded outside of an iframe
    if (!containerWidth) {
        containerWidth = GRAPHIC_DEFAULT_WIDTH;
    }

    // check the container width; set mobile flag if applicable
    if (containerWidth <= MOBILE_THRESHOLD) {
        isMobile = true;
    } else {
        isMobile = false;
    }

    // clear out existing graphics
    $graphic.empty();

    // draw the new graphic
    // (this is a separate function in case I want to be able to draw multiple charts later.)
    drawGraph(containerWidth);

    // update iframe
    if (pymChild) {
        pymChild.sendHeight();
    }
}


var drawGraph = function(graphicWidth) {
    var graph = d3.select('#graphic');
    var margin = {
        top: 0,
        right: 15,
        bottom: 20,
        left: (LABEL_WIDTH + LABEL_MARGIN)
    };
    var numGroups = graphicData.length;
    var numGroupBars = graphicData[0]['value'].length;
    var groupHeight = SIZE;
    var ticksX = 7;

    // define chart dimensions
    var width = graphicWidth - margin['left'] - margin['right'];
    var height = ((SIZE + BAR_GAP) * numGroups) - BAR_GAP + BAR_GAP_INNER;

    var x = d3.scale.linear()
        .domain([0,100])
        .range([0, width]);

    var y = d3.scale.linear()
        .range([ height, 0 ]);

    // define axis and grid
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .ticks(ticksX)
        .tickFormat(function(d) {
            return d.toFixed(0) + '%';
        });

    var xAxisGrid = function() {
        return xAxis;
    }

    // draw the legend

    var legend = graph.append('ul')
        .attr('class', 'key')
        .selectAll('g')
            .data(Object.keys(legend_labels))
        .enter().append('li')
            .attr('class', function(d, i) {
                console.log('test');
                return 'key-item key-' + i + ' ' + classify(d);
            });
    legend.append('b')
        .style('background-color', function(d) {
        	return cb[colors[legend_labels[d]]];
        })
        .attr('class',function(d){
            return legend_labels[d];
        });
    legend.append('label')
        .text(function(d) {
            console.log(d);
            return d;
        });

    // draw the chart
    var chart = graph.append('div')
        .attr('class', 'chart');

    var svg = chart.append('svg')
        .attr('width', width + margin['left'] + margin['right'])
        .attr('height', height + margin['top'] + margin['bottom'])
        .append('g')
        .attr('transform', 'translate(' + margin['left'] + ',' + margin['top'] + Y_OFFSET + ')');
        //.attr('transform', 'translate(0,' + margin['top'] + ')');


    // draw the bars
    var barGroup = svg.selectAll('.bars')
        .data(graphicData)
        .enter().append('g')
            .attr('class', 'g bars')
            .attr('transform', function(d,i) {
                if (i == 0) {
                    return 'translate(0,1)';
                } else {
                    return 'translate(0,' +  ((groupHeight + BAR_GAP) * i) + ')';
                }
            });

    barGroup.selectAll('rect')
        .data(function(d) { return d['value']; })
        .enter().append('rect')
            .attr('height', SIZE)
            .attr('x', function(d, i) {
                return (SIZE + HORIZONTAL_GAP) * i;
            })
            .attr('y', function(d, i) {
                return 0;
            })
            .attr('width', function(d) {
                return SIZE;
            })
            .style('fill', function(d) {
            	return cb[colors[d['amt']]];
            })
            .attr('class', function(d) {
                return d['amt'];
            })
            .on('mouseover', function(d) {
                if (d['amt'] != 'X') {
                d3.selectAll('.' + d['amt'])
                    .classed('active', true)
                }
            })
            .on('mouseout', function(d) {
                d3.selectAll('.' + d['amt'])
                    .classed('active', false)
            })

            /*.attr('class', function(d) {
                return 'y-' + d['label'];
            })*/;

    // draw labels for each bar
    var labels = chart.append('ul')
        .attr('class', 'labels')
        .attr('style', 'width: ' + LABEL_WIDTH + 'px; top:' + (Y_OFFSET + 4) + 'px; left: 0;')
        .selectAll('li')
            .data([1,2,3,4,5,6,7,8])
        .enter().append('li')
            .attr('style', function(d,i) {
                var s = '';
                s += 'width: ' + (margin['left'] - 40) + 'px; ';
                s += 'height: ' + SIZE + 'px; ';
                s += 'left: ' + 0 + 'px; ';

                if (i == 0) {
                    s += 'top: 0px; ';
                } else {
                    s += 'top: ' + ((groupHeight + BAR_GAP) * i) + 'px; ';
                }
                return s;
            })
            /*.attr('class', function(d,i) {
                return classify(d);
            })*/
            .append('span')
                .text(function(d) {
                    return d
                });

    //draw horizontal axis labels

    var labels = chart.append('ul')
        .attr('class', 'labels')
        .attr('style', 'width: ' + LABEL_WIDTH + 'px; top: -15px; left: 0;')
        .selectAll('li')
            .data(graphicData[0].value)
        .enter().append('li')
            .attr('style', function(d,i) {
                var s = '';
                //s += 'width: ' + (margin['left']) + 'px; ';
                s += 'width: ' + SIZE + 'px; ';
                s += 'height: ' + SIZE + 'px; ';
                s += 'left: ' + (LABEL_WIDTH + 5 + ((SIZE + HORIZONTAL_GAP) * (i))) + 'px; ';
                s += 'top: 0px; ';

                return s;
            })

            .append('label')
                .text(function(d,i) {
                    return d.label;
                })
                .attr('class','horizontal-label')
                .attr('style','text-anchor: left');


                
}


/*
 * HELPER FUNCTIONS
 */
var classify = function(str) { // clean up strings to use as CSS classes
    return str.replace(/\s+/g, '-').toLowerCase();
}


/*
 * Initially load the graphic
 * (NB: Use window.load instead of document.ready
 * to ensure all images have loaded)
 */
$(window).load(onWindowLoaded);