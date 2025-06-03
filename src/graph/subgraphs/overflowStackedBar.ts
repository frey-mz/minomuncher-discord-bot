import * as d3 from 'd3';
import { defaultScheme, defaultRainbow } from '../theme/colors';

const margin = { top: 100, right: 20, bottom: 50, left: 20 };
const width = 500 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

type StatMap = { [key: string]: number }

export interface OverflowDataPoint<T extends StatMap> {
    category: string;
    stat: T
}


const lootBox = [
    ["common", defaultScheme.f_high],
    ["uncommon", defaultRainbow.green],
    ["rare", defaultRainbow.violet],
    ["epic", defaultRainbow.purple],
    ["legendary", defaultRainbow.blue],
    ["mythic", defaultRainbow.pink],
    ["exotic", defaultRainbow.yellow],
    ["ancient", defaultRainbow.orange],
    ["divine", defaultRainbow.red],
]

function sumStats<T extends StatMap>(s: T) {
    let sum = 0
    for (const p of Object.values(s)) {
        sum += p
    }
    return sum
}

export function createOverflowStackedBar<T extends StatMap>(document: Document, graphName: string, data: OverflowDataPoint<T>[], ceiling: number, keys: (Extract<keyof T, string>)[], colors: string[], altName: (s: keyof T) => string, starStep: number) {
    function getOffset<T>(x: Extract<keyof T, string>) {
        let offset = 0
        for (const y of keys) {
            if (x == y) {
                break
            }
            offset += 10 * altName(y).length
        }
        return offset
    }
    const svgBase = d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("width", 500)
        .attr("height", 300)

    {
        const legendRectHeight = 7
        const legendSpacing = 8;
        const legendYOffset = 28

        const spacingOffset = (500 - getOffset("")) / 2

        const legend = svgBase
            .selectAll('.legend')
            .data(keys.toReversed())
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

    }


    const svg = svgBase.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3
        .scaleBand<string>()
        .domain(data.map(d => d.category))
        .range([0, width])
        .padding(0.3);

    const y = d3
        .scaleLinear()
        .domain([0, ceiling])
        .range([height, 0])

    const stackedData = d3.stack<OverflowDataPoint<T>, Extract<keyof T, string>>()
        .keys(keys)
        .value(
            (d: OverflowDataPoint<T>, key: string) => {

                if (sumStats(d.stat) > ceiling) {
                    return d.stat[key as keyof T] / sumStats(d.stat) * ceiling
                }
                return d.stat[key as keyof T]
            }
        )(data)

    svg.selectAll("glass")
        .data(data)
        .enter()
        .append('rect')
        .attr('height', height)
        .attr('x', d => x(d.category)!)
        .attr('width', x.bandwidth())
        .attr('fill', "transparent")
        .attr('stroke', defaultScheme.f_high)

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
        .attr('width', x.bandwidth())

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
            .attr('fill', defaultScheme.b_med)
            .text(d => d.data.stat[series.key as keyof T])

    });
    const xAsis = svg
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))

    const axes = [xAsis]

    for (const axis of axes) {
        axis.selectAll("line").style("stroke", defaultScheme.f_high)
        axis.selectAll("path").style("stroke", defaultScheme.f_high)
        axis.selectAll("text").style("fill", defaultScheme.f_high)
    }




    svg.selectAll("overflow")
        .data(data.map(x => {
            const overflow = Math.max(sumStats(x.stat) - ceiling, 0)
            const tick = Math.ceil(overflow / starStep)
            return { d: x, s: Math.min(tick, lootBox.length-1)}
        }))
        .enter()
        .filter(d=>d.s>0)
        .append("text")
        .attr("x", d => x(d.d.category)!)
        .attr("y", -5)
        .attr('text-anchor', 'start')
        .style("font-style", "italic")
        .style("font-size", "large")
        .text(d => `${lootBox[d.s][0]}`)
        .attr("fill", d => lootBox[d.s][1])

    const star = d3.symbol().type(d3.symbolStar).size(40);

    const starData = data
        .filter(d => sumStats(d.stat) > ceiling)
        .flatMap(d => {
            const numStars = Math.floor((sumStats(d.stat) - ceiling) / starStep);
            return Array.from({ length: numStars }, (_, i) => ({ ...d, starIndex: i }));
        });


    svg.selectAll("path.star")
        .data(starData)
        .enter()
        .append("path")
        .attr("class", "star")
        .attr("d", star)
        .attr("fill", defaultRainbow.yellow)
        .attr("transform", d => {
            const xPos = x(d.category)! + d.starIndex * 15 + 5;
            return `translate(${xPos}, ${-25})`;
        });

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