import { ClearType, SurgeStats } from "./types";

const SURGE_BTB_FLOOR = 4

export class SurgeScorer{
    btb: number = -1
    garbageCleared: number = 0
    linesCleared: number = 0
    attack: number = 0
    frames: number = 0
    pieces: number = 0
    allspins: number = 0
    btbClears: number = 0

    addLineClear(surgeStats: SurgeStats, clearType: ClearType, btb:boolean, attack: number, linesCleared: number, garbageCleared: number, frames: number, garbageOnBoard: boolean, cheeseOnBoard: boolean){
        if(!btb){
            if(this.btb >= SURGE_BTB_FLOOR){
                surgeStats.attack += this.attack + attack
                surgeStats.btb += this.btb
                surgeStats.chains += 1
                surgeStats.frames += this.frames
                //console.log(this.frames/60, this.pieces, this.pieces/(this.frames/60))
                surgeStats.garbageCleared += this.garbageCleared
                surgeStats.linesCleared += this.linesCleared
                surgeStats.pieces += this.pieces
                surgeStats.allspins += this.allspins
                surgeStats.btbClears += this.btbClears
            }else{
                surgeStats.fails += this.btbClears
            }
            this.attack = 0
            this.btb = -1
            this.garbageCleared = 0
            this.linesCleared = 0
            this.frames = 0
            this.pieces = 0
            this.allspins = 0
            this.btbClears = 0
            return
        }
        if(this.btb == -1){
            this.frames = 0
            this.pieces = 0
        }
        this.btbClears += 1
        this.attack += attack
        this.btb += 1
        this.frames += frames
        this.garbageCleared += garbageCleared
        this.linesCleared += linesCleared
        this.pieces += 1
        if(clearType == "allspin"){
            this.allspins += 1
        }
        if(this.btb >= SURGE_BTB_FLOOR){
            if(garbageOnBoard){
                surgeStats.framesWithSurgeGarbage += frames
                surgeStats.surgeGarbageCleared += garbageCleared
            }
            if(cheeseOnBoard){
                surgeStats.framesWithSurgeCheese += frames
                surgeStats.surgeCheeseCleared += garbageCleared
            }
        }
    }
    addStack(surgeStats: SurgeStats, frames: number, garbageOnBoard: boolean, cheeseOnBoard: boolean){
        this.pieces += 1
        this.frames += frames
        if(this.btb >= SURGE_BTB_FLOOR){
            if(garbageOnBoard){
                surgeStats.framesWithSurgeGarbage += frames
            }
            if(cheeseOnBoard){
                surgeStats.framesWithSurgeCheese += frames
            }
        }
    }
    addCached(surgeStats: SurgeStats){
        if(this.btb < SURGE_BTB_FLOOR){
            return
        }
        surgeStats.attack += this.attack
        surgeStats.btb += this.btb
        surgeStats.chains += 1
        surgeStats.garbageCleared += this.garbageCleared
        surgeStats.linesCleared += this.linesCleared
        surgeStats.allspins += this.allspins
    }
}

export class ComboScorer{

}