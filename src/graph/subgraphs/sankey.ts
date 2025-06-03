import * as d3 from "d3"
import * as d3Sankey from "d3-sankey"
import { defaultScheme } from "../theme/colors";


const width = 500;
const height = 500;

export function createSankey<NodeName extends string>(
    document: Document,
    data: {
        name: string;
        links: {
            source: number;
            target: number;
            value: number;
        }[];
    }[],
    indexedNodeNames: NodeName[],
    color: (_a: NodeName, _b: NodeName) => string) {
    const svg = d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;");

    let graphCount = 0
    for (const graph of data) {
        const sankey = d3Sankey.sankey<{ name: NodeName }, {}>()
            .nodeSort(d => {
                return indexedNodeNames.indexOf(d.name)
            })
            .linkSort(() => null)
            .nodeWidth(4)
            .nodePadding(20)
            .extent([[0, 5 + graphCount / data.length * height], [width - 100, (graphCount + 1) / data.length * height - 5]])

        const { nodes, links } = sankey({
            nodes: indexedNodeNames.map(d => Object.create({ name: d })),
            links: graph.links.map(d => Object.create(d))
        });

        const maxDepth = Math.max(...nodes.map(x => x.depth!))

        svg.append("g")
            .selectAll("rect")
            .data(nodes)
            .join("rect")
            .attr("x", d => d.x0!)
            .attr("y", d => d.y0!)
            .attr("height", d => d.y1! - d.y0!)
            .attr("width", d => d.x1! - d.x0!)
            .attr("fill", defaultScheme.f_high)
            .append("title")
            .text(d => `${d.name}\n${d.value!.toLocaleString()}`);

        //its multiply so we need to redraw a bg behind it lol, kinda wacky!!...

        svg.append("g")
            .attr("fill", "none")
            .selectAll("g")
            .data(links)
            .join("path")
            .attr("d", d3Sankey.sankeyLinkHorizontal())
            .attr("stroke", () => "white")
            .attr("stroke-width", d => d.width!)

        svg.append("g")
            .attr("fill", "none")
            .selectAll("g")
            .data(links)
            .join("path")
            .attr("d", d3Sankey.sankeyLinkHorizontal())
            .attr("stroke", d => color(
                (d.source as d3Sankey.SankeyNode<{name: NodeName;}, {}>).name,
                (d.target as d3Sankey.SankeyNode<{name: NodeName;}, {}>).name))
            .attr("stroke-width", d => d.width!)
            .style("mix-blend-mode", "multiply")
            .append("title")
            .text(d => `${indexedNodeNames[d.source as number]}->${indexedNodeNames[d.target as number]}\n${d.value.toLocaleString()}`);

        //console.log(nodes)

        {
            svg.append("g")
                .selectAll("rect")
                .data(nodes)
                .join("rect")
                .filter(d => d.depth! == 0)
                //.filter(d => d.name == "IncomingAttacks")
                .attr("x", 5)
                .attr("y", d => (d.y1! + d.y0!) / 2 - 10 - 10)
                .attr("height", "20")
                .attr("width", "110")
                .attr("rx", "2")
                .attr("fill", "white")
                .attr("opacity", 0.7)
            svg.append("g")
                .selectAll("rect")
                .data(nodes)
                .join("text")
                .filter(d => d.depth! == 0)
                //.filter(d => d.name == "IncomingAttacks")
                .attr("x", 5)
                .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5 - 20)
                .attr("fill", "black")
                .text(d => d.name)
        }

        {
            svg.append("g")
                .selectAll("rect")
                .data(nodes)
                .join("rect")
                .filter(d => d.depth! != 0 && d.depth! != maxDepth)
                //.filter(d => d.name == "Cheese" || d.name == "Clean")
                .attr("x", d => d.x0! - 25)
                .attr("y", d => (d.y1! + d.y0!) / 2 - 10 - 10)
                .attr("height", "40")
                .attr("width", "50")
                .attr("rx", "2")
                .attr("fill", "white")
                .attr("opacity", 0.7)

            svg.append("g")
                .selectAll("rect")
                .data(nodes)
                .join("text")
                .filter(d => d.depth! != 0 && d.depth! != maxDepth)
                //.filter(d => d.name == "Cheese" || d.name == "Clean")
                .attr("x", d => d.x0!)
                .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5 - 20)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .text(d => d.name)

            svg.append("g")
                .selectAll("rect")
                .data(nodes)
                .join("text")
                .filter(d => d.depth! != 0 && d.depth! != maxDepth)
                //.filter(d => d.name == "Cheese" || d.name == "Clean")
                .attr("x", d => d.x0!)
                .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5)
                .attr("fill", defaultScheme.b_high)
                .attr("text-anchor", "middle")
                .text(d => d.value!)
        }
        {
            svg.append("g")
                .selectAll("rect")
                .data(nodes)
                .join("text")
                .filter(d => d.depth! == maxDepth)
                //.filter(d => d.name == "CheeseTanked" || d.name == "Cancelled" || d.name == "CleanTanked")
                .attr("x", d => d.x0! + 5 + 50)
                .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5 - 20)
                .attr("fill", defaultScheme.f_high)
                .attr("text-anchor", "middle")
                .text(d => d.name)
            svg.append("g")
                .selectAll("rect")
                .data(nodes)
                .join("text")
                .filter(d => d.depth! == maxDepth)
                //.filter(d => d.name == "CheeseTanked" || d.name == "Cancelled" || d.name == "CleanTanked")
                .attr("x", d => d.x0! + 5 + 50)
                .attr("y", d => (d.y1! + d.y0!) / 2 + 10 + 5)
                .attr("fill", defaultScheme.f_med)
                .attr("text-anchor", "middle")
                .text(d => d.value!)
        }

        svg.append("g")
            .append("text")
            .attr("x", 5)
            .attr("y", graphCount / data.length * height + 15)
            .attr("fill", defaultScheme.f_high)
            .text(graph.name)

        graphCount += 1
    }
    const HTML = d3.select(document.getElementById("rootDiv")).html()
    svg.remove()
    return HTML
}
