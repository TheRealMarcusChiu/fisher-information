function generate_random_values(size=0, mean=0, std=1) {
    const random_values = []
    for (let i = 0; i < size; i++) {
        random_values.push(rnorm(mean, std));
    }
    return random_values;
}

function generate_data_sets(random_x_values=[], std=1) {
    const data_sets_1 = [];
    const data_sets_3 = [];

    const step = 0.1
    const x_data = d3.range(-10, 10, step);
    for (let i = 0; i < random_x_values.length; i++) {
        // PLOT 1
        const y_data_1 = x_data.map(x => log_dnorm(random_x_values[i], x, std))
        const data_1 = x_data.map(function (x, j) { return { x: x, y: y_data_1[j] } });
        data_sets_1.push(data_1);

        // PLOT 3
        const y_data_3 = x_data.map(x => derivative_log_dnorm(random_x_values[i], x, std))
        const data_3 = x_data.map(function (x, j) { return { x: x, y: y_data_3[j] } });
        data_sets_3.push(data_3);
    }

    return [data_sets_1, data_sets_3];
}

class Plot {
    constructor(title, svg_id, margin, width, height, x_domain=[-10,10], y_domain=[-10,10]) {
        this.margin = margin
        this.width = width
        this.height = height
        this.svg = d3
          .select(svg_id)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        this.svg
            .append("text")
            .attr("text-anchor", "start")
            .attr("y", -5)
            .attr("x", 0)
            .text(title);
        this.x = d3.scaleLinear()
            .domain(x_domain)
            .range([ 0, width ]);
        this.y = d3.scaleLinear()
            .domain(y_domain)
            .range([ height, 0 ]);
        this.svg.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(this.x));
        this.svg.append("g")
          .call(d3.axisLeft(this.y));
        this.path = this.svg.append("g");
        this.focus_sets = [];
    }

    initializeDataSets(num_random_values, data_sets) {
        for (let i = 0; i < this.focus_sets.length; i++) {
            this.focus_sets[i].remove();
        }
        this.num_random_values = num_random_values;
        this.data_sets = data_sets;
        this.focus_sets = [];
        var that = this;

        // Plot Lines
        var paths = this.path.selectAll("path").data(this.data_sets);
        paths.attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(function(d) { return that.x(d.x) })
                .y(function(d) { return that.y(d.y) })
            );
        paths.enter().append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(function(d) { return that.x(d.x) })
                .y(function(d) { return that.y(d.y) })
            );
        paths.exit().remove();

        // Plot Foci
        for (let i = 0; i < num_random_values; i++) {
            // Create the circle that travels along the curve of chart
            var focus = this.path
                .append('circle')
                    .attr("stroke", "black")
                    .attr('r', 2)
            this.focus_sets.push(focus);
        }
    }

    updateFocusSet(pointer, plotHistogram) {
        const p_x = pointer[0];
        const x0 = this.x.invert(p_x);
        this.updateFocusSet2(x0, plotHistogram);
    }

    updateFocusSet2(x0, plotHistogram) {
        const y_values = [];
        for (let i = 0; i < this.num_random_values; i++) {
            let data = this.data_sets[i];
            let focus = this.focus_sets[i];
            var j = bisect(data, x0, 1);
            var selectedData = data[j];
            focus
                .attr("cx", this.x(selectedData.x))
                .attr("cy", this.y(selectedData.y));
            y_values.push(selectedData.y);
        }
        plotHistogram.updateHistogram(y_values);
    }
}

class PlotHistogram {
    constructor(title, svg_id, margin, width, height, x_domain=[-10,10], y_domain=[-10,10]) {
        this.svg = d3
          .select(svg_id)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        this.svg
            .append("text")
            .attr("text-anchor", "start")
            .attr("y", -5)
            .attr("x", 0)
            .text(title);
        this.x = d3.scaleLinear()
            .domain(x_domain)
            .range([margin.left, width - margin.right]);
        this.y = d3.scaleLinear()
            .domain(y_domain)
            .range([height - margin.bottom, margin.top]);
        this.svg.append("g")
            .attr("transform", "translate(0," + (height - margin.bottom) + ")")
            .call(d3.axisBottom(this.x))
          .append("text")
            .attr("x", width - margin.right)
            .attr("y", -6)
            .attr("fill", "#000")
            .attr("text-anchor", "end")
            .attr("font-weight", "bold");
        this.svg.append("g")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(d3.axisLeft(this.y).ticks(null, "%"));
        this.histogram = this.svg.insert("g")
            .attr("fill", "#bbb")
            .attr("fill-opacity", 0.5)
        this.path = this.svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
    }

    updateHistogram(values=[]) {
        var num_bins = 40
        var n = values.length
        var bins = d3.histogram().domain(this.x.domain()).thresholds(num_bins)(values)
        var density = kernelDensityEstimator(kernelEpanechnikov(1), this.x.ticks(num_bins))(values)
        const that = this;

        this.histogram.selectAll("rect").data(bins)
                .attr("x", function(d) { return that.x(d.x0) + 1; })
                .attr("y", function(d) { return that.y(d.length / n); })
                .attr("width", function(d) { return that.x(d.x1) - that.x(d.x0) - 1; })
                .attr("height", function(d) { return that.y(0) - that.y(d.length / n); })
            .enter().append("rect")
                .attr("x", function(d) { return that.x(d.x0) + 1; })
                .attr("y", function(d) { return that.y(d.length / n); })
                .attr("width", function(d) { return that.x(d.x1) - that.x(d.x0) - 1; })
                .attr("height", function(d) { return that.y(0) - that.y(d.length / n); })
            .exit().remove();

        this.path
            .datum(density)
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(function(d) { return that.x(d[0]); })
                .y(function(d) { return that.y(d[1]); }));
    }
}

const margin = {top: 40, right: 30, bottom: 30, left: 60}
const width = 460 - margin.left - margin.right
const height = 400 - margin.top - margin.bottom;
const plot1 = new Plot("Log Normal", "#plot1", margin, width, height, [-10, 10], [-5, 0]);
const plot2 = new PlotHistogram("Distribution of Log Normal", "#plot2", margin, width, height, [-10, 0], [0, 0.5]);
const plot3 = new Plot("𝛿/𝛿𝜇 Log Normal", "#plot3", margin, width, height, [-10, 10], [-10, 10]);
const plot4 = new PlotHistogram("Distribution of 𝛿/𝛿𝜇 Log Normal", "#plot4", margin, width, height, [-10, 10], [0, 0.5]);
var mean = document.getElementById("slider_mean").value;
var std = document.getElementById("slider_std").value;
var num_random_values = document.getElementById("slider_num_samples").value

// Create a rect on top of the svg area: this rectangle recovers mouse position
plot1.svg
    .append('rect')
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('width', width)
    .attr('height', height)
    .on('mousemove', mousemove);

// This allows to find the closest X index of the mouse:
const bisect = d3.bisector(function(d) { return d.x; }).left;

function mousemove() {
    // recover coordinate we need
    var pointer = d3.pointer(event, this);
    plot1.updateFocusSet(pointer, plot2);
    plot3.updateFocusSet(pointer, plot4);
}

function initialize() {
    var random_x_values = generate_random_values(num_random_values, mean, std);
    var [data_sets_1, data_sets_3] = generate_data_sets(random_x_values, std);
    plot1.initializeDataSets(num_random_values, data_sets_1);
    plot3.initializeDataSets(num_random_values, data_sets_3);
    plot1.updateFocusSet2(mean, plot2);
    plot3.updateFocusSet2(mean, plot4);
}
initialize();

d3.select("#slider_mean").on("change", function(d) {
    mean = +this.value;
    initialize();
});

d3.select("#slider_std").on("change", function(d) {
    std = +this.value;
    initialize();
});

d3.select("#slider_num_samples").on("change", function(d) {
    num_random_values = +this.value;
    initialize();
});