// some margins for our graph (left is large because we want to leave space for label names)
var margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 150
};

// selects body DOM element and creates an SVG element under it
var svg = d3.select('body').append('svg')
    .attr('width', window.innerWidth - window.innerWidth*.2)
    .attr('height', window.innerHeight);

// define the height and width of our chart (subtract 20% of the width to leave space)
var width = window.innerWidth - window.innerWidth*.2;
var height = window.innerHeight - margin.top - margin.bottom;

// x and y scales of the visualization's viewport
var x = d3.scaleLinear().rangeRound([0, width - window.innerWidth*.2]);
var y = d3.scaleBand().rangeRound([0, height - 20]).padding(0.1);

// define a group under svg and transform using the SVG 'translate' attribute (https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)
var g = svg.append('g')
.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


// load the data (csv file) into d3
d3.csv('Film_Locations_in_San_Francisco.csv', function(data) {
	// data are ready to use 

    // Aggregate the datapoints by Director.
	var directorCountMap = {};
    // One movie can have multiple datapoints which multiple directors.
    // We want the number of movies filming in S.F. with that directors to be distinct
	var movieMap = {};

	data.forEach(function(datnum) {
		// check to make sure that the Director exists and have a movie name
		if (datnum.Director === undefined || datnum.Title === undefined) {
			return;
		}
        // Initialize to 0 if that director not in map yet
		if (directorCountMap[datnum.Director] === undefined) {
            directorCountMap[datnum.Director] = 0;
        }
        // If the movie is not exists in movie map, add 1 to directorCount map
        // Else duplicates => we do nothing
        if (movieMap[datnum.Title] === undefined) {
       		directorCountMap[datnum.Director] += 1;
       		movieMap[datnum.Title] = 1;
       	}
	});

    // Make an array for the mapping to store the name and count
	var directorCount = [];
    Object.keys(directorCountMap).forEach(function(mapKey) {
        directorCount.push({
            name: mapKey,
            count: directorCountMap[mapKey]
        });
    });

    // More than 200 directors in the dataset, we want to sort directors by count
    //(https://stackoverflow.com/questions/39302871/filter-and-sort-a-javascript-array)
    directorCount.sort(function(a , b) {
        return b.count - a.count;
    });

    // Save and slice the top 10 
    directorCount = directorCount.slice(0,10);

    // count is mapped to x-axis
    x.domain([0, d3.max(directorCount, function(d) {
        return d.count;
    })]);
    // director name is mapped to y-axis position
    y.domain(directorCount.map(function(d) {
        return d.name;
    }));

    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);

    // Adding the x-axis
    g.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + (height - 20) + ')')
        .call(xAxis);

    // Adding the y-axis
    g.append('g')
        .attr('class', 'axis axis--y')
        .call(yAxis.ticks(10))
        // Add the text label for y-axis
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .text('Count');

    g.selectAll('.bar')
        .data(directorCount)
        .enter().append('rect')
        .attr('class', 'bar')
        // horizontal bar all x starts at 0
        .attr('x', 0)
        // vertical will be scaled based on name
        .attr('y', function(d) {
            return y(d.name);
        })
        .attr('width', function(d) {
            return x(d.count);
        })
        .attr('height', y.bandwidth())
        // color of the bar graph
        .attr('fill', 'rgb(78,121,167)')
        .on('mouseover', function(datnum, index, nodes) {
            // select our tooltip
            var tooltip = d3.select('#myTooltip');

            // display the tooltip
            tooltip.style('display', 'block');

            // set the initial position of the tooltip
            tooltip.style('left', d3.event.pageX + 'px');
            tooltip.style('top', d3.event.pageY + 'px');

            // set tooltip to show the director name and the count of movies
            tooltip.html(datnum.name + ': ' + datnum.count);
        })
        .on('mousemove', function(datnum, index, nodes) {
            // select our tooltip
            var tooltip = d3.select('#myTooltip');

            // update the position if mouse moves within element
            tooltip.style('left', d3.event.pageX + 'px');
            tooltip.style('top', d3.event.pageY + 'px');
        })
        .on('mouseleave', function(datnum, index, nodes) {
            // select our tooltip 
            var tooltip = d3.select('#myTooltip');

            // hide tooltip if mouse leaves the element
            tooltip.style('display', 'none');
        });
})

// create a text element for the x-axis label 
svg.append('text')
        .attr('x', width/2)
        .attr('y', height + 40)
        .style('text-anchor','middle')
        .text('Number of Movies')