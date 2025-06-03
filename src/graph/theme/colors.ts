import { extractTheme } from "./theme.ts"

const text = await Bun.file("./src/graph/theme/defaultScheme.svg").text()
export const defaultScheme = extractTheme(text)!
export const defaultRainbow = {
    pink: "#F8C8DC",
    red: "#dc8580",
    yellow: "#f2e6b1",
    orange: "#E7B699",
    blue: "#83b2d0",
    purple: "#8686CE",
    violet: "#885ACC",
    green: "#95dab6",
    teal: "#8CADA7",
}