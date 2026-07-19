import { FrustrationLevel, FrustrationEvent } from "@/types/frustration";

export class FrustrationDetector {
  private frustrationLevel: FrustrationLevel = "low";
  private eventHistory: FrustrationEvent[] = [];
  private readonly maxHistorySize = 100;

  // Thresholds for state transitions
  private readonly rapidBackspaceThreshold = 10; // consecutive backspaces
  private readonly errorRateThreshold = 0.3; // 30% error rate
  private readonly inactivityTimeoutMs = 5000; // 5 seconds
  private readonly highFrequencyEditThreshold = 5; // edits per second

  addEvent(event: FrustrationEvent): FrustrationLevel {
    this.eventHistory.push(event);

    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    this.updateFrustrationLevel();
    return this.frustrationLevel;
  }

  private updateFrustrationLevel(): void {
    const recentEvents = this.getRecentEvents(30000); // Last 30 seconds

    if (recentEvents.length === 0) {
      this.frustrationLevel = "low";
      return;
    }

    let frustrationScore = 0;

    // Check for rapid backspaces
    const backspaceCount = recentEvents.filter(
      (e) => e.type === "backspace"
    ).length;
    if (backspaceCount >= this.rapidBackspaceThreshold) {
      frustrationScore += 30;
    }

    // Check for rapid corrections
    const correctionCount = recentEvents.filter(
      (e) => e.type === "correction"
    ).length;
    frustrationScore += correctionCount * 2;

    // Check for high edit frequency (sign of struggling)
    const editFrequency = this.calculateEditFrequency(recentEvents);
    if (editFrequency > this.highFrequencyEditThreshold) {
      frustrationScore += 25;
    }

    // Check for long pauses followed by edits (sign of thinking/struggling)
    const pausePatterns = this.detectPausePatterns(recentEvents);
    frustrationScore += pausePatterns * 10;

    // Check for repeated deletions of same content
    const deleteRepetitions = this.detectDeleteRepetitions(recentEvents);
    frustrationScore += deleteRepetitions * 15;

    // Determine level based on score
    if (frustrationScore >= 70) {
      this.frustrationLevel = "critical";
    } else if (frustrationScore >= 50) {
      this.frustrationLevel = "high";
    } else if (frustrationScore >= 25) {
      this.frustrationLevel = "medium";
    } else {
      this.frustrationLevel = "low";
    }
  }

  private getRecentEvents(timeWindowMs: number): FrustrationEvent[] {
    const now = Date.now();
    return this.eventHistory.filter(
      (e) => now - e.timestamp < timeWindowMs
    );
  }

  private calculateEditFrequency(events: FrustrationEvent[]): number {
    if (events.length < 2) return 0;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const timeSpanSeconds = (lastEvent.timestamp - firstEvent.timestamp) / 1000;

    if (timeSpanSeconds === 0) return 0;

    const editEvents = events.filter(
      (e) => e.type === "input" || e.type === "backspace" || e.type === "correction"
    );

    return editEvents.length / timeSpanSeconds;
  }

  private detectPausePatterns(events: FrustrationEvent[]): number {
    let pauseCount = 0;

    for (let i = 1; i < events.length; i++) {
      const timeDiff = events[i].timestamp - events[i - 1].timestamp;

      // Pause longer than threshold followed by rapid editing
      if (timeDiff > this.inactivityTimeoutMs) {
        // Check if followed by rapid edits
        if (i + 2 < events.length) {
          const nextTimeDiff =
            events[i + 2].timestamp - events[i + 1].timestamp;
          if (nextTimeDiff < 500) {
            pauseCount++;
          }
        }
      }
    }

    return pauseCount;
  }

  private detectDeleteRepetitions(events: FrustrationEvent[]): number {
    let repetitions = 0;
    let lastDeletedContent = "";
    let deleteSequenceCount = 0;

    for (const event of events) {
      if (event.type === "backspace" || event.type === "delete") {
        if (event.content === lastDeletedContent) {
          deleteSequenceCount++;
          if (deleteSequenceCount >= 2) {
            repetitions++;
          }
        } else {
          lastDeletedContent = event.content || "";
          deleteSequenceCount = 1;
        }
      } else {
        deleteSequenceCount = 0;
      }
    }

    return repetitions;
  }

  getCurrentLevel(): FrustrationLevel {
    return this.frustrationLevel;
  }

  reset(): void {
    this.frustrationLevel = "low";
    this.eventHistory = [];
  }

  getEventHistory(): FrustrationEvent[] {
    return [...this.eventHistory];
  }

  getStats() {
    const recentEvents = this.getRecentEvents(60000); // Last minute

    return {
      currentLevel: this.frustrationLevel,
      eventCount: recentEvents.length,
      backspaceCount: recentEvents.filter((e) => e.type === "backspace")
        .length,
      correctionCount: recentEvents.filter((e) => e.type === "correction")
        .length,
      editFrequency: this.calculateEditFrequency(recentEvents),
    };
  }
}
