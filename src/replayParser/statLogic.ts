import { CheeseScorer } from "./cheeseScore"
import { CumulativeStats, GameStats, LockResult, PlacementStats } from "./types"

const GMM = require('gaussian-mixture');

function sigmoid(x: number){
    const top = 1/(1+Math.exp(-10 * (x-0.3))) - 1/(1+Math.exp(3))
    const bottom = 1/(1+Math.exp(-7)) - 1/(1+Math.exp(3))
    return top/bottom
}

export function calculateCumulativeStats(stats: GameStats): CumulativeStats {
    const placement = stats.placement
    const garbage = stats.garbage
    const surge = stats.surge
    const timeSecs = placement.frameDelay / 60
    const timeMin = timeSecs / 60

    const openerTimeSecs = placement.openerFrames / 60
    const openerTimeMin = openerTimeSecs / 60

    const surgeTimeSecs = surge.frames / 60
    const surgeTimeMin = surgeTimeSecs / 60

    const PPSSegments: number[] = []
    for (let i = 0; i < stats.placement.ppsSegments.length; i++) {
        const PPS = i / 10
        for (let j = 0; j < stats.placement.ppsSegments[i]; j++)PPSSegments.push(PPS)
    }

    //const ppsSegAvg = PPSSegments.reduce((accumulator, currentValue) => accumulator + currentValue, 0)/PPSSegments.length;


    const gmm = new GMM(3);
    gmm._initialize(PPSSegments)
    gmm.optimize(PPSSegments); // updates the means of the GMM with the K-means++ initialization algorithm, returns something like [1.3, 7.4, 14.3]
    

    function getVariance(arr: number[], mean: number) {
        return arr.reduce(function(pre, cur) {
            pre = pre + Math.pow((cur - mean), 2);
            return pre;
        }, 0)/arr.length
    }

    const pps = placement.pieces / timeSecs

    const PPSCoeff = getVariance(PPSSegments, pps)
    const BurstPPS = Math.max(...gmm.means)
    const PlonkPPS = Math.min(...gmm.means)

    const wellColSum = placement.wellColumns.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const ppsSegmentSum = placement.ppsSegments.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    return {
        wellColumns: placement.wellColumns.map(x => x / wellColSum),
        clearTypes: placement.clearTypes,
        allspinEfficiency: placement.allspins / placement.allPieces,
        tEfficiency: (placement.clearTypes.tspinSingle + placement.clearTypes.tspinDouble + placement.clearTypes.tspinTriple) / placement.tPieces,
        iEfficiency: placement.clearTypes.quad / placement.iPieces,
        cheeseAPL: placement.attackWithCheese / placement.cheeseCleared,
        downstackAPL: placement.attackWithDownstack / placement.downstackCleared,
        upstackAPL: (placement.attack - placement.attackWithDownstack) / (placement.linesCleared - placement.downstackCleared),
        APL: placement.attack / placement.linesCleared,
        APP: placement.attack / placement.pieces,
        KPP: placement.keypresses / placement.pieces,
        KPS: placement.keypresses / timeSecs,
        APM: placement.attack / timeMin,
        PPS: pps,

        ppsSegments: placement.ppsSegments.map(x => x / ppsSegmentSum),

        BurstPPS,
        PlonkPPS,
        PPSCoeff,

        midgameAPM: (placement.attack - placement.openerAttack) / (timeMin - openerTimeMin),
        midgamePPS: (placement.pieces - placement.openerBlocks) / (timeSecs - openerTimeSecs),
        openerAPM: placement.openerAttack / openerTimeMin,
        openerPPS: placement.openerBlocks / openerTimeSecs,

        attackCheesiness: sigmoid(placement.cheeseScore / placement.linesSent),
        surgeAPM: surge.attack / surgeTimeMin,
        surgeAPL: surge.attack / surge.linesCleared,
        surgeDS: surge.garbageCleared / surge.chains,
        surgePPS: surge.pieces / surgeTimeSecs,
        surgeLength: surge.btb / surge.chains,
        surgeRate: surge.chains / (surge.chains + surge.fails),

        surgeSecsPerCheese: (surge.framesWithSurgeCheese / 60) / surge.surgeCheeseCleared,
        surgeSecsPerDS: (surge.framesWithSurgeGarbage / 60) / surge.surgeGarbageCleared,
        surgeAllspin: surge.allspins / surge.btbClears,

        cleanLinesRecieved: garbage.cleanLinesRecieved / garbage.linesReceived,
        cheeseLinesRecieved: garbage.cheeseLinesRecieved / garbage.linesReceived,

        cheeseLinesCancelled: garbage.cheeseLinesCancelled / garbage.linesReceived,
        cheeseLinesTanked: garbage.cheeseLinesTanked / garbage.linesReceived,

        cleanLinesCancelled: garbage.cleanLinesCancelled / garbage.linesReceived,
        cleanLinesTankedAsCheese: garbage.cleanLinesTankedAsCheese / garbage.linesReceived,
        cleanLinesTankedAsClean: garbage.cleanLinesTankedAsClean / garbage.linesReceived,
        
        deathStats: stats.death,
        killStats: stats.kill,

        upstackPPS: stats.placement.stackSpeed.stacking.totalUpdates/(stats.placement.stackSpeed.stacking.totalFrames/60),
        downstackPPS: stats.placement.stackSpeed.downstacking.totalUpdates/(stats.placement.stackSpeed.downstacking.totalFrames/60),

        downstackingRatio: stats.placement.stackSpeed.downstacking.totalFrames/(stats.placement.stackSpeed.stacking.totalFrames + stats.placement.stackSpeed.downstacking.totalFrames)
    }
}

export function addLockResultToPlacementStats(base: PlacementStats, lockResult: LockResult, opener: boolean, cheeseScorer: CheeseScorer, cheeseOnBoard: boolean) {
    if (lockResult.wellColumn != undefined) base.wellColumns[lockResult.wellColumn]++
    base.keypresses += lockResult.keypresses
    base.pieces += 1
    if (opener) {
        base.openerBlocks += 1
        base.openerFrames += lockResult.frameDelay
    }
    if (lockResult.shape == "I") {
        base.iPieces += 1
    } else if (lockResult.shape == "T") {
        base.tPieces += 1
    } else if (lockResult.shape != "O" && lockResult.clearInfo) {
        base.allPieces += 1
    }
    if (lockResult.clearInfo) {

        base.clearTypes[lockResult.clearInfo.clearType] += 1
        if (lockResult.clearInfo.clearType == "allspin") {
            base.allspins += 1
        }
        const atk = lockResult.clearInfo.attack.reduce((partialSum, a) => partialSum + a, 0);
        if (opener) {
            base.openerAttack += atk
        }
        base.attack += atk
        base.attacksSent += lockResult.clearInfo.attackSent.length
        base.linesSent += lockResult.clearInfo.attackSent.reduce((partialSum, a) => partialSum + a, 0);
        base.cleanAttacksSent += lockResult.clearInfo.attackSent.filter(m => m >= 4).length
        base.cleanLinesSent += lockResult.clearInfo.attackSent.filter(m => m >= 4).reduce((partialSum, a) => partialSum + a, 0);

        base.linesCleared += lockResult.clearInfo.linesCleared
        base.downstackCleared += lockResult.clearInfo.downstackCleared

        if (lockResult.clearInfo.downstackCleared > 0) {
            if (cheeseOnBoard) {
                base.attackWithCheese += atk
                base.cheeseCleared += lockResult.clearInfo.downstackCleared
            }
            base.attackWithDownstack += atk
        }

        lockResult.clearInfo.attackSent.forEach(x => base.cheeseScore += cheeseScorer.getScore(x))
    }

    base.frameDelay += lockResult.frameDelay

}