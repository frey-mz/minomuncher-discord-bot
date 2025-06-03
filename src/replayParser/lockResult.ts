import { Engine } from "@triangle";
import { ClearType, LockResult, MinoType } from "./types";
import { Mino } from "../../../triangle/src/engine";

export function lockResultToRes(lockResult: Engine.LockRes, engine: Engine.Engine): LockResult {
    let clearInfo = undefined
    let BTBClear = false
    if (lockResult.lines > 0) {
        let clearType: ClearType
        if (engine.board.perfectClear) {
            BTBClear = true
            clearType = "perfectClear"
        } else if (lockResult.lines == 1) {
            if (lockResult.spin == "none") {
                clearType = "single"
            } else if (lockResult.spin == "mini") {
                BTBClear = true
                clearType = "allspin"
            } else {
                BTBClear = true
                if (lockResult.mino == Engine.Mino.T) {
                    clearType = "tspinSingle"
                } else {
                    clearType = "allspin"
                }
            }
        } else if (lockResult.lines == 2) {
            if (lockResult.spin == "none") {
                clearType = "double"
            } else{
                BTBClear = true
                if (lockResult.mino == Engine.Mino.T) {
                    clearType = "tspinDouble"
                } else {
                    clearType = "allspin"
                }
            }
        } else if (lockResult.lines == 3) {
            if (lockResult.spin == "none") {
                clearType = "triple"
            } else{
                BTBClear = true
                if (lockResult.mino == Engine.Mino.T) {
                    clearType = "tspinDouble"
                } else {
                    clearType = "allspin"
                }
            }
        } else {
            clearType = "quad"
            BTBClear = true
        }

        clearInfo = {
            linesCleared: lockResult.lines,
            downstackCleared: lockResult.garbageLines,
            clearType,
            attack: lockResult.rawGarbage,
            attackSent: lockResult.garbage,
            BTBClear,
        }
    }

    let wellColumn = undefined
    let smallestHeight = Infinity
    for(let x = 0; x < engine.board.state[0].length; x++){
        for(let y = engine.board.state.length-1; y >= 0; y--){
            if(engine.board.state[y][x] != null || y == 0){
                if(wellColumn===undefined || smallestHeight > y){
                    smallestHeight = y
                    wellColumn = x
                }
                break
            }
        }
    }
    if(wellColumn != undefined){
        let count = 0
        let gCount = 0
        outer: for(let y = smallestHeight+1; y < engine.board.state.length; y++){
            let g = false
            for(let x = 0; x < engine.board.state[y].length; x++){
                if(x == wellColumn){
                    continue
                }
                if(engine.board.state[y][x] == null){
                    break outer
                }
                if(engine.board.state[y][x] == "gb" || engine.board.state[y][x] == Mino.GARBAGE){
                    g = true
                }
            }
            if(g)gCount ++
            count ++
        }
        if(count < 4 || gCount == count){
            wellColumn = undefined
        }
    }


    return {
        shape: minoToType(lockResult.mino),
        clearInfo,
        keypresses: lockResult.keyPresses,
        frameDelay: lockResult.frameDelay,
        wellColumn
    }
}

function minoToType(mino: Mino): MinoType {
    switch (mino) {
        case Mino.I: return "I"
        case Mino.O: return "O"
        case Mino.T: return "T"
        case Mino.L: return "L"
        case Mino.J: return "J"
        case Mino.S: return "S"
        case Mino.Z: return "Z"
        default: throw new Error(`unknown minotype: ${mino}`)
    }
}