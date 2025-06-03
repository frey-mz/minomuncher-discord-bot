export type Players = { [key: string]: CumulativeStats }

export type ClearType =
    "perfectClear" | "allspin" | "single" | "tspinSingle" |
    "double" | "tspinDouble" | "triple" |
    "tspinTriple" | "quad"


export type DeathTypes = "Surge Conflict" | "Surge Spike" | "Cheese Spike" | "Spike" | "Cheese Pressure" | "Pressure"

export type MinoType = "I" | "O" | "T" | "L" | "J" | "S" | "Z"

export type LockResult = {
    shape: MinoType,
    clearInfo?: {
        linesCleared: number,
        downstackCleared: number,
        clearType: ClearType,
        attack: number[],
        attackSent: number[],
        BTBClear: boolean,
    }
    keypresses: number,
    frameDelay: number,
    wellColumn?: number
}

export type CumulativeStats = {
    wellColumns: number[] //graphed out
    clearTypes: { [key in ClearType]: number } //graphed out
    allspinEfficiency: number //overflowable stacked bar v
    tEfficiency: number //overflowable stacked barv | 
    iEfficiency: number //overflowable stacked bar ^

    ppsSegments: number[]

    cheeseAPL: number //overflowable stacked bar v
    downstackAPL: number //overflowable stacked bar |
    upstackAPL: number //overflowable stacked bar ^

    APL: number
    APP: number

    KPP: number
    KPS: number

    APM: number //overflowable stacked bar v
    PPS: number

    BurstPPS: number
    PlonkPPS: number
    PPSCoeff: number

    midgameAPM: number
    midgamePPS: number
    openerAPM: number
    openerPPS: number //overflowable stacked bar ^

    attackCheesiness: number //speed

    cleanLinesRecieved: number,
    cheeseLinesRecieved: number,

    cheeseLinesCancelled: number,
    cheeseLinesTanked: number,

    cleanLinesCancelled: number,
    cleanLinesTankedAsCheese: number,
    cleanLinesTankedAsClean: number

    surgeAPM: number //just do a big radar? lolol
    surgeAPL: number
    surgeDS: number
    surgePPS: number
    surgeLength: number
    surgeRate: number
    surgeSecsPerDS: number
    surgeSecsPerCheese: number
    surgeAllspin: number

    deathStats: DeathStats
    killStats: DeathStats

    upstackPPS : number,
    downstackPPS: number

    downstackingRatio: number
}

export type StackSpeed = {
    stacking: {
        totalUpdates: number,
        totalFrames: number,
    },
    downstacking: {
        totalUpdates: number,
        totalFrames: number,
    }
}

export type DeathStats = { [key in DeathTypes]: number }

export type PlacementStats = {
    stackSpeed: StackSpeed


    wellColumns: number[]
    clearTypes: { [key in ClearType]: number }
    ppsSegments: number[]
    pieces: number

    openerAttack: number
    openerFrames: number
    openerBlocks: number

    allspins: number

    iPieces: number
    tPieces: number
    allPieces: number

    attack: number
    attacksSent: number
    cleanAttacksSent: number
    cleanLinesSent: number
    linesSent: number

    cheeseScore: number

    linesCleared: number
    downstackCleared: number
    cheeseCleared: number
    attackWithCheese: number
    //stackCleared = linesCleared - downstackCleared
    attackWithDownstack: number
    //atk with stack = atk - atk w ds
    frameDelay: number

    keypresses: number

}

export type GarbageStats = {
    linesReceived: number,
    cleanLinesRecieved: number,
    cheeseLinesRecieved: number,

    cheeseLinesCancelled: number,
    cheeseLinesTanked: number,

    cleanLinesCancelled: number,
    cleanLinesTankedAsCheese: number,
    cleanLinesTankedAsClean: number

}

export type SurgeStats = {
    chains: number
    btb: number
    garbageCleared: number
    linesCleared: number
    attack: number
    frames: number
    pieces: number
    fails: number
    framesWithSurgeGarbage: number
    surgeGarbageCleared: number

    framesWithSurgeCheese: number
    surgeCheeseCleared: number

    allspins: number
    btbClears: number
}

export type SpikeStats = {
    attack: number,
    frames: number,

}
export type ComboStats = {
    chains: number
    combo: number
    garbageCleared: number
    linesCleared: number
    attack: number
    frames: number
    pieces: number
    fails: number
}

export type GameStats = {
    placement: PlacementStats,
    garbage: GarbageStats
    surge: SurgeStats
    death: DeathStats
    kill: DeathStats
}

export function newGameStats(): GameStats {
    const placementStats: PlacementStats = {
        ppsSegments: new Array(100).fill(0),
        wellColumns: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        clearTypes: {
            perfectClear: 0,
            allspin: 0,
            single: 0,
            tspinSingle: 0,
            double: 0,
            tspinDouble: 0,
            triple: 0,
            tspinTriple: 0,
            quad: 0,
        },
        pieces: 0,
        openerAttack: 0,
        openerFrames: 0,
        openerBlocks: 0,
        allspins: 0,
        iPieces: 0,
        tPieces: 0,
        attack: 0,
        attacksSent: 0,
        cleanAttacksSent: 0,
        linesCleared: 0,
        downstackCleared: 0,
        attackWithDownstack: 0,
        cleanLinesSent: 0,
        frameDelay: 0,

        cheeseScore: 0,

        keypresses: 0,
        cheeseCleared: 0,
        attackWithCheese: 0,
        allPieces: 0,
        linesSent: 0,
        stackSpeed: {
            stacking: {
                totalUpdates: 0,
                totalFrames: 0
            },
            downstacking: {
                totalUpdates: 0,
                totalFrames: 0
            }
        }
    }
    const garbageStats: GarbageStats = {
        linesReceived: 0,
        cleanLinesRecieved: 0,
        cheeseLinesRecieved: 0,
        cheeseLinesCancelled: 0,
        cheeseLinesTanked: 0,
        cleanLinesCancelled: 0,
        cleanLinesTankedAsCheese: 0,
        cleanLinesTankedAsClean: 0
    }
    return {
        placement: placementStats,
        garbage: garbageStats,
        surge: {
            chains: 0,
            btb: 0,
            garbageCleared: 0,
            linesCleared: 0,
            attack: 0,
            frames: 0,
            pieces: 0,
            fails: 0,
            framesWithSurgeGarbage: 0,
            surgeGarbageCleared: 0,
            framesWithSurgeCheese: 0,
            surgeCheeseCleared: 0,
            allspins: 0,
            btbClears: 0
        },
        death: {
            "Surge Conflict": 0,
            "Surge Spike": 0,
            "Cheese Spike": 0,
            Spike: 0,
            "Cheese Pressure": 0,
            Pressure: 0
        },
        kill: {
            "Surge Conflict": 0,
            "Surge Spike": 0,
            "Cheese Spike": 0,
            Spike: 0,
            "Cheese Pressure": 0,
            Pressure: 0
        }
    }
}

type CombinableStats<T> = { [key in keyof T]: number | number[] | CombinableStats<T[key]> }

export function combineStats<T>(first: CombinableStats<T>, second: CombinableStats<T>) {
    for (const key in first) {
        if (typeof first[key] === "number" && typeof second[key] === "number") {
            first[key] += second[key]
        } else if (Array.isArray(first[key]) && Array.isArray(second[key])) {
            for (let i = 0; i < first[key].length; i++) {
                first[key][i] += second[key][i] || 0;
            }
        }
        else if (
            typeof first[key] === 'object' &&
            first[key] !== null &&
            typeof second[key] === 'object' &&
            second[key] !== null
        ) {
            combineStats(first[key] as CombinableStats<CombinableStats<T>[typeof key]>, second[key] as CombinableStats<CombinableStats<T>[typeof key]>);
        }
    }
}