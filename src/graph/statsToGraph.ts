import { ClearType, CumulativeStats, DeathTypes } from "../replayParser/types";
import { createStackedBar, StackedDataPoint } from "./subgraphs/stackedBar";
import { createSpeed } from "./subgraphs/speed";
import { createWellCols } from "./subgraphs/wellCols";
import { createSankey } from "./subgraphs/sankey";
import { createRadar, radarAxis } from "./subgraphs/radar";
import { createOverflowStackedBar } from "./subgraphs/overflowStackedBar";

import { JSDOM } from "jsdom"
import { defaultRainbow } from "./theme/colors";
import { createMultiWellCols } from "./subgraphs/multiWellCols";
import { createMultiPPS } from "./subgraphs/ppsSegments";
import { combineSVGsVertically } from "./combineSvg";

import * as d3 from "d3"

export function createGraphs(stats: { [key: string]: CumulativeStats }): string[] {
    const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="rootDiv"></div></body></html>`, {
        contentType: 'image/svg+xml',
    });
    const document = dom.window.document

    const killDeath = []

    const graphs: string[] = []
    {
        const keys: DeathTypes[] =
            [
                "Surge Conflict",
                "Surge Spike",
                "Cheese Spike",
                "Spike",
                "Cheese Pressure",
                "Pressure"
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.teal,
                defaultRainbow.violet,
                defaultRainbow.purple,
                defaultRainbow.pink,
                defaultRainbow.blue,
            ]
        colors.reverse()

        const shortName = (k: DeathTypes) => {
            if (k == "Surge Spike") {
                return "Surge"
            } else if (k == "Cheese Pressure") {
                return "Cheese"
            }
            return k
        }

        type ClearMap = { [key in DeathTypes]: number }

        const data: StackedDataPoint<ClearMap>[] = []
        for (const key in stats) {
            data.push({
                category: key,
                stat: stats[key].killStats
            })
        }
        killDeath.push(createStackedBar<ClearMap>(document, "Kills", data, keys, colors, shortName))
    }

    {
        const keys: DeathTypes[] =
            [
                "Surge Conflict",
                "Surge Spike",
                "Cheese Spike",
                "Spike",
                "Cheese Pressure",
                "Pressure"
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.teal,
                defaultRainbow.violet,
                defaultRainbow.purple,
                defaultRainbow.pink,
                defaultRainbow.blue,
            ]
        colors.reverse()

        const shortName = (k: DeathTypes) => {
            if (k == "Surge Spike") {
                return "Surge"
            } else if (k == "Cheese Pressure") {
                return "Cheese"
            }
            return k
        }

        type ClearMap = { [key in DeathTypes]: number }

        const data: StackedDataPoint<ClearMap>[] = []
        for (const key in stats) {
            data.push({
                category: key,
                stat: stats[key].deathStats
            })
        }
        killDeath.push(createStackedBar<ClearMap>(document, "Deaths", data, keys, colors, shortName))
    }

    graphs.push(combineSVGsVertically(killDeath))

    {
        const keys: ClearType[] =
            [
                "perfectClear",
                "allspin",
                "tspinTriple",
                "tspinDouble",
                "tspinSingle",
                "quad",
                "triple",
                "double",
                "single",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.teal,
                defaultRainbow.violet,
                defaultRainbow.purple,
                defaultRainbow.pink,
                defaultRainbow.blue,
                defaultRainbow.orange,
                defaultRainbow.yellow,
                defaultRainbow.red,
            ]
        colors.reverse()

        const shortName = (k: ClearType) => {
            switch (k) {
                case "perfectClear": return "pc"
                case "tspinTriple": return "tst"
                case "tspinDouble": return "tsd"
                case "tspinSingle": return "tss"
                default: return k as string
            }
        }

        type ClearMap = { [key in ClearType]: number }

        const data: StackedDataPoint<ClearMap>[] = []
        for (const key in stats) {
            data.push({
                category: key,
                stat: stats[key].clearTypes
            })
        }
        graphs.push(createStackedBar<ClearMap>(document, "Lineclear Distribution", data, keys, colors, shortName))
    }

    {
        const data: number[][] = []
        const names = []
        for (const key in stats) {
            stats[key]
            data.push(stats[key].ppsSegments)
            names.push(key)
        }

        graphs.push(createMultiPPS(document, "Placement PPS", names, data.map(x => {
            const y = new Array(50).fill(0)
            for (let i = 0; i < x.length; i++) {
                y[Math.floor(i / 2)] += x[i] * 100
            }
            return y
        })))
    }

    {
        const data: number[][] = []
        const names = []
        for (const key in stats) {
            stats[key]
            data.push(stats[key].wellColumns)
            names.push(key)
        }
        if (data.length > 1) {
            graphs.push(createMultiWellCols(document, "Well Columns", names, data.map(x => {
                let sum = 0
                for (const v of x) { sum += v }
                for (let i = 0; i < x.length; i++) {
                    x[i] = x[i] / sum * 100
                }
                return x
            })))
        } else {
            graphs.push(createWellCols(document, "Well Columns", names[0], data[0]))
        }
    }

    const stacked = []

    {
        type StatMap = {
            allspinEfficiency: number
            tEfficiency: number
            iEfficiency: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "allspinEfficiency",
                "tEfficiency",
                "iEfficiency",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.green,
                defaultRainbow.purple,
                defaultRainbow.blue,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "allspinEfficiency": return "allspinEff"
                case "tEfficiency": return "tspinEff"
                case "iEfficiency": return "quadEff"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: key,
                stat: {
                    allspinEfficiency: (Math.round(stats[key].allspinEfficiency * 100)),
                    tEfficiency: (Math.round(stats[key].tEfficiency * 100)),
                    iEfficiency: (Math.round(stats[key].iEfficiency * 100)),
                }
            })
        }
        stacked.push(createOverflowStackedBar<StatMap>(document, "", data, 90, keys, colors, shortName, 30))
    }

    {
        type StatMap = {
            cheeseAPL: number
            downstackAPL: number
            upstackAPL: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "cheeseAPL",
                "downstackAPL",
                "upstackAPL",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.yellow,
                defaultRainbow.red,
                defaultRainbow.green,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "cheeseAPL": return "cheese APL"
                case "downstackAPL": return "downstack APL"
                case "upstackAPL": return "upstack APL"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: key,
                stat: {
                    cheeseAPL: (Math.round(stats[key].cheeseAPL * 100) / 100),
                    downstackAPL: (Math.round(stats[key].downstackAPL * 100) / 100),
                    upstackAPL: (Math.round(stats[key].upstackAPL * 100) / 100),
                }
            })
        }
        stacked.push(createOverflowStackedBar<StatMap>(document, "", data, 1.2 * 3, keys, colors, shortName, 0.5))
    }

    {
        type StatMap = {
            openerPPS: number
            PPS: number
            midgamePPS: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "openerPPS",
                "PPS",
                "midgamePPS",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.yellow,
                defaultRainbow.red,
                defaultRainbow.green,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "openerPPS": return "opener"
                case "PPS": return "overall"
                case "midgamePPS": return "midgame"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: key,
                stat: {
                    openerPPS: (Math.round(stats[key].openerPPS * 100) / 100),
                    PPS: (Math.round(stats[key].PPS * 100) / 100),
                    midgamePPS: (Math.round(stats[key].midgamePPS * 100) / 100),
                }
            })
        }
        stacked.push(createOverflowStackedBar<StatMap>(document, "PPS", data, 2.5 * 3, keys, colors, shortName, 0.9))
    }


    {
        type StatMap = {
            openerAPM: number
            APM: number
            midgameAPM: number
        }
        const keys: (Extract<keyof StatMap, string>)[] =
            [
                "openerAPM",
                "APM",
                "midgameAPM",
            ]
        keys.reverse()
        const colors: string[] =
            [
                defaultRainbow.yellow,
                defaultRainbow.red,
                defaultRainbow.green,
            ]
        colors.reverse()

        const shortName = (k: Extract<keyof StatMap, string>) => {
            switch (k) {
                case "openerAPM": return "opener"
                case "APM": return "overall"
                case "midgameAPM": return "midgame"
                default: return k as string
            }
        }


        const data: StackedDataPoint<StatMap>[] = []
        for (const key in stats) {
            data.push({
                category: key,
                stat: {
                    openerAPM: (Math.round(stats[key].openerAPM)),
                    APM: (Math.round(stats[key].APM)),
                    midgameAPM: (Math.round(stats[key].midgameAPM)),
                }
            })
        }
        stacked.push(createOverflowStackedBar<StatMap>(document, "APM", data, 300, keys, colors, shortName, 37.5))
    }

    graphs.push(combineSVGsVertically(stacked))

    {
        type NodeName = "IncomingAttacks" | "Cheese" | "Clean" | "Cancelled" | "CheeseTanked" | "CleanTanked"
        const indexedNodeNames: NodeName[] = ["IncomingAttacks", "Cheese", "Clean", "Cancelled", "CheeseTanked", "CleanTanked"]

        function color(nodeName: NodeName, targetNodeName: NodeName) {
            if (targetNodeName == "CleanTanked") {
                return defaultRainbow.green
            }
            else if (targetNodeName == "CheeseTanked") {
                return defaultRainbow.red
            }
            else if (targetNodeName == "Cancelled") {
                if (nodeName == "Cheese") {
                    return defaultRainbow.teal
                } else {
                    return defaultRainbow.yellow
                }
            }
            if (targetNodeName == "Cheese") {
                return defaultRainbow.purple
            }
            else if (targetNodeName == "Clean") {
                return defaultRainbow.pink
            }
            return defaultRainbow.teal
        }

        const data: { name: string; links: { source: number; target: number; value: number; }[]; }[] = []

        for (const key in stats) {
            const s = stats[key]
            data.push({
                name: key,
                links: [
                    {
                        source: 0, target: 1,
                        value: (Math.round(s.cheeseLinesRecieved * 100))
                    },
                    {
                        source: 0, target: 2,
                        value: (Math.round(s.cleanLinesRecieved * 100))
                    },
                    {
                        source: 1, target: 3,
                        value: (Math.round(s.cheeseLinesCancelled * 100))
                    },
                    {
                        source: 1, target: 4,
                        value: (Math.round(s.cheeseLinesTanked * 100))
                    },
                    {
                        source: 2, target: 3,
                        value: (Math.round(s.cleanLinesCancelled * 100))
                    },
                    {
                        source: 2, target: 4,
                        value: (Math.round(s.cleanLinesTankedAsCheese * 100))
                    },
                    {
                        source: 2, target: 5,
                        value: (Math.round(s.cleanLinesTankedAsClean * 100))
                    },
                ]
            })
        }
        console.log(createSankey<NodeName>(document, data, indexedNodeNames, color))

        graphs.push(createSankey<NodeName>(document, data, indexedNodeNames, color))
    }

    const speeds = []

    {
        const labels = [
            {
                label: "upstacker",
                color: defaultRainbow.teal
            },
            {
                label: "aggressive",
                color: defaultRainbow.green
            },
            {
                label: "medium",
                color: defaultRainbow.yellow
            },
            {
                label: "defensive",
                color: defaultRainbow.orange
            },
            {
                label: "downstacker",
                color: defaultRainbow.red
            }
        ]

        const data: number[] = []
        const names = []
        for (const key in stats) {
            data.push(Math.round(stats[key].downstackingRatio * 100))
            names.push(key)
        }

        speeds.push(createSpeed(document, "Downstacking Ratio", data, names, 100, [0, 20, 40, 60, 80, 100], labels))
    }

    {
        const labels = [
            {
                label: "lean",
                color: defaultRainbow.teal
            },
            {
                label: "clean",
                color: defaultRainbow.green
            },
            {
                label: "medium",
                color: defaultRainbow.yellow
            },
            {
                label: "cheesy",
                color: defaultRainbow.orange
            },
            {
                label: "greasy",
                color: defaultRainbow.red
            }
        ]

        const data: number[] = []
        const names = []
        for (const key in stats) {
            data.push(Math.round(stats[key].attackCheesiness * 100))
            names.push(key)
        }

        speeds.push(createSpeed(document, "Attack Cheesiness", data, names, 100, [0, 20, 40, 60, 80, 100], labels))
    }

    graphs.push(combineSVGsVertically(speeds))

    {

        const userData: number[][] = []
        const usernames: string[] = []

        for (const key in stats) {
            const ll = [
                (stats[key].surgeAPM),
                (stats[key].surgePPS),
                (stats[key].surgeLength),
                (stats[key].surgeRate * 100),
                (stats[key].surgeSecsPerDS),
                (stats[key].surgeSecsPerCheese)
            ]

            let ok = true
            for (const v of ll) {
                if (Number.isNaN(v)) {
                    ok = false
                    break
                }
            }

            if (ok) {
                usernames.push(key)
                userData.push(ll)
            }
        }

        const axis: radarAxis[] = [
            {
                label: "APM",
                scale: d3.scaleLinear([0, Math.max(300, (Math.max(...userData.map(x => x[0]))))], [0, 1]).clamp(true)
            },
            {
                label: "PPS",
                scale: d3.scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[1]))))], [0, 1]).clamp(true)
            },
            {
                label: "Length",
                scale: d3.scaleLinear([0, Math.max(10, (Math.max(...userData.map(x => x[2]))))], [0, 1]).clamp(true)
            },
            {
                label: "Rate",
                scale: d3.scaleLinear([0, Math.max(15, (Math.max(...userData.map(x => x[3]))))], [0, 1]).clamp(true)
            },
            {
                label: "Sec/DS",
                scale: d3.scaleSqrt([Math.max(20, (Math.max(...userData.map(x => x[4])))), 0], [0, 1]).clamp(true)
            },
            {
                label: "Sec/Cheese",
                scale: d3.scaleSqrt([Math.max(40, (Math.max(...userData.map(x => x[5])))), 0], [0, 1]).clamp(true)
            },
        ]
        graphs.push(createRadar(document, "Surge", axis, userData, usernames))
    }

    {

        const userData: number[][] = []
        const usernames: string[] = []

        for (const key in stats) {
            const ll = [
                (stats[key].PPS),
                (stats[key].PlonkPPS),
                (stats[key].upstackPPS),
                (stats[key].PPSCoeff),
                (stats[key].downstackPPS),
                (stats[key].BurstPPS),
            ]

            let ok = true
            for (const v of ll) {
                if (Number.isNaN(v)) {
                    ok = false
                    break
                }
            }

            if (ok) {
                usernames.push(key)
                userData.push(ll)
            }
        }

        const axis: radarAxis[] = [
            {
                label: "PPS",
                scale: d3.scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[0]))))], [0, 1]).clamp(true)
            },
            {
                label: "Plonk PPS",
                scale: d3.scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[1]))))], [0, 1]).clamp(true)
            },
            {
                label: "Upstack PPS",
                scale: d3.scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[2]))))], [0, 1]).clamp(true)
            },
            {
                label: "PPS Variance",
                scale: d3.scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[3]))))], [0, 1]).clamp(true)
            },
            {
                label: "Downstack PPS",
                scale: d3.scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[4]))))], [0, 1]).clamp(true)
            },
            {
                label: "Burst PPS",
                scale: d3.scaleLinear([0, Math.max(5, (Math.max(...userData.map(x => x[5]))))], [0, 1]).clamp(true)
            },
        ]
        graphs.push(createRadar(document, "PPS", axis, userData, usernames))
    }



    return graphs
}