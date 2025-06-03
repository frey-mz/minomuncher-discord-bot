type Task<T> = () => Promise<T>;

export class RateLimitedPromiseQueue {
  private queue: Task<any>[] = [];
  private running = false;
  private lastRunTime = 0;

  constructor(private rateLimitMs: number) {}

  enqueue<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const waitTime = Math.max(0, this.rateLimitMs - (now - this.lastRunTime));
          if (waitTime > 0) {
            await this.delay(waitTime);
          }

          this.lastRunTime = Date.now();
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });

      this.runNext();
    });
  }

  private async runNext() {
    if (this.running || this.queue.length === 0) {
      return;
    }

    this.running = true;
    const next = this.queue.shift();
    if (next) {
      await next();
    }
    this.running = false;

    this.runNext();
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
