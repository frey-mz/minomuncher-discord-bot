import { Resvg, ResvgRenderOptions } from "@resvg/resvg-js"
import * as fs from "fs"
import { defaultScheme } from "./theme/colors"
export function renderSvg(svg: string){
    const opts: ResvgRenderOptions = {
        background: defaultScheme.b_med,
        fitTo: { mode: "width", value: 500 * 3 },
        font: {
            fontFiles: ['./src/graph/theme/Martel-Bold.ttf'], // Load custom fonts.
            loadSystemFonts: false, // It will be faster to disable loading system fonts.
            defaultFontFamily: 'Martel Bold',
        },
    }
    const resvg = new Resvg(svg, opts)
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()
    return pngBuffer

}