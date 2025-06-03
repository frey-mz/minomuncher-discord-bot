import {JSDOM} from "jsdom"

export type ThemeData = {
  background: string
  f_high: string
  f_med: string
  f_low: string
  f_inv: string
  b_high: string
  b_med: string
  b_low: string
  b_inv: string
}

function isColor(hex: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex)
}

export function isValid(json: any) : json is ThemeData{
  if (!json) return false
  return ['background', 'f_high', 'f_med', 'f_low', 'f_inv', 'b_high', 'b_med', 'b_low', 'b_inv']
    .every((key) => isColor(json[key]))
}

export function extractTheme(xml: string): ThemeData | undefined {
  const dom = new JSDOM(xml, {
      contentType: 'image/svg+xml',
  });
  const svg = dom.window.document
  try {
    const data =  {
      background: svg.getElementById('background')!.getAttribute('fill')!,
      f_high: svg.getElementById('f_high')!.getAttribute('fill')!,
      f_med: svg.getElementById('f_med')!.getAttribute('fill')!,
      f_low: svg.getElementById('f_low')!.getAttribute('fill')!,
      f_inv: svg.getElementById('f_inv')!.getAttribute('fill')!,
      b_high: svg.getElementById('b_high')!.getAttribute('fill')!,
      b_med: svg.getElementById('b_med')!.getAttribute('fill')!,
      b_low: svg.getElementById('b_low')!.getAttribute('fill')!,
      b_inv: svg.getElementById('b_inv')!.getAttribute('fill')!,
    }
    if(!isValid(data)){
      throw Error("Invalid SVG")
    }
    return data
  } catch (err) {
    console.warn('Theme', 'Incomplete SVG Theme', err)
  }
}
