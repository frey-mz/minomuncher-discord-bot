//define stacking as at least (7) placements in a row that don't clear any lines at all
//start at first piece placement after clearing a line/game start, end on clearing a line
//define downstacking as a segment where more than 3 individual garbage columns are cleared (so not just spamming a garbage well) where a ppd is < 5
//start at first garbage line cleared, end on last garbage line cleared

export class StackSpeedScorer {
    stackingFrames = 0;
    stackingUpdates = 0;
    downstackingFrames = 0;
    downstackingUpdates = 0;

    downstackingSegment = {
        frameDelay: 0,
        delaySinceDownstack: 0,
        updatesSinceDownstack: 0,
        updates: 0,
        shifts: 0
    }

    upstackingSegment = {
        frameDelay: 0,
        updates: 0
    }

    update(lineClearState: boolean | "upstack" | "clear", frameDelay: number) {
        if (lineClearState == "upstack") {
            this.upstackingSegment.frameDelay += frameDelay
            this.upstackingSegment.updates += 1
        } else {
            if (this.upstackingSegment.updates >= 7) {
                //console.log("ended upstack!",this.upstackingSegment.updates, dbg)
                this.stackingUpdates += this.upstackingSegment.updates
                this.stackingFrames += this.upstackingSegment.frameDelay
            }
            this.upstackingSegment.updates = 0
            this.upstackingSegment.frameDelay = 0
        }

        if (typeof lineClearState == "boolean") {
            this.downstackingSegment.frameDelay += this.downstackingSegment.delaySinceDownstack
            this.downstackingSegment.updates += this.downstackingSegment.updatesSinceDownstack
            this.downstackingSegment.delaySinceDownstack = 0
            this.downstackingSegment.updatesSinceDownstack = 0
            this.downstackingSegment.frameDelay += frameDelay
            this.downstackingSegment.updates += 1
            if (lineClearState) this.downstackingSegment.shifts += 1
        } else {
            this.downstackingSegment.updatesSinceDownstack += 1
            this.downstackingSegment.delaySinceDownstack += frameDelay
            if (this.downstackingSegment.updatesSinceDownstack>=7) {
                if (this.downstackingSegment.shifts >= 1) {
                    //console.log("ended downstack!", this.downstackingSegment.updates, dbg)
                    this.downstackingFrames += this.downstackingSegment.frameDelay
                    this.downstackingUpdates += this.downstackingSegment.updates
                }
                this.downstackingSegment = {
                    frameDelay: 0,
                    delaySinceDownstack: 0,
                    updatesSinceDownstack: 0,
                    updates: 0,
                    shifts: 0
                }

            }
        }
    }

    clearCache() {
        if (this.upstackingSegment.updates >= 5) {
            this.stackingUpdates += this.upstackingSegment.updates
            this.stackingFrames += this.upstackingSegment.frameDelay
        }
        if (this.downstackingSegment.shifts >= 3) {
            this.downstackingFrames += this.downstackingSegment.frameDelay
            this.downstackingUpdates += this.downstackingSegment.updates
        }
    }

    getStats() {
        return {
            stacking: {
                totalUpdates: this.stackingUpdates,
                totalFrames: this.stackingFrames,
            },
            downstacking: {
                totalUpdates: this.downstackingUpdates,
                totalFrames: this.downstackingFrames,
            }
        };
    }
}