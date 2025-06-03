import {
  randomSeed,
  type EngineInitializeParams,
  type BagType
} from "../../../triangle/src/engine";

import type { VersusReplay } from "./versusReplay"

export type TetrioReplayOptions =
  VersusReplay["replay"]["rounds"][number][number]["replay"]["options"];

export const engineConfig = (
  replayOptions: Partial<TetrioReplayOptions>,
  opponents: number[]
): EngineInitializeParams => ({
  board: {
    width: replayOptions.boardheight ?? 10,
    height: replayOptions.boardwidth ?? 20,
    buffer: 20 // there's always a buffer of 20, don't pull from options
  },
  kickTable: replayOptions.kickset ?? "SRS+",
  options: {
    comboTable: replayOptions.combotable ?? "multiplier",
    garbageBlocking: replayOptions.garbageblocking ?? "combo blocking",
    clutch: replayOptions.clutch ?? true,
    garbageTargetBonus: replayOptions.garbagetargetbonus ?? "none",
    spinBonuses: replayOptions.spinbonuses ?? "all-mini+"
  },
  queue: {
    minLength: 10,
    seed: replayOptions.seed ?? randomSeed(),
    type: replayOptions.bagtype ?? ("7-bag" as BagType)
  },
  garbage: {
    cap: {
      absolute: replayOptions.garbageabsolutecap ?? 0,
      increase: replayOptions.garbagecapincrease ?? 0,
      max: replayOptions.garbagecapmax ?? 40,
      value: replayOptions.garbagecap ?? 8,
      marginTime: replayOptions.garbagecapmargin ?? 0
    },
    boardWidth: replayOptions.boardwidth ?? 10,
    garbage: {
      speed: replayOptions.garbagespeed ?? 20,
      holeSize: replayOptions.garbageholesize ?? 1
    },
    messiness: {
      change: replayOptions.messiness_change ?? 1,
      nosame: replayOptions.messiness_nosame ?? false,
      timeout: replayOptions.messiness_timeout ?? 0,
      within: replayOptions.messiness_inner ?? 0,
        center: replayOptions.messiness_center ?? false
    },
    multiplier: {
      value: replayOptions.garbagemultiplier ?? 1,
      increase: replayOptions.garbageincrease ?? 0.008,
      marginTime: replayOptions.garbagemargin ?? 10800
    },
        bombs: replayOptions.usebombs ?? false,
    specialBonus: replayOptions.garbagespecialbonus ?? false,
    openerPhase: replayOptions.openerphase ?? 0,
    seed: replayOptions.seed ?? randomSeed(), // if this doesn't exist, it's a huge problem
    rounding: replayOptions.roundmode ?? "down"
  },
  gravity: {
    value: replayOptions.g ?? 0.02,
    increase: replayOptions.gincrease ?? 0,
    marginTime: replayOptions.gmargin ?? 0
  },
  handling: {
    arr: replayOptions.handling?.arr ?? 0,
    das: replayOptions.handling?.das ?? 6,
    dcd: replayOptions.handling?.dcd ?? 0,
    sdf: replayOptions.handling?.sdf ?? 41,
    safelock: replayOptions.handling?.safelock ?? false,
    cancel: replayOptions.handling?.cancel ?? false,
    may20g: replayOptions.handling?.may20g ?? true,
    irs: replayOptions.handling?.irs ?? "tap",
    ihs: replayOptions.handling?.ihs ?? "tap"
  },
  b2b: {
    chaining: !!replayOptions.b2bchaining,
    charging: replayOptions.b2bcharging
      ? {
          at: 4,
          base: replayOptions.b2bcharge_base ?? 3
        }
      : false
  },
  pc: {
    b2b: replayOptions.allclear_b2b ?? 0,
    garbage: replayOptions.allclear_garbage ?? 0
  },
  misc: {
    allowed: {
      hardDrop: replayOptions.allowharddrop ?? true,
      spin180: replayOptions.allow180 ?? true,
      hold: replayOptions.display_hold ?? true
    },
    infiniteHold: replayOptions.infinite_hold ?? false,
    movement: {
      infinite: false,
      lockResets: replayOptions.lockresets ?? 15,
      lockTime: 30,
      may20G: replayOptions.gravitymay20 ?? true
    },
    username: replayOptions.username
  },
  multiplayer: {
    opponents,
    passthrough: replayOptions.passthrough ?? "zero"
  }
});