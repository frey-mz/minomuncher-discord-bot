import fs from 'fs'
async function getTLPlayers(rating: number) : Promise<any[]>{
    const response = await fetch(`https://ch.tetr.io/api/users/lists/league?before=${rating}&limit=100`)
    const data : any = await response.json()
    return data.data.users
  }
  
  async function scrollTLPlayers(rating: number = 0, maxRating: number = 25000){
    let totalResponse = []
    let response = await getTLPlayers(rating)
    await Bun.sleep(1000)
    response = response.filter(x=>x.league.rating<maxRating)
    while(response.length > 0){
      console.log(totalResponse.length)
      rating = Math.max(...response.map(x=>x.league.rating))
      totalResponse.push(...response)
      response = await getTLPlayers(rating)
    }
    return totalResponse
  }
  
  const rawPlayers = await scrollTLPlayers(0)
  const players : [string, string, number][] = rawPlayers.map((x:any)=>[x._id, x.username, x.league.glicko])

fs.writeFileSync("tl.json", JSON.stringify(players))