export enum TimerState {
  ready = 1,
  ticking,
  paused,
  finished,
}

const beepAudio = new Audio('/beep.mp3');

function beep() {
  beepAudio.play();
}

export class CountdownTimer {
  nSeconds: number;

  private intervalId: NodeJS.Timeout | undefined;
  private timeLastUpdate: number;
  private msLeft: number;
  private state = TimerState.ready;
  private finishedCallback: () => void;
  private nextBeepAt: number;
  private msUpdateInterval = 100;

  constructor(nSeconds: number, finishedCallback: () => void, beepSeconds: number) {
    this.nSeconds = nSeconds;
    this.msLeft = nSeconds * 1000;
    this.finishedCallback = finishedCallback;
    this.nextBeepAt = beepSeconds * 1000;
    this.timeLastUpdate = Date.now();
  }

  start() {
    if (this.state === TimerState.finished || this.state === TimerState.ticking) {
      return;
    }
    this.state = TimerState.ticking;

    this.timeLastUpdate = Date.now();
    this.intervalId = setInterval(() => {
      this.tick()
    }, this.msUpdateInterval)
  }

  pause() {
    if (this.state === TimerState.finished) {
      return;
    }

    this.state = TimerState.paused;
    this.clearTimer();
  }

  toggle() {
    if (this.state === TimerState.ready || this.state === TimerState.paused) {
      this.start();
    } else if (this.state === TimerState.ticking) {
      this.pause();
    }
  }

  getTimeLeft() {
    return this.msLeft;
  }

  getState() {
    return this.state;
  }

  private tick() {
    const dt = Date.now() - this.timeLastUpdate;
    this.msLeft = this.msLeft - dt;
    this.timeLastUpdate = Date.now();

    if (this.msLeft <= this.nextBeepAt + 500) {
      beep();
      this.nextBeepAt -= 1000;
    }

    if (this.msLeft <= 0) {
      this.state = TimerState.finished;
      this.msLeft = 0;
      this.clearTimer();
      this.finishedCallback();
    }
  }

  clearTimer() {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
};
