import { Engine, Mino } from "../../../triangle/src/engine"
import { SurgeScorer } from "./chainScorer"
import { CheeseScorer } from "./cheeseScore"
import { lockResultToRes } from "./lockResult"
import { addLockResultToPlacementStats } from "./statLogic"
import { combineStats, GameStats, newGameStats } from "./types"
import { engineConfig } from "./engineConfig"
import { VersusReplay } from "./versusReplay"
import { TetrisDeathTracker } from "./deathEngine"
import { StackSpeedScorer } from "./stackSpeedScorer"
export function parseReplay(replayString: string, usernames: { name: string, id?: string }[]): { [key: string]: GameStats } | undefined {
    let raw: VersusReplay | null = null
    try {
        let x = JSON.parse(replayString)
        while (true) {
            if ("replay" in x) {
                if ("replay" in x.replay) {
                    x = x.replay
                } else {
                    raw = x
                    break
                }
            } else {
                return undefined
            }
        }
    } catch (e) {
        console.log("invalid replay", e)
        return
    }
    if (raw == null) {
        return
    }
    if (usernames.length == 0 && raw.replay.rounds.length > 0) {
        for (const round of raw.replay.rounds[0]) {
            usernames.push({ name: round.username, id: round.id })
        }
    }

    const statMap: { [key: string]: GameStats } = {}

    const savedUsernames: string[] = []

    for (let i = 0; i < raw.replay.rounds.length; i++) {
        const bigRound = raw.replay.rounds[i]

        const surgeMap: { [key: string]: number[] } = {}


        for (const round of bigRound) {
            try {
                let surges: number[] = []
                const selectedUsername = round.username.toLowerCase()

                if (!round.active) {
                    continue
                }

                let opponents: number[] = []
                for (let event of round.replay.events) {
                    if (event.data.data?.gameid != undefined) {
                        if (!opponents.includes(event.data.data.gameid)) {
                            opponents.push(event.data.data.gameid)
                        }
                    }
                    if (event.data.data?.targets != undefined) {
                        for (const target of event.data.data.targets) {
                            if (!opponents.includes(target)) {
                                opponents.push(target)
                            }
                        }
                    }
                }
                const engine = new Engine(engineConfig(round.replay.options, opponents))
                let lastb2b = 0

                engine.events.on("falling.lock", (x) => {
                    if (engine.stats.b2b == -1) {
                        if (lastb2b >= 5 && x.rawGarbage.reduce((partialSum, a) => partialSum + a, 0) >= 4) {
                            surges.push(engine.frame)
                        }
                    }
                    lastb2b = engine.stats.b2b
                })
                const events = structuredClone(round.replay.events)
                loop1: while (events.length > 0) {
                    while (engine.frame < events[0].frame) {
                        engine.tick([])
                    }
                    let toTick: any[] = []
                    while (events[0].frame < engine.frame) { //sanity
                        console.log(events[0])
                        events.shift()
                    }
                    while (events[0].frame == engine.frame) {
                        if (events[0].type == "end") {
                            events.shift()
                            break loop1;
                        }
                        toTick.push(events.shift())
                    }
                    engine.tick(toTick)
                }

                engine.events.removeAllListeners()
                surgeMap[selectedUsername] = surges

                let savable = false
                for (const u of usernames) {
                    if (round.username.toLowerCase() == u.name.toLowerCase()) {
                        savable = true
                        break
                    }
                }
                for (const u of usernames) {
                    if (u.id != undefined && round.id == u.id) {
                        savable = true
                        break
                    }
                }

                if (!(selectedUsername in statMap) && savable) statMap[selectedUsername] = newGameStats()
            } catch (e) {
                console.log(e)
            }
        }

        for (const round of bigRound) {
            try {
                const stackSpeedScorer = new StackSpeedScorer()
                const deathEngine = new TetrisDeathTracker()
                const totalGameStats = newGameStats()

                let lockDelays: number[] = []

                let selectedUsername: string | undefined = undefined

                for (const u of usernames) {
                    if (round.username.toLowerCase() == u.name.toLowerCase()) {
                        selectedUsername = u.name.toLowerCase()
                        break
                    }
                }
                for (const u of usernames) {
                    if (u.id != undefined && round.id == u.id) {
                        selectedUsername = u.name.toLowerCase()
                        break
                    }
                }

                let opponents: number[] = []
                for (let event of round.replay.events) {
                    if (event.data.data?.gameid != undefined) {
                        if (!opponents.includes(event.data.data.gameid)) {
                            opponents.push(event.data.data.gameid)
                        }
                    }
                    if (event.data.data?.targets != undefined) {
                        for (const target of event.data.data.targets) {
                            if (!opponents.includes(target)) {
                                opponents.push(target)
                            }
                        }
                    }
                }


                const engine = new Engine(engineConfig(round.replay.options, opponents))

                let phase: "noG" | "comboing" | "midgame" = "noG"

                const cheeseScorer = new CheeseScorer()

                const surgeScorer = new SurgeScorer()

                let cheeseOnBoard = false
                let realCheeseOnBoard = false
                let garbageOnBoard = false

                let toppedOut = false

                let lastGarbageCol = -1

                engine.events.on("falling.lock", (lockResult) => {
                    const res = lockResultToRes(lockResult, engine)
                    if (res.clearInfo != undefined) {
                        surgeScorer.addLineClear(
                            totalGameStats.surge,
                            res.clearInfo.clearType,
                            res.clearInfo.BTBClear,
                            res.clearInfo.attack.reduce((partialSum, a) => partialSum + a, 0),
                            res.clearInfo.linesCleared, res.clearInfo.downstackCleared,
                            res.frameDelay,
                            garbageOnBoard, cheeseOnBoard)
                    } else {
                        surgeScorer.addStack(totalGameStats.surge, res.frameDelay, garbageOnBoard, cheeseOnBoard)
                    }
                    if (phase == "noG" && lockResult.garbageLines > 0) {
                        phase = "comboing"
                    }
                    else if (phase == "comboing" && lockResult.lines == 0) {
                        phase = "midgame"
                    }

                    if (phase == "midgame") {
                        lockDelays.push(lockResult.frameDelay)
                    }


                    addLockResultToPlacementStats(totalGameStats.placement, res, phase != "midgame", cheeseScorer, cheeseOnBoard)
                    {
                        let garbageHeight = 0
                        let garbageColumn = -1

                        let garbageHeights = []
                        let newGarbageColumn = -1
                        let gEnd = 0
                        outer: for (let y = 0; y < engine.board.state.length; y++) {
                            gEnd = y
                            let gCol = -1
                            for (let x = 0; x < engine.board.state[y].length; x++) {
                                if (engine.board.state[y][x] === null) {
                                    gCol = x
                                }
                                else if (engine.board.state[y][x] === "gb" || engine.board.state[y][x] === Mino.GARBAGE) {
                                    if (gCol != -1) {
                                        break
                                    }
                                } else {
                                    break outer
                                }
                            }
                            if (gCol == garbageColumn) {
                                garbageHeight += 1
                            } else {
                                if (garbageHeight > 0) garbageHeights.push(garbageHeight)
                                garbageHeight = 1
                                garbageColumn = gCol
                                newGarbageColumn = gCol
                            }
                        }

                        if (phase == "midgame") {
                            if (lockResult.garbageLines > 0) {
                                if (newGarbageColumn != lastGarbageCol) {
                                    stackSpeedScorer.update(true, res.frameDelay)
                                    lastGarbageCol = newGarbageColumn
                                } else {
                                    stackSpeedScorer.update(false, res.frameDelay)
                                }
                            } else {
                                stackSpeedScorer.update((res.clearInfo === undefined) ? "upstack" : "clear", res.frameDelay)
                            }
                        }


                        let stackHeight = 0

                        outer: for (let y = gEnd; y < engine.board.state.length; y++) {
                            gEnd = y
                            let found = false
                            for (let x = 0; x < engine.board.state[y].length; x++) {
                                if (engine.board.state[y][x] != null) {
                                    found = true
                                    break
                                }
                            }
                            if (!found) {
                                stackHeight += 1
                            } else {
                                break
                            }
                        }



                        if (garbageHeight > 0) garbageHeights.push(garbageHeight)

                        if (garbageHeights.length > 0 && garbageHeights[garbageHeights.length - 1] < 4) {
                            cheeseOnBoard = true
                        } else {
                            cheeseOnBoard = false
                        }

                        let totalCheeseLines = 0

                        for (let i = garbageHeights.length - 1; i >= 0; i--) {
                            if (garbageHeights[i] < 4) {
                                totalCheeseLines += garbageHeights[i]
                            } else {
                                break
                            }
                        }


                        if (totalCheeseLines >= 4 && stackHeight <= 10) {
                            realCheeseOnBoard = true
                        } else {
                            realCheeseOnBoard = false
                        }



                        if (garbageHeights.length == 0) {
                            garbageOnBoard = false

                        } else {
                            garbageOnBoard = true
                        }
                    }
                })
                type GarbageChange = "cancel" | "tank" | "confirm"

                const garbageEvents: { type: GarbageChange, change: number, id: number }[] = []



                engine.events.on("garbage.cancel", (ev) => {
                    garbageEvents.push({
                        type: "cancel",
                        change: ev.amount,
                        id: ev.id
                    })
                })
                engine.events.on("garbage.tank", (ev) => {
                    garbageEvents.push({
                        type: "tank",
                        change: ev.amount,
                        id: ev.id
                    })
                })
                engine.events.on("garbage.receive", (ev) => {
                    deathEngine.update(realCheeseOnBoard, ev.original, engine.frame)
                    garbageEvents.push({
                        type: "confirm",
                        change: ev.original,
                        id: ev.id
                    })
                    if (ev.original - ev.amount) {
                        garbageEvents.push({
                            type: "cancel",
                            change: ev.original - ev.amount,
                            id: ev.id
                        })
                    }
                })

                const events = round.replay.events
                let desynced = false
                loop1: while (events.length > 0) {
                    while (engine.frame < events[0].frame) {
                        engine.tick([])
                    }
                    let toTick: any[] = []
                    while (events[0].frame < engine.frame) { //sanity
                        console.log(events[0])
                        events.shift()
                    }
                    while (events[0].frame == engine.frame) {
                        if (events[0].type == "end") {
                            events.shift()
                            break loop1;
                        }
                        toTick.push(events.shift())
                    }
                    engine.tick(toTick)

                    if (toppedOut && events.length > 10) {
                        desynced = true
                    }
                }
                if (!desynced) {
                    stackSpeedScorer.clearCache()
                    totalGameStats.placement.stackSpeed = stackSpeedScorer.getStats()

                    if (surgeScorer.btb >= 4) totalGameStats.placement.attack += surgeScorer.btb
                    surgeScorer.addCached(totalGameStats.surge)

                    for (const key in surgeMap) {
                        if (key != selectedUsername) {
                            for (const x of surgeMap[key]) {
                                deathEngine.updateSurgeReceived(x)
                            }
                        } else {
                            for (const x of surgeMap[key]) {
                                deathEngine.updateSurgeSent(x)
                            }
                        }
                    }

                    const pendingGarbages: { id: number, cancelled: number, tanked: number, original: number }[] = []

                    while (true) {
                        let allFailed = true
                        let toTrim = []

                        for (let i = 0; i < garbageEvents.length; i++) {
                            const event = garbageEvents[i]
                            if (event.type == "confirm") {
                                toTrim.push(i)
                                allFailed = false


                                pendingGarbages.push({
                                    id: event.id,
                                    cancelled: 0,
                                    tanked: 0,
                                    original: event.change
                                })
                            } else {
                                const idx = pendingGarbages.findIndex(e => e.id == event.id)
                                if (idx >= 0) {
                                    toTrim.push(i)
                                    allFailed = false

                                    if (event.type == "cancel") {
                                        pendingGarbages[idx].cancelled += event.change
                                    } else {
                                        pendingGarbages[idx].tanked += event.change
                                    }

                                    if (pendingGarbages[idx].cancelled + pendingGarbages[idx].tanked >= pendingGarbages[idx].original) {
                                        const outgoing = pendingGarbages.splice(idx, 1)[0]

                                        totalGameStats.garbage.linesReceived += outgoing.original


                                        if (outgoing.original >= 4) {
                                            totalGameStats.garbage.cleanLinesRecieved += outgoing.original
                                        } else {
                                            totalGameStats.garbage.cheeseLinesRecieved += outgoing.original
                                        }


                                        if (outgoing.original >= 4) {
                                            totalGameStats.garbage.cleanLinesCancelled += outgoing.cancelled
                                            if (outgoing.tanked < 4) {
                                                totalGameStats.garbage.cleanLinesTankedAsCheese += outgoing.tanked
                                            } else {
                                                totalGameStats.garbage.cleanLinesTankedAsClean += outgoing.tanked
                                            }
                                        } else {
                                            totalGameStats.garbage.cheeseLinesCancelled += outgoing.cancelled
                                            totalGameStats.garbage.cheeseLinesTanked += outgoing.tanked
                                        }
                                    }
                                }
                            }
                        }

                        toTrim.reverse()
                        for (const trim of toTrim) {
                            garbageEvents.splice(trim, 1)
                        }


                        if (allFailed) { break }
                    }

                    for (const i of lockDelays) {
                        const idx = Math.min(Math.floor((1 / (i / 60)) * 10), 99)
                        if (!Number.isNaN(idx)) {
                            totalGameStats.placement.ppsSegments[idx] += 1
                        }
                    }


                    //console.log(totalGameStats.garbage, pendingGarbages)
                    engine.events.removeAllListeners()

                    if (!round.alive) {
                        const deathy = deathEngine.death(engine.frame)
                        totalGameStats.death[deathy] += 1
                        for (const key in statMap) {
                            if (key.toLowerCase() != selectedUsername?.toLowerCase()) {
                                statMap[key].kill[deathy] += 1
                            }
                        }
                    }

                    if (selectedUsername != undefined) {
                        if (selectedUsername in statMap) {
                            combineStats(statMap[selectedUsername], totalGameStats)
                        } else {
                            statMap[selectedUsername] = totalGameStats
                        }
                    }



                } else {
                    console.log("DESYNC!" + i)
                }
            } catch (e) {
                console.log(e)
            }
        }
    }

    return statMap


}
/*

function segmentByMeanAndStd(arr: number[], stdMultiplier = 0.5) {
    if (arr.length === 0) return [];

    const segments = [];
    let currentSegment = [arr[0]];

    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

    const stdDev = (values: number[]) => {
        const avg = mean(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        return Math.sqrt(variance);
    };

    for (let i = 1; i < arr.length; i++) {
        const avg = mean(currentSegment);
        const std = stdDev(currentSegment);

        if (Math.abs(arr[i] - avg) <= std * stdMultiplier || currentSegment[0] === 0) {
            currentSegment.push(arr[i]);
        } else {
            segments.push(mean(currentSegment));
            currentSegment = [arr[i]];
        }
    }

    segments.push(mean(currentSegment)); // Final segment
    return segments;
}*/



function segmentByMeanAndStd(arr: number[]) {
    if (arr.length === 0) return [];

    const result = [];
    let group = [arr[0]];
    let sum = 0

    for (let i = 1; i < arr.length; i++) {
        if (Math.abs(arr[i] - sum / group.length) < 15) {
            group.push(arr[i]);
            sum += arr[i]
        } else {
            const avg = sum / group.length;
            for (let i = 0; i < Math.ceil(group.length / 2); i++) {
                result.push(1 / (avg / 60));
            }
            group = [arr[i]];
            sum = arr[i]
        }
    }

    // Don't forget to handle the last group
    const avg = group.reduce((sum, num) => sum + num, 0) / group.length;
    result.push(1 / (avg / 60));

    return result;
}