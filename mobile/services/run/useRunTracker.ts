import { useState, useEffect } from "react";
import { RunTracker } from "./RunTracker";
import { RunTrackerState } from "./types";

export function useRunTracker() {
  const [state, setState] = useState<RunTrackerState>(RunTracker.getState());

  useEffect(() => {
    return RunTracker.subscribe(setState);
  }, []);

  return {
    state,
    startRun: () => RunTracker.startRun(),
    pauseRun: () => RunTracker.pauseRun(),
    resumeRun: () => RunTracker.resumeRun(),
    finishRun: () => RunTracker.finishRun(),
    discardRun: () => RunTracker.discardRun(),
  };
}
