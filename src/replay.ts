
import { join } from 'path'
import { downloadReplay, getUserId } from './io'
import { RateLimitedPromiseQueue } from './promiseQueue'
import { parseReplay } from './replayParser/parser'
import { calculateCumulativeStats } from './replayParser/statLogic'
import { combineStats, GameStats, Players } from './replayParser/types'
import {promises as fsPromises} from "fs"

async function maybeRemoveRandomEntry(dirPath: string, maxEntries: number) {
  try {
    const entries = await fsPromises.readdir(dirPath);
    
    if (entries.length > maxEntries) {
      const randomIndex = Math.floor(Math.random() * entries.length);
      const entryToRemove = entries[randomIndex];
      const fullPath = join(dirPath, entryToRemove);

      const stat = await fsPromises.lstat(fullPath);

      if (stat.isDirectory()) {
        await fsPromises.rm(fullPath, { recursive: true, force: true });
      } else {
        await fsPromises.unlink(fullPath);
      }

      console.log(`Removed: ${entryToRemove}`);
    } else {
      console.log(`Number of entries (${entries.length}) is within limit.`);
    }
  } catch (error) {
    console.error(`Error handling directory: ${error}`);
  }
}

export async function parseReplayData(token: string, queryQueue: RateLimitedPromiseQueue, players: string[], replayIDs: string[], replayStrings: [string, string][], cb: (msg: string, over?: boolean) => Promise<void>): Promise<[Players, string[]]> {
  //let replayResponses = []
  let failed: string[] = []

  for (const replayId of replayIDs) {
    let data
    try {
      const file = await fsPromises.readFile(`./cache/${replayId}`, "utf-8")
      data = file.toString()
      cb(`cache ${replayId} hit`)
    } catch (e) {
      try {
        data = await queryQueue.enqueue(() => downloadReplay(replayId, token))
        fsPromises.writeFile(`./cache/${replayId}`, data, "utf-8")
        maybeRemoveRandomEntry("./cache", 100)
        console.log("loaded new!")
        cb(`downloading ${replayId}: success`)
      } catch (e) {
        failed.push(replayId)
        console.log(e)
        cb(`downloading ${replayId}: fail`)
        continue
      }
    }
    replayStrings.push([replayId, data])
  }


  type PartialPlayers = { [type: string]: GameStats }

  let rr: PartialPlayers = {}

  const idPlayers = []
  for (const p of players) {
    idPlayers.push({ name: p, id: await getUserId(p) })
  }

  cb(`parsing replays`)


  for (const [id, replayString] of replayStrings) {
    const rep = parseReplay(replayString, idPlayers)
    if (rep != undefined) {
      for (let k in rep) {
        if (k in rr) {
          combineStats(rr[k], rep[k])
        } else {
          rr[k] = rep[k]
        }
      }
    } else {
      failed.push(id.slice(0, 10))
    }
  }


  const stats: Players = {}
  for (let k in rr) {
    stats[k] = calculateCumulativeStats(rr[k])
  }

  cb(`generating graphs`)

  /*for(let i = 0; i < replayIDs.length; i++){

    replayResponses.push(cb(`${i}/${replayIDs.length+replayStrings.length} ${replayIDs[i]}: ${response}`, true))
  }*/

  /*for(let i = 0; i < replayStrings.length; i++){
    const replay = replayStrings[i][1]

    if(cached=="false"){
      replayResponses.push(cb(`${i}/${replayIDs.length+replayStrings.length} ${replayStrings[i][0]}: ${response}`, true))
    }else{
      replayResponses.push(cb(`${i}/${replayIDs.length+replayStrings.length} ${replayStrings[i][0]}: success`, true))
    }
  }*/




  return [stats, failed]
}


export async function getLeagueReplayIds(usernames: string[], games: number, cb: (msg: string, over?: boolean) => Promise<void>): Promise<string[]> {
  let replayIds = new Set<string>()
  for (const username of usernames) {
    let ids: string[]
    try {
      const streamResponse = await fetch(`https://ch.tetr.io/api/users/${username.toLowerCase()}/records/league/recent`)
      const streamData: any = await streamResponse.json();

      ids = streamData.data.entries.filter((x: any) => x.stub === false).map((record: any) => record.replayid);
    } catch (_) {
      await cb(`error fetching TL replay ids of \`${username}\``)
      throw Error()
    }

    let added = 0;

    for (let i = 0; i < Math.min(ids.length, games); i++) {
      added += 1;
      replayIds.add(ids[i])
    }

    await cb(`fetched ${added} TL replays from \`${username}\``)
  }
  if (replayIds.size == 0 && usernames.length > 0) {
    await cb(`no replays able to be fetched`)
    throw Error()
  }
  return [...replayIds.values()]
}
