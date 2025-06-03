import * as d3 from 'd3';
import { ClearType } from '../../replayParser/types';
import { defaultScheme } from '../theme/colors';

function sumStats<T extends StatMap>(s: T) {
    let sum = 0
    for (const p of Object.values(s)) {
        sum += p
    }
    return sum
}
function getContrastYIQ(hexcolor: string) {
    var r = parseInt(hexcolor.substring(1, 3), 16);
    var g = parseInt(hexcolor.substring(3, 5), 16);
    var b = parseInt(hexcolor.substring(5, 7), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? defaultScheme.b_med : defaultScheme.f_high
}


type StatMap = { [key: string]: number }

export interface StackedDataPoint<T extends StatMap> {
    category: string;
    stat: T
}
// Dimensions
const margin = { top: 60, right: 20, bottom: 30, left: 40 };
const width = 500 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Set up scales


const y = d3
    .scaleLinear()
    .domain([0, 1])
    .nice()
    .range([height, 0])

export function createStackedBar<T extends StatMap>(document: Document, graphName: string, data: StackedDataPoint<T>[], keys: (Extract<keyof T, string>)[], colors: string[], altName: (s: Extract<keyof T, string>) => string) {
    function getOffset(x: string) {
        let offset = 0
        for (const y of keys) {
            if (x == y) {
                break
            }
            offset += 10 * (altName(y)).length
        }
        return offset
    }

    const x = d3
        .scaleBand<string>()
        .domain(data.map(d => d.category))
        .range([0, width])
        .padding(0.3);
    const svgBase = d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    //.attr("viewBox", [0, 0, width, height])
    //.attr("style", "max-width: 100%; height: auto; height: intrinsic;")


    const svg = svgBase.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Stack the data
    const stackedData = d3.stack<StackedDataPoint<T>, Extract<keyof T, string>>().keys(keys).value((d: StackedDataPoint<T>, key: string) => d.stat[key] / sumStats(d.stat))(data)

    // Add groups and rects
    const groups = svg
        .selectAll('g.layer')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('class', 'layer')
        .attr('fill', d => colors[keys.indexOf(d.key)])
        .attr("font-size", "10")

    groups
        .selectAll('rect')
        .data(d => d)
        .enter()
        .append('rect')
        .attr('x', d => x(d.data.category)!)
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth());

    groups.each(function (series) {
        const group = d3.select(this);

        const filteredData = series.filter(d => y(d[0]) - y(d[1]) > 10);

        // First text element
        group.selectAll('text.label1')
            .data(filteredData)
            .enter()
            .append('text')
            .attr('class', 'label1')
            .attr('x', d => x(d.data.category)! + x.bandwidth() / 2)
            .attr('y', d => (y(d[0]) + y(d[1])) / 2 + 2.5) // Near top of bar
            .attr('text-anchor', 'middle')
            .attr('fill', d => getContrastYIQ(colors[keys.indexOf(series.key)]))
            .text(d => `${Math.round(100 * d.data.stat[series.key as ClearType] / sumStats(d.data.stat))}%`)

        // Second text element
        group.selectAll('text.label2')
            .data(filteredData)
            .enter()
            .append('text')
            .attr('class', 'label2')
            .attr('x', d => x(d.data.category)! - 2)
            .attr('y', d => (y(d[0]) + y(d[1])) / 2 + 2.5) // Near bottom of bar
            .attr('text-anchor', 'end')
            .attr('fill', defaultScheme.f_low)
            .text(d => d.data.stat[series.key as ClearType]);
    });
    const xAsis = svg
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))

    const yAxis = svg.append('g')
        .call(d3.axisLeft(y).tickFormat(d3.format(".0%")).ticks(2))

    const axes = [xAsis, yAxis]
    for (const axis of axes) {
        axis.selectAll("line").style("stroke", defaultScheme.f_high)
        axis.selectAll("path").style("stroke", defaultScheme.f_high)
        axis.selectAll("text").style("fill", defaultScheme.f_high)

    }

    const legendRectHeight = 7
    const legendSpacing = 8;
    const legendYOffset = -28
    const spacingOffset = (width - getOffset("")) / 2
    const legend = svg
        .selectAll('.legend')
        .data(keys)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d) => {
            const xOffset = getOffset(d) + spacingOffset
            return `translate(${xOffset}, ${legendYOffset})`;
        });

    // Colored rectangles
    legend
        .append('rect')
        .attr('width', d => altName(d).length * 10)
        .attr('height', legendRectHeight)
        .style('fill', d => colors[keys.indexOf(d)])
        .style('stroke', d => colors[keys.indexOf(d)]);

    // Text below rectangles
    legend
        .append('text')
        .attr('x', d => altName(d).length * 10 / 2)
        .attr('y', legendRectHeight + legendSpacing)
        .attr('dy', '0.35em')
        .attr('fill', d => colors[keys.indexOf(d)])
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text(d => altName(d))

    svgBase
        .append("text")
        .attr("y", 15)
        .attr("x", 10)
        .attr("fill", defaultScheme.f_high)
        .text(graphName)

    const HTML = d3.select(document.getElementById("rootDiv")).html()
    svgBase.remove()
    return HTML
}
