const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// SHARED
var mean = 0;
var std = 2;
var num_random_values = 60
var random_x_values = []
for (let i = 0; i < num_random_values; i++) {
    random_x_values.push(rnorm(mean, std));
}
// DATA SETS
var data_sets = []
var focus_sets = []
var data_sets_3 = []
var focus_sets_3 = []

for (let i = 0; i < num_random_values; i++) {
    const step = 0.1
    const x_data = d3.range(-10, 10, step)

    // Generate data for PLOT 1
    const y_data = x_data.map(x => log_dnorm(random_x_values[i], x, std))
    const data = x_data.map(function (x, j) { return { x: x, y: y_data[j] } });
    data_sets.push(data);

    // Generate data for PLOT 3
    const y_data_3 = x_data.map(x => derivative_log_dnorm(random_x_values[i], x, std))
    const data_3 = x_data.map(function (x, j) { return { x: x, y: y_data_3[j] } });
    data_sets_3.push(data_3);
}


// PLOT 1
function plot_1() {
    var svg = d3.select("#plot1")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .domain([-10, 10])
        .range([ 0, width ]);
    const y = d3.scaleLinear()
        .domain([-5, 0])
        .range([ height, 0 ]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));
    svg.append("g")
      .call(d3.axisLeft(y));

    for (let i = 0; i < num_random_values; i++) {
        svg.append("path")
          .datum(data_sets[i])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-opacity", 0.3)
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(function(d) { return x(d.x) })
            .y(function(d) { return y(d.y) })
          )
    }

    for (let i = 0; i < num_random_values; i++) {
        // Create the circle that travels along the curve of chart
        var focus = svg
            .append('g')
            .append('circle')
                .attr("stroke", "black")
                .attr('r', 2)
        focus_sets.push(focus);
    }

    // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg
        .append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mousemove', mousemove);


    // This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function(d) { return d.x; }).left;

    function mousemove() {
        // recover coordinate we need
        var p = d3.pointer(event, this);
        var p_x = p[0];
        var x0 = x.invert(p_x);
        update(x0);
    }

    function update(x0) {
        y_values_1 = []
        y_values_3 = []

        for (let i = 0; i < num_random_values; i++) {
            // PLOT 1 & 2 STUFF
            let data = data_sets[i]
            let focus = focus_sets[i]
            var j = bisect(data, x0, 1);
            var selectedData = data[j]
            focus
                .attr("cx", x(selectedData.x))
                .attr("cy", y(selectedData.y))
            y_values_1.push(selectedData.y)

            // PLOT 3 & 4 STUFF
            let data_3 = data_sets_3[i]
            let focus_3 = focus_sets_3[i]
            var selectedData_3 = data_3[j]
            focus_3
                .attr("cx", x3(selectedData_3.x))
                .attr("cy", y3(selectedData_3.y))
            y_values_3.push(selectedData_3.y)
        }

        update_plot_2(y_values_1);
        update_plot_4(y_values_3);
    }
}


// PLOT 2
var svg2 = d3.select("#plot2")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

var x2 = d3.scaleLinear()
    .domain([-10, 0])
    .range([margin.left, width - margin.right]);
var y2 = d3.scaleLinear()
    .domain([0, 0.5])
    .range([height - margin.bottom, margin.top]);

svg2.append("g")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")")
    .call(d3.axisBottom(x2))
  .append("text")
    .attr("x", width - margin.right)
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "end")
    .attr("font-weight", "bold");
svg2.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y2).ticks(null, "%"));
var svg2_histogram = svg2.insert("g")
    .attr("fill", "#bbb")
    .attr("fill-opacity", 0.5)
var svg2_path = svg2.append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")

function update_plot_2(values=[]) {
    var num_bins = 40
    var n = values.length
    var bins = d3.histogram().domain(x2.domain()).thresholds(num_bins)(values)
    var density = kernelDensityEstimator(kernelEpanechnikov(7), x2.ticks(num_bins))(values)

    svg2_histogram
        .selectAll("rect")
        .data(bins)
            .attr("x", function(d) { return x2(d.x0) + 1; })
            .attr("y", function(d) { return y2(d.length / n); })
            .attr("width", function(d) { return x2(d.x1) - x2(d.x0) - 1; })
            .attr("height", function(d) { return y2(0) - y2(d.length / n); })
        .enter()
        .append("rect")
            .attr("x", function(d) { return x2(d.x0) + 1; })
            .attr("y", function(d) { return y2(d.length / n); })
            .attr("width", function(d) { return x2(d.x1) - x2(d.x0) - 1; })
            .attr("height", function(d) { return y2(0) - y2(d.length / n); });

    svg2_path
        .datum(density)
        .attr("d", d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return x2(d[0]); })
            .y(function(d) { return y2(d[1]); }));
}


// PLOT 3
var svg3 = d3.select("#plot3")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const x3 = d3.scaleLinear()
    .domain([-10, 10])
    .range([ 0, width ]);
const y3 = d3.scaleLinear()
    .domain([-10, 10])
    .range([ height, 0 ]);
svg3.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x3));
svg3.append("g")
  .call(d3.axisLeft(y3));

function plot_3() {
    for (let i = 0; i < num_random_values; i++) {
        svg3.append("path")
          .datum(data_sets_3[i])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-opacity", 0.3)
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(function(d) { return x3(d.x) })
            .y(function(d) { return y3(d.y) })
          )
    }

    for (let i = 0; i < num_random_values; i++) {
        // Create the circle that travels along the curve of chart
        var focus = svg3
            .append('g')
            .append('circle')
                .attr("stroke", "black")
                .attr('r', 2)
        focus_sets_3.push(focus);
    }
}


// PLOT 4
var svg4 = d3.select("#plot4")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

var x4 = d3.scaleLinear()
    .domain([-10, 10])
    .range([margin.left, width - margin.right]);
var y4 = d3.scaleLinear()
    .domain([0, 0.5])
    .range([height - margin.bottom, margin.top]);

svg4.append("g")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")")
    .call(d3.axisBottom(x4))
  .append("text")
    .attr("x", width - margin.right)
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "end")
    .attr("font-weight", "bold");
svg4.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y4).ticks(null, "%"));
var svg4_histogram = svg4.insert("g")
    .attr("fill", "#bbb")
    .attr("fill-opacity", 0.5)
var svg4_path = svg4.append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")

function update_plot_4(values=[]) {
    var num_bins = 40
    var n = values.length
    var bins = d3.histogram().domain(x4.domain()).thresholds(num_bins)(values)
    var density = kernelDensityEstimator(kernelEpanechnikov(7), x4.ticks(num_bins))(values)

    svg4_histogram
        .selectAll("rect")
        .data(bins)
            .attr("x", function(d) { return x4(d.x0) + 1; })
            .attr("y", function(d) { return y4(d.length / n); })
            .attr("width", function(d) { return x4(d.x1) - x4(d.x0) - 1; })
            .attr("height", function(d) { return y4(0) - y4(d.length / n); })
        .enter()
        .append("rect")
            .attr("x", function(d) { return x4(d.x0) + 1; })
            .attr("y", function(d) { return y4(d.length / n); })
            .attr("width", function(d) { return x4(d.x1) - x4(d.x0) - 1; })
            .attr("height", function(d) { return y4(0) - y4(d.length / n); });

    svg4_path
        .datum(density)
        .attr("d", d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return x4(d[0]); })
            .y(function(d) { return y4(d[1]); }));
}

plot_1();
plot_3();