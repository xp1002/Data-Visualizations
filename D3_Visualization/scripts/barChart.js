// this is a javascript 'constructor'; `this` is the BarChart object, which we attach variables to
// this is largely the same as the previous bar chart examples until line ~134, where we introduce 
// the .on('click') event handler which handles the click event on the bars
function BarChart(container, data, onUpdate) {
    // some margins for our graph (so it fits our SVG viewport nicely)
    var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 80
    };

    this.onUpdate = onUpdate;

    // get the bounding box of our container
    var boundingBox = container.node().getBoundingClientRect();

    // set our width and height based on the container's bounding box
    var width = boundingBox.width;
    var height = boundingBox.height;

    // create our SVG canvas and give it the height and width we want
    var svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    // height and width of our chart
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;

    // x and y scales, the input domain is our data and the output range
    // is a position value within the visualization's viewport
    var x = d3.scaleBand().rangeRound([0, chartWidth]).padding(0.1);
    var y = d3.scaleLinear().rangeRound([chartHeight, margin.top]);

    // define a group for our visualization
    // this is good practice (to keep things clustered into their relevant groups),
    // and lets you manipulate the entire group
    var g = svg.append('g')


    this.update = function(data) {

        // console.log(data);
        var departmentCount = d3.nest()
            .key(function(d) { 
                return d["Department"]; 
            })
            .rollup(function(v) { 
                return v.length;
            })
            .entries(data);

        // console.log(terminalCount);

        x.domain(data.map(function(d) {
            return d.Department
        }));

        y.domain([0, d3.max(departmentCount, function(d) {
            return d.value;
        })]);

        // remove all of our axes (this could be animated as well, but I don't do that here)
        g.selectAll('.axis').remove();

        g.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(' + margin.left + ',' + chartHeight + ')')
            .call(d3.axisBottom(x));

        g.append('g')
            .attr('class', 'axis axis--y')
            .attr('transform', 'translate(' + margin.left + ', 0)')
            .call(d3.axisLeft(y).ticks(10))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '0.71em')
            .attr('text-anchor', 'end')
            .text('Count');

        g.selectAll('.bar').remove();
        var enterBars = g.selectAll('.bar')
            .data(departmentCount)
            .enter()
            .append('rect')
            .attr('class', 'bar');

        // console.log(departmentCount);

        svg.selectAll("text.bar").remove();
        
        svg.selectAll("text.bar")
            .data(departmentCount)
            .enter().append("text")
            .attr("class", "bar")
            .attr("text-anchor", "middle")
            .attr("x", function(d) { return x(d.key) + margin.left * 2 ; })
            .attr("y", function(d) { return y(d.value) - 8; })
            .text(function(d) { return d.value; });

        // console.log(departmentCount);


        this.updatePositions = function(selection) {

            var selected = [];
            var depSelected = [];
            var thisObject = this;
            selection
                .attr('x', function(d) {
                    return margin.left + x(d.key);
                })
                .attr('y', function(d) {
                    return y(d.value);
                })
                .attr('width', x.bandwidth())
                .attr('height', function(d) {
                    return chartHeight - y(d.value);
                })
                .attr('fill', function() {
                    return "#386FA4";
                })
                .on('mouseover', function(d) {
                    d3.select(this).style("cursor", "pointer"); 
                  })
                .on('click', function(datum, index, nodes){
                    if(selected.includes(index)) {
                        selected.splice(selected.indexOf(index), 1);
                        depSelected.splice(depSelected.indexOf(datum.key), 1);
                    } else {
                        selected.push(index);
                        depSelected.push(datum.key);
                    }
                    if(selected.length > 0){
                        d3.selectAll('.bar').style("fill", '#59A5D8').attr('opacity','0.7');
                        for(var num in selected) {
                            d3.selectAll('.bar').filter(function(d,i) {return i == selected[num]}).style("fill", "#386FA4").attr('opacity','1');
                        }
                    } 
                    if (selected.length == 0 || selected.length == 3){
                        depSelected = [];
                        selected = [];
                        d3.selectAll('.bar').style("fill", "#386FA4").attr('opacity','1');
                    }
                    thisObject.selectedTerminal = depSelected;
                    thisObject.newData = data;
                    thisObject.onUpdate();
                });

            return selection;
        }

        //updatePositions(enterBars);
        this.updatePositions(g.selectAll('.bar'));

    }

    // do our initial update with our initial data
    this.update(data);
}
