import * as d3 from "d3";
import { defaultRainbow, defaultScheme } from "../theme/colors";
import { createLegend } from "./legend";
const width = 500
const height = 500
const radius = 180

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
function hasConflict(x: number, x1: number, ranges: [number, number][]) {
    for (const [start, end] of ranges) {
        if (x <= end && x1 >= start) {
            return true; // Overlap detected
        }
    }
    return false; // No overlaps
}

function isReversed(angle: number) {
    angle = angle + Math.PI * 2 % (Math.PI * 2)
    return angle > Math.PI / 2 && angle < Math.PI * 3 / 2
}

function drawClosedCurve(idx: number, svg: d3.Selection<SVGGElement, unknown, null, undefined>, points: [number, number][]) {
    const
        strokeWidth = 1,
        fill = rainbow[idx % rainbow.length],
        curve = d3.curveLinearClosed

    const lineGenerator = d3.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(curve);

    svg.append("path")
        .attr("d", lineGenerator(points))
        .attr("fill", fill)
        .style("fill-opacity", 0.5)
        .style("mix-blend-mode", "multiply")
        .attr("stroke", fill)
        .attr("stroke-width", strokeWidth)
}
export type radarAxis = {
    label: string,
    scale: (_x: number)=> number
}


export function createRadar(document: Document, graphName: string, data: radarAxis[], userData: number[][], userNames: string[]) {
    const svg = d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("width", width)
        .attr("height", height)


    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2 + 20})`);

    // Draw base circle

    g.append("circle")
        .attr("class", "base")
        .attr("r", radius)
        .attr("fill", defaultScheme.background)
        //.attr("fill", defaultScheme.b_high)
        .attr("stroke", defaultScheme.f_high)

    for (let i = 0; i < 4; i++) {
        g.append("circle")
            .attr("r", radius * i / 4)
            .attr("fill", "transparent")
            .attr("stroke", defaultScheme.f_high)
            .attr("stroke-opacity", 0.5)
    }

    const angleScale = d3.scaleLinear()
        .domain([0, data.length])
        .range([0, 2 * Math.PI]);

    const ticks = g.selectAll(".tick")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "tick")
        .attr("transform", (_d, i) => {
            const angle = angleScale(i);
            const x = Math.sin(angle) * radius;
            const y = -Math.cos(angle) * radius;
            return `translate(${x}, ${y})`;
        })
        .attr("stroke-dasharray", "5,1")

    // Add tick lines (optional)
    ticks.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", d => -Math.sin(angleScale(data.indexOf(d))) * radius)
        .attr("y2", d => Math.cos(angleScale(data.indexOf(d))) * radius)
        .attr("stroke", defaultScheme.f_high)
        .attr("stroke-opacity", "0.5")

    let coords: [number, number][][] = []

    for (let i = 0; i < userData.length; i++) {
        coords.push(userData[i].map((v, i) => {
            const delta = data[i].scale(v)
            return [Math.sin(angleScale(i)) * delta * radius, -Math.cos(angleScale(i)) * delta * radius]
        }))
    }

    const curveIsolation = g.append("g").style("isolation", "isolate")

    for (let i = 0; i < userData.length; i++) {
        drawClosedCurve(i, curveIsolation, coords[i])
    }
    for (let i = 0; i < userData.length; i++) {
        for (let j = 0; j < coords[i].length; j++) {
            const point = coords[i][j]
            if(!Number.isFinite(point[0]) || !Number.isFinite(point[1]))continue
            g.append("circle")
                .attr("r", 2)
                .attr("cx", point[0])
                .attr("cy", point[1])
                .attr("fill", rainbow[i % rainbow.length])
        }
    }

    let taken: [number, number][][] = []
    for (let i = 0; i < data.length; i++) {
        taken.push([])
    }

    for (let i = 0; i < userData.length; i++) {
        for (let j = 0; j < coords[i].length; j++) {
            if(!Number.isFinite(userData[i][j]))continue
            const start = -(radius * data[j].scale(userData[i][j]) + 20)
            const end = start + 15

            if (hasConflict(start, end, taken[j])) {
                continue
            }

            taken[j].push([start, end])


            g.append("rect")
                .attr("transform", `rotate(${180 / Math.PI * angleScale(j)})`)
                .attr("y", start)
                .attr("fill", defaultScheme.f_high)
                //.attr("fill", rainbow[i % rainbow.length])
                .attr("width", 30)
                .attr("height", 15)
                .attr("x", -15)
                .attr("fill-opacity", 0.7)
                .attr("rx", "2")

            g.append("text")
                .attr("transform", () => {
                    let angle = angleScale(j)
                    if (isReversed(angle)) {
                        angle += Math.PI
                    }
                    return `rotate(${180 / Math.PI * angle})`
                })
                .attr("y", (radius * data[j].scale(userData[i][j])  + (isReversed(angleScale(j)) ? 15 : 10)) * (isReversed(angleScale(j)) ? 1 : -1))
                .attr("fill", defaultScheme.b_med)
                //.attr("stroke", rainbow[i % rainbow.length])
                //.attr("stroke", defaultScheme.f_high)
                //.attr("stroke-width", 0.5)
                .attr("text-anchor", "middle")
                .text(userData[i][j].toPrecision(3));

        }
    }

    // Add labels
    ticks.append("text")
        .attr("transform", d => {
            let angle = angleScale(data.indexOf(d))
            if (isReversed(angle)) {
                angle += Math.PI
            }
            return `rotate(${180 / Math.PI * angle})`
        })
        .attr("y", d => isReversed(angleScale(data.indexOf(d))) ? 30 : -25)
        .attr("fill", defaultScheme.f_high)
        .attr("text-anchor", "middle")
        .text(d => d.label);

    svg
        .append("text")
        .attr("y", 20)
        .attr("x", 10)
        .attr("fill", defaultScheme.f_high)
        .text(graphName)
        
    createLegend(svg, userNames, rainbow, (x)=>x, 10)


    const HTML = d3.select(document.getElementById("rootDiv")).html()
    svg.remove()
    return HTML
}

