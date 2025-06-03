export async function getTLReplayIds(userID: string) {
  const streamResponse = await fetch(`https://ch.tetr.io/api/streams/league_userrecent_${userID}`);

  const streamData: any = await streamResponse.json();

  const replayIds: string[] = streamData.data.records.map((record: any) => record.replayid);

  if (replayIds.length < 5) throw new Error("too little data!")

  return replayIds
}

export async function getTLPlayers(rating: number, limit = 100): Promise<any[]> {
  const response = await fetch(`https://ch.tetr.io/api/users/lists/league?before=${rating}&limit=${limit}`)
  const data: any = await response.json()
  return data.data.users
}

export async function scrollTLPlayers(rating: number = 0, maxRating: number = 25000) {
  let totalResponse = []
  let response = await getTLPlayers(rating)
  await Bun.sleep(1000)
  response = response.filter(x => x.league.rating < maxRating)
  while (response.length > 0) {
    console.log(totalResponse.length)
    rating = Math.max(...response.map(x => x.league.rating))
    totalResponse.push(...response)
    response = await getTLPlayers(rating)
  }
  return totalResponse
}