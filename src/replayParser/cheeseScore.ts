const cheeseWeights = [1.87177053, 1.44428749, 1.31233034, 1.16560664] //blockfish weights when its 100% all this
const resMin = Math.min(...cheeseWeights)
const resMax = Math.max(...cheeseWeights)
export class CheeseScorer{
    history: number[] = []
    getScore(lineCount: number){
        lineCount = Math.min(lineCount, 4)
        let res
        if(this.history.length == 0){
            res = cheeseWeights[lineCount-1] * lineCount
        }else{
            res = cheeseWeights[Math.max(...this.history)-1] * lineCount
        }

        if(lineCount == 4){
            this.history = []
        }
        this.history.push(lineCount)
        if(this.history.length > 3){
            this.history.shift()
        }

        return (res - resMin*lineCount) * lineCount / (resMax-resMin)
    }
}