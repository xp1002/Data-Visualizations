console.log('Hello from main.js');

d3.selectAll("text").attr("fill", "white");

function change(value) {
    initial(value);
}

// read in our CSV file
function initial(attrition) {

d3.csv('WA_Fn-UseC_-HR-Employee-Attrition.csv',
    function(datum){ 
        // get all of our data into the requisite format first
        return {
            "Age": +datum["Age"],
            "Attrition": datum["Attrition"],
            "HomeDistance" : +datum["DistanceFromHome"],
            "SalaryHike" : +datum["PercentSalaryHike"],
            "MaritalStatus": datum["MaritalStatus"],
            "Department": datum["Department"],
            "Education": datum['Education'],
            "EducationField": datum["EducationField"],
            "JobRole": datum["JobRole"],
            "Income": +datum["MonthlyIncome"],
            "YearsAtCompany": +datum["YearsAtCompany"]
        };
    }, function(data) {

        // create our bar chart;
        if(attrition != "Both") {
            var data = data.filter(function(d) {
                    return d['Attrition'] === attrition;
            });
        }
        d3.selectAll("svg").remove(); 

        var barChart = new BarChart(d3.select(".vis2"), data, 
            function() {
                sunburstChart.update(barChart.newData, barChart.selectedTerminal);
            });

        var sunburstChart = new SunburstChart(d3.select(".vis1"), data, function() {});
        var parallelChart = new ParallelChart(d3.select(".vis3"), data, function() {
            barChart.update(parallelChart.newData);
            sunburstChart.update(parallelChart.newData,[]);
        });
    });
}

initial("Both");