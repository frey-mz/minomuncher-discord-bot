import * as d3 from "d3"
import { JSDOM } from "jsdom"
export function combineSVGsVertically(svgData: string[]) {
    const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="rootDiv"></div></body></html>`, {
        contentType: 'image/svg+xml',
    });
    const document = dom.window.document




    let [numX, _numY] = factorClosestPair(svgData.length)
    let dx = 0
    let dy = 0

    let maxX = 0
    let maxY = 0

    let currMaxHeight = 0

    d3.select(document.getElementById("rootDiv"))
        .append("svg")
        .attr("id", "baseSvg")

    for (let i = 0; i < svgData.length; i++) {
        const fragment = JSDOM.fragment(svgData[i]);
        let svgElement = fragment.firstChild as any as SVGSVGElement;

        svgElement.setAttribute("x", String(dx))
        svgElement.setAttribute("y", String(dy))

        dx += parseFloat(svgElement.getAttribute("width")!)

        maxX = Math.max(dx)

        currMaxHeight = Math.max(currMaxHeight, parseFloat(svgElement.getAttribute("height")!))


        if((i + 1) % numX == 0){
            dx = 0
            dy += currMaxHeight
            maxY = Math.max(dy)
        }

        

        document.getElementById("baseSvg")!.append(svgElement!)
    }

    d3.select(document.getElementById("rootDiv")).selectChild().attr("height", maxY).attr("width", maxX)

    return d3.select(document.getElementById("rootDiv")).html()

}


function factorClosestPair(n: number) {
  if (n <= 0 || !Number.isInteger(n)) {
    throw new Error("Input must be a positive whole number.");
  }

  let a = Math.floor(Math.sqrt(n));

  while (a > 0) {
    if (n % a === 0) {
      let b = n / a;
      return [a, b]; // Return the pair with minimal difference
    }
    a--;
  }

  // Should never reach here for valid inputs
  return [1, n];
}