
import * as d3 from "d3";
import { defaultRainbow, defaultScheme } from "../theme/colors";
import { createLegend } from "./legend";

export type SpeedArcPoint = { label: string, value: number, color: string, cutoffs: [number, number] }

const width = 500
const margin = { vert: 40, horiz: 40, legend: 50}
const height = width / 2 + margin.vert + margin.legend
const radius = (width - margin.horiz * 2) / 2;
const arc = d3.arc<d3.PieArcDatum<SpeedArcPoint>>().innerRadius(radius * 0.75).outerRadius(radius);

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

export function createSpeed(document: Document, unit: string, dials: number[], names: string[], max: number, cutoffs: number[], labels: { label: string, color: string }[]) {
    const svg = d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("width", width)
        .attr("height", height)

    const data: SpeedArcPoint[] = []

    for (let i = 0; i < labels.length; i++) {
        data.push({
            label: labels[i].label,
            color: labels[i].color,
            cutoffs: [cutoffs[i], cutoffs[i + 1]],
            value: cutoffs[i + 1] - cutoffs[i]
        })
    }

    const pie = d3.pie<SpeedArcPoint>()
        .sort(null)
        .startAngle(-Math.PI / 2)
        .endAngle(Math.PI / 2)
        .value(d => d.value)

    const arcs = pie(data);

    const dialCenter = svg
        .append("g")
        .attr("transform", `translate(${width / 2},${height - margin.vert})`)

    dialCenter
        .selectAll("path")
        .data(arcs)
        .join("path")
        .attr("stroke", d => d.data.color)
        .attr("fill", d => d.data.color)
        .attr("d", arc)
        .append("title")
        .text(d => `${d.data.label}`);

    dialCenter
        .selectAll("text")
        .data(arcs)
        .join("text")
        .attr("text-anchor", "middle")
        .attr("y", -(radius + 10))
        .attr("transform", d => `rotate(${(d.endAngle + d.startAngle) / 2 * 180 / Math.PI})`)
        .attr("fill", d => d.data.color)
        .text(d => d.data.label)

    dialCenter
        .selectAll("rawText")
        .data(arcs)
        .join("text")
        .attr("text-anchor", "middle")
        .attr("y", -(radius * 0.75 - 15))
        .attr("transform", d => `rotate(${(d.endAngle) * 180 / Math.PI -
            ((d.data.label == "D") ? 2 : 0)
            })`)
        .attr("fill", d => (labels.findIndex(x => x.label == d.data.label) % 2 == 1) ? "white" : "DarkGray")
        .text(d => Math.round(d.data.cutoffs[1]))

    dialCenter
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", -(radius * 0.75 - 15))
        .attr("transform", d => `rotate(-90)`)
        .attr("fill", "white")
        .text("0")


    const sortedDials: [number, number][] = []
    for(let i = 0; i < dials.length; i++){
        sortedDials.push([i, dials[i]])
    }

    sortedDials.sort((a,b)=>a[1]-b[1])

    let finalizedColors = []
    for(let i = 0; i < names.length; i++){
        finalizedColors.push(defaultRainbow.red)
    }

    let colorSelectionIndex = 0


    for (const pair of sortedDials) {
        const [i, dial] = pair
        let value = Math.min(dial / max, 188 / 180)
        if(value < 0){
            value = Math.max(value, -8/180)
        }
        const rad = value * Math.PI

        let banColor = data[0].color

        for(let i = 0; i < data.length; i ++){
            if(data[i].cutoffs[0] > dial){
                break
            }
            banColor = data[i].color
        }

        let selectedColor = rainbow[colorSelectionIndex]
        while(selectedColor == banColor){
            colorSelectionIndex = (colorSelectionIndex + 1) % rainbow.length
            selectedColor = rainbow[colorSelectionIndex]
        }
        finalizedColors[i] = selectedColor
        colorSelectionIndex = (colorSelectionIndex + 1) % rainbow.length




        dialCenter
            .append("polygon")
            .attr("points", `0,0 5,-10 0,-${radius} -5,-10`)
            .attr("fill", defaultScheme.f_high)
            .attr("transform", `rotate(${value * 180 - 90})`)
            .attr("fill", selectedColor)
            //.style("mix-blend-mode", "exclusion")


        dialCenter
            .append("circle")
            .attr("r", 15)
            .attr("fill", defaultScheme.f_high)
            .attr("transform", `translate(${-Math.cos(rad)*radius * 0.875},${-Math.sin(rad)*radius*0.875})`)
            .attr("stroke", selectedColor)
            //.attr("fill-opacity", 0.7)



        dialCenter
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -radius+30)
            .attr("fill", defaultScheme.b_med)
            .attr("transform", `rotate(${value * 180 - 90})`)
            .text(`${Math.round(dial)}`)
            //.attr("fill", rainbow[i % rainbow.length])
    }



    svg
        .append("text")
        .attr("y", 20)
        .attr("x", 10)
        .attr("fill", defaultScheme.f_high)
        .text(unit)
    createLegend(svg, names, finalizedColors, (x)=>x)



    const HTML = d3.select(document.getElementById("rootDiv")).html()
    svg.remove()
    return HTML
}
