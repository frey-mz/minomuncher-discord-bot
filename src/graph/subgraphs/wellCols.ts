
import * as d3 from "d3"
import { defaultRainbow, defaultScheme } from "../theme/colors";

const rainbow = [
    defaultRainbow.green,
    defaultRainbow.violet,
    defaultRainbow.purple,
    defaultRainbow.blue,
    defaultRainbow.pink,
    defaultRainbow.pink,
    defaultRainbow.blue,
    defaultRainbow.purple,
    defaultRainbow.violet,
    defaultRainbow.green,
]

export function createWellCols(document: Document, graphname: string, username: string, data: number[]) {
    const total = d3.sum(data);
    const normalizedData = data.map(d => (d / total) * 100);

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 40, bottom: 30, left: 40 };
    const svg = d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    const x = d3.scaleBand<number>()
        .domain(d3.range(normalizedData.length))
        .range([margin.left, width - margin.right])
    //.padding(0.1);

    const y = d3.scaleLinear<number>()
        .domain([0, d3.max(normalizedData) || 1])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Draw bars
    svg.selectAll("rect")
        .data(normalizedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (_d, i) => x(i)!)
        .attr("y", d => y(d))
        .attr("height", d => y(0) - y(d))
        .attr("width", x.bandwidth())
        .attr("fill", (_d, i) => rainbow[i])

    // Add value labels
    svg.selectAll("text.label")
        .data(normalizedData)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("class", "label")
        .attr("x", (_d, i) => x(i)! + x.bandwidth() / 2)
        .attr("y", d => y(d) - 5)
        .attr("fill", defaultScheme.f_high)
        .text(d => d.toFixed(1) + "%");

    // X-axis
    const xAsis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(i => `#${i + 1}`));

    // Y-axis
    const yAxis = svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));

    const yAxis2 = svg.append("g")
        .attr("transform", `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y).ticks(5).tickFormat(d => d + "%"));

    const axes = [xAsis, yAxis, yAxis2]
    for (const axis of axes) {
        axis.selectAll("line").style("stroke", defaultScheme.f_high)
        axis.selectAll("path").style("stroke", defaultScheme.f_high)
        axis.selectAll("text").style("fill", defaultScheme.f_high)
    }


    svg
        .append("text")
        .attr("y", 15)
        .attr("x", 10)
        .attr("fill", defaultScheme.f_high)
        .text(graphname)

    svg
        .append("text")
        .attr("y", 15)
        .attr("x", 120)
        .attr("fill", defaultScheme.f_med)
        .text(username)

    const HTML = d3.select(document.getElementById("rootDiv")).html()
    svg.remove()
    return HTML
}