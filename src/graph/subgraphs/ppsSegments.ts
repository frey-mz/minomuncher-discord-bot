
import * as d3 from "d3"
import { defaultRainbow, defaultScheme } from "../theme/colors";
import { createLegend } from "./legend";

const rainbow = [
    defaultRainbow.red,
    defaultRainbow.green,
    defaultRainbow.purple,
    defaultRainbow.orange,
    defaultRainbow.violet,
    defaultRainbow.pink,
    defaultRainbow.yellow,
    defaultRainbow.blue,
]

export function createMultiPPS(document: Document, graphname: string, usernames: string[], data: number[][]) {

    const width = 600;
    const height = 300;
    const margin = { top: 60, right: 40, bottom: 30, left: 40 };
    const svg = d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    let min = Infinity
    let max = 0

    for(const d of data){
        for(let i = 0; i < d.length; i++){
            if(d[i]!=0){
                min = Math.min(min, i)
                break
            }
        }
        for(let i = d.length-1; i >= 0; i--){
            if(d[i]!=0){
                max = Math.max(max, i)
                break
            }
        }
    }
    
    const x = d3.scaleLinear<number>()
        .domain([min, max])
        .nice()
        .range([margin.left, width - margin.right])
    //.padding(0.1);





    const y = d3.scaleLinear<number>()
        .domain([0, Math.max(...data.map(x=>Math.max(...x)))])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line().curve(d3.curveCardinal)

    const iso = svg.append("g").style("isolation", "isolate")

    for(let i = 0; i < data.length;i++){
        const mappedPoints : [number, number][] = [[x(min)!, y(0)]]
        for(let j = min; j <= max; j++){
            mappedPoints.push([x(j)!, y(data[i][j])])
        }
        mappedPoints.push([x(max)!, y(0)])

        iso.append("path")
            .attr("d", line(mappedPoints))
            .attr("stroke", rainbow[i % rainbow.length])
            .attr("stroke-width", 2)
            .attr("fill", "transparent")
            .attr("fill", rainbow[i % rainbow.length])
            .attr("fill-opacity", 0.5)
            .style("mix-blend-mode", "overlay")
        
    }

    
    const xAsis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickValues(x.ticks(Math.floor((max-min)/5)).filter(x=>x % 5 == 0)).tickFormat(i => `${i.valueOf()/5}PPS`));

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


    createLegend(svg, usernames, rainbow, x=>x, 25)

    const HTML = d3.select(document.getElementById("rootDiv")).html()
    svg.remove()
    return HTML
}