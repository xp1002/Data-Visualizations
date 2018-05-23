function ParallelChart(container, data, onUpdate) {

	var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 80
    };

    this.onUpdate = onUpdate;

    var thisObject = this;

    // get the bounding box of our container
    var boundingBox = container.node().getBoundingClientRect();

    // set our width and height based on the container's bounding box
    var bwidth = boundingBox.width;
    var bheight = boundingBox.height;

    // height and width of our chart
    var width = bwidth - margin.left - margin.right ;
    var height = bheight - margin.top - margin.bottom;

    // create our SVG canvas and give it the height and width we want
    var svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);

    var x = d3.scaleBand().rangeRound([0, width]).padding(1);
    var y = {};
    var dragging = {};

    var line = d3.line(); 
    var background, foreground, extents;

    // svg.append("text").attr("fill","");

    svg.append("g")
    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // reference: http://plnkr.co/edit/TiM6ZsvMTTBhh8ZdMoFQ?p=preview
    // Extract the list of dimensions and create a scale for each
    dimensions = ["Age", "HomeDistance", "Income", "SalaryHike", "YearsAtCompany"];

    x.domain(dimensions);

    // check if numeric or categorical variable
    var var_type = function(v){return (parseFloat(v) == v) || (v == "")}; 

	function position(d) {
	  var v = dragging[d];
	  return v == null ? x(d) : v;
	}

	function transition(g) {
	  return g.transition().duration(500);
	}

	// Returns the path for a given data point.
	function path(d) {
	  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
	}

	function brushstart() {
	  d3.event.sourceEvent.stopPropagation();
	}

	// Handles a brush event, toggling the display of foreground lines.
	function brush_parallel_chart() {  
		// var index;  
	    for(var i=0;i<dimensions.length;++i){
	        if(d3.event.target==y[dimensions[i]].brush) {
	            extents[i]=d3.event.selection.map(y[dimensions[i]].invert,y[dimensions[i]]);
	            // column = dimensions[i];
	            // index = i;
	        }
	    }
	    //var newData = [];
	    foreground.style("display", function(d) {
	        //newData.push(d);
	        return dimensions.every(function(p, i) {
	            if(extents[i][0]==0 && extents[i][0]==0) {
	                return true;
	            }
	          return extents[i][1] <= d[p] && d[p] <= extents[i][0];
	        }) ? null : "none";
	    });
	}

	function brush_reset() {
		// select empty, restore
		if(!d3.event.selection) {
			for(var i=0;i<dimensions.length;++i){
				if (d3.event.target==y[dimensions[i]].brush) {
					extents[i]=[0,0];
				}
			}
		}
		
		var index = [];
		for(var i=0;i<dimensions.length;++i){
	        if(extents[i][0]!=0 && extents[i][0]!=0) {
	            index.push(i); 
	        }
	    }; 

		foreground.style("display", function(d) {
	        return dimensions.every(function(p, i) {
	            if(extents[i][0]==0 && extents[i][0]==0) {
	                return true;
	            }
	          return extents[i][1] <= d[p] && d[p] <= extents[i][0];
	        }) ? null : "none";
	    });
	   	// console.lodex);
	    var newData = data;
	    for (var num in index) {
	    	newData = newData.filter(function(d) {
	  			return (
	  				d[dimensions[index[num]]] < extents[index[num]][0] && d[dimensions[index[num]]] > extents[index[num]][1]
	  			);
  			});
	    }
	   	thisObject.newData = newData;
	    thisObject.onUpdate();
	}

    // update function that clears and redraws the chart based on the selected bar 
    this.update = function(data, targetDepartment){

    	//var thisObject = this;

    	svg.selectAll('*').remove();
    	if (targetDepartment.length > 0) {
        	var data = data.filter(function(d,i){
            	return targetDepartment.includes(d.Department);
        	});
    	}

	    dimensions.forEach(function(d) {
	    	
	    	// array of values for each variable
	    	var vals = data.map(function(p) {return p[d];}); 
	    	// if true: numerical variable, else false: categorical
	    	if (vals.every(var_type)){
	     		y[d] = d3.scaleLinear()
	        			.domain(d3.extent(data, function(p) { return +p[d]; }))
	        			.range([height - 10 , 50])
	      	} else{           
	      		y[d] = d3.scalePoint()
	          			.domain(vals.filter(function(v, i) {return vals.indexOf(v) == i;}))
	          			.range([height - 10 , 50],1);}
	    });

	  	extents = dimensions.map(function(p) { return [0,0]; });

	  	// Add grey background lines for context.
		background = svg.append("g")
		      		.attr("class", "background")
		    		.selectAll("path")
		      		.data(data)
		    		.enter().append("path")
		      		.attr("d", path);

		// Add blue foreground lines for focus.
	  	foreground = svg.append("g")
	      			.attr("class", "foreground")
	    			.selectAll("path")
	      			.data(data)
	    			.enter().append("path")
	      			.attr("d", path)
	      			.attr("opacity","0.4");

		//Add a group element for each dimension.
	  	var g = svg.selectAll(".dimension")
	    		  	.data(dimensions)
	    			.enter().append("g")
	      			.attr("class", "dimension")
	      			.attr("transform", function(d) {  return "translate(" + x(d) + ")"; })
	      			.call(d3.drag()
		        		.subject(function(d) { return {x: x(d)}; })

		        		.on("start", function(d) {
		          			dragging[d] = x(d);
		          			background.attr("visibility", "hidden");
		        		})

		        		.on("drag", function(d) {
		          			dragging[d] = Math.min(width, Math.max(0, d3.event.x));
		          			foreground.attr("d", path);
		          			dimensions.sort(function(a, b) { return position(a) - position(b); });
		          			x.domain(dimensions);
		          			g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
		        		})

		        		.on("end", function(d) {
		          			delete dragging[d];
		          			transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
		          			transition(foreground).attr("d", path);
		          			background.attr("d", path)
		            				.transition()
		              				.delay(500)
		              				.duration(0)
		              				.attr("visibility", null);
		        		})
	        		);

		// Add an axis and title.
		g.append("g")
		  		.attr("class", "axis")
		      	.each(function(d) {  d3.select(this).call(d3.axisLeft(y[d]));})
		    	.append("text")
		      	.attr("fill", "black")
		      	.style("text-anchor", "middle")
		      	.attr("y", 40) 
		      	.text(function(d) { return d; });

		// Add and store a brush for each axis.
	  	g.append("g")
	      		.attr("class", "brush")
	      		.each(function(d) {
	        		d3.select(this).call(y[d].brush = d3.brushY().extent([[-8, 0], [8,height]]).on("brush", brush_parallel_chart).on("end", brush_reset));
	      		})
	    		.selectAll("rect")
	      		.attr("x", -8)
	      		.attr("width", 16);

	}

	this.update(data, onUpdate);

}
