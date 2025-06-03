import * as d3 from "d3"

export function createLegend<T extends string>(svgBase: d3.Selection<SVGSVGElement, unknown, null, undefined>, keys: T[], colors: string[], altName: (_s: T)=> string, legendYOffset: number = 28) {
    function getOffset(x: T | undefined = undefined) {
        let offset = 0
        for (const y of keys) {
            if (x == y) {
                break
            }
            offset += 10 * altName(y).length
        }
        return offset
    }
    const legendRectHeight = 7
    const legendSpacing = 8;

    const spacingOffset = (500 - getOffset()) / 2

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
        .style('fill', d => colors[keys.indexOf(d) % colors.length])
        .style('stroke', d => colors[keys.indexOf(d) % colors.length]);

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