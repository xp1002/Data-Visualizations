function SunburstChart(container, data, initialDepartment) {

    var margin = {
        top: 50,
        right: 50,
        bottom: 30,
        left: 80
    };

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

    var radius = Math.min(width, height) / 2;
    // var color = d3.scaleOrdinal(d3.schemeCategory20b);
    var color = d3.scaleOrdinal(['#386FA4', '#59A5D8','#62BCE5','#8ECEDB']);

    var g = svg.append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    this.update = function(data, targetDepartment){

    g.selectAll('*').remove();
    // console.log(targetDepartment);
    if (targetDepartment.length > 0) {
        var data = data.filter(function(d,i){
            return targetDepartment.includes(d.Department);
        });
    }

    var depChild = [];

    var dep = data.map(item => item.Department)
        .filter((value, index, self) => self.indexOf(value) === index)
    // console.log(dep);

    for(var keys in dep) {
        var depart = data.filter(val => {return val.Department == dep[keys]; });

        var role = depart.map(item => item.JobRole)
        .filter((value, index, self) => self.indexOf(value) === index)

        var eduChild = [];
        for(var rolekeys in role) {
            var educ = depart.filter(val => {return val.JobRole == role[rolekeys]; });
            //console.log(role[rolekeys]);

            var eduCount = d3.nest()    
                .key(function(d) {
                    return d["EducationField"];
                })
                .rollup(function(v) { 
                    return v.length;
                })
                .entries(educ);

            var eachrole = {"name":role[rolekeys], "children": eduCount};
            eduChild.push(eachrole);
        }

        var eachdep = {"name": dep[keys], "children": eduChild};
        if (targetDepartment.length != 1) {
           depChild.push(eachdep);
       }
    }

    if (targetDepartment.length == 1) {
        var dataArr = eachdep;
    } else {
        var dataArr = {"name": "Department", "children":depChild};
    }
    // console.log(dataArr);
    // structure reference: https://bl.ocks.org/denjn5/f059c1f78f9c39d922b1c208815d18af
    function filter_min_arc_size_text(d, i) {return (d.dx*d.depth*radius/3)>14}; 

    // data structure
    var partition = d3.partition().size([2 * Math.PI, radius]);

    var rootNode = d3.hierarchy(dataArr)
        .sum(function (d) { return d.value});
    //console.log(rootNode);

    // Size arcs
    partition(rootNode);
    var arc = d3.arc()
        .startAngle(function (d) { return d.x0 })
        .endAngle(function (d) { return d.x1 })
        .innerRadius(function (d) { return d.y0 })
        .outerRadius(function (d) { return d.y1 });

    // Put it all together
    g.selectAll('path')
        .data(rootNode.descendants())
        .enter().append('g').attr("class", "node").append('path')
        .attr("display", function (d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .style('stroke', '#fff')
        .style("fill", function (d) { return color((d.children ? d : d.parent).data.name); })
        // .style("fill", function (d) { console.log(d.children.depth); return color(d.data.name); })
        .on("mouseover", mouseOverArc)
        .on("mousemove", mouseMoveArc)
        .on("mouseout", mouseOutArc);

    g.selectAll(".node") 
        .append("text") 
        .attr("transform", function(d) {
            // console.log(arc.centroid(d));
            return "translate(" + arc.centroid(d) + ")rotate(" + computeTextRotation(d) + ")"; }) 
        .attr("dx", "5") 
        .attr("dy", ".5em")
        .style("text-anchor", "middle")
        // .attr("font-weight","bold")
        .text(function(d) { return d.parent ? (d.data.name || d.data.key) : "" });


    g.append("text")
        .attr("dx", "0") 
        .attr("dy", "-10")
        .style("text-anchor", "middle")
        .text("Distribution of Job ");

    g.append("text")
        .attr("dx", "2") 
        .attr("dy", "10")
        .style("text-anchor", "middle")
        .text("Roles and Education");

    g.append("text")
        .attr("dx", "3") 
        .attr("dy", "30")
        .style("text-anchor", "middle")
        .text("in Departments");

    //Tooltip description
    var tooltip = d3.select("#tooltip")

    function format_number(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function format_description(d) {
        if(d.data.key === undefined) {
            return '<b>' + d.data.name + '</b>' + '<br> (' + format_number(d.value) + ')';
        }
        return  '<b>' + d.data.key + '</b>' + '<br> (' + format_number(d.value) + ')';
    }

    function mouseOverArc(d) {
            d3.select(this).attr("stroke","black")
             
          tooltip.html(format_description(d));
          return tooltip.transition()
            .duration(50)
            .style("opacity", 0.9);
        }

    function mouseOutArc(){
        d3.select(this).attr("stroke","")
        return tooltip.style("opacity", 0);
    }

    function mouseMoveArc (d) {
              return tooltip
                .style("top", (d3.event.pageY-10)+"px")
                .style("left", (d3.event.pageX+10)+"px");
    }

    };

    function computeTextRotation(d) {
        var angle = (d.x0 + d.x1) / Math.PI * 90;

        // Avoid upside-down labels
        return (angle < 120 || angle > 270) ? angle : angle + 180;  // labels as rims
        //return (angle < 180) ? angle - 90 : angle + 90;  // labels as spokes
    }

    this.update(data, initialDepartment);
            
}