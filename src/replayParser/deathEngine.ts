import { DeathTypes } from "./types";

export class TetrisDeathTracker {
  spikeCounter: number;
  lastUpdate: null | number;
  lastSpikeTime: null | number;
  lastSurgeSent: null | number;
  lastSurgeReceived: null | number;
  lastCheeseTime: null | number;
  spikeThreshold: number;
  spikeTimeout: number;
  surgeTimeout: number;
  cheeseTimeout: number;
  constructor(spikeThreshold = 8, spikeTimeout = 4*60, surgeTimeout = 5*60, cheeseTimeout = 3*60) {
    this.spikeCounter = 0;
    this.lastUpdate = null;
    this.lastSpikeTime = null;

    this.lastSurgeSent = null;
    this.lastSurgeReceived = null;
    this.lastCheeseTime = null;

    this.spikeThreshold = spikeThreshold;

    this.spikeTimeout = spikeTimeout;       // ms
    this.surgeTimeout = surgeTimeout;       // ms
    this.cheeseTimeout = cheeseTimeout;     // ms
  }

  update(hasCheese: boolean, attackReceived: number, currentTime: number) {
    if (this.lastUpdate !== null && (currentTime - this.lastUpdate < 0.2*60)) {
      this.spikeCounter += attackReceived;
    } else {
      this.spikeCounter = attackReceived;
    }

    if (this.spikeCounter >= this.spikeThreshold) {
      this.lastSpikeTime = currentTime;
    }

    if (hasCheese) {
      this.lastCheeseTime = currentTime;
    }

    this.lastUpdate = currentTime;
  }

  updateSurgeSent(currentTime: number) {
    this.lastSurgeSent = currentTime;
  }

  updateSurgeReceived(currentTime: number) {
    this.lastSurgeReceived = currentTime;
  }

  death(currentTime: number) : DeathTypes{
    const recently = (timestamp: number | null, timeout: number) =>
      timestamp !== null && currentTime - timestamp <= timeout;

    const spike = recently(this.lastSpikeTime, this.spikeTimeout);
    const surgeReceived = recently(this.lastSurgeReceived, this.surgeTimeout);
    const surgeSent = recently(this.lastSurgeSent, this.surgeTimeout);
    const cheese = recently(this.lastCheeseTime, this.cheeseTimeout);

    let reason : DeathTypes
    if(surgeReceived && surgeSent){
        reason = "Surge Conflict"
    }else if(spike && surgeReceived){
        reason = "Surge Spike"
    }else if(spike && cheese){
        reason = "Cheese Spike"
    }else if(spike){
        reason = "Spike"
    }else if(cheese){
        reason = "Cheese Pressure"
    }else{
        reason = "Pressure"
    }
    return reason
  }
}
