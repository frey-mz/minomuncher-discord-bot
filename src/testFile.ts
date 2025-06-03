import { parseReplay } from "./replayParser/parser";

const filePath = "./replay.ttrm";

const file = await Bun.file(filePath).text();

parseReplay(file, [])