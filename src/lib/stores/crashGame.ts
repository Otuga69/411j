// src/lib/stores/crashGame.ts
import { writable, derived } from 'svelte/store';
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

// Types
export interface GamePoint {
  x: number;
  y: number;
}

export interface GameState {
  isRunning: boolean;
  isCrashed: boolean;
  multiplier: number;
  crashPoint: number;
  betAmount: number;
  userCashedOut: boolean;
  userWinnings: number;
  gameHistory: number[];
  pointsHistory: GamePoint[];
}

// Constants
const GROWTH_RATE = 0.05;
const HOUSE_EDGE = 0.95;
const UPDATE_INTERVAL = 50; // ms

// Create the store
function createCrashGameStore() {
  // Initial state
  const initialState: GameState = {
    isRunning: false,
    isCrashed: false,
    multiplier: 1,
    crashPoint: 1,
    betAmount: 10,
    userCashedOut: false,
    userWinnings: 0,
    gameHistory: [],
    pointsHistory: []
  };
  
  const { subscribe, set, update } = writable<GameState>(initialState);
  
  // Tweened multiplier for smooth animation
  const currentMultiplier = tweened(1, {
    duration: 100,
    easing: cubicOut
  });
  
  // Animation variables
  let timer: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;
  let canvasHeight = 400;
  
  function generateCrashPoint(): number {
    // Generate random crash point with house edge
    const e = Math.random();
    return Math.max(1, HOUSE_EDGE * (1 / (1 - e)));
  }
  
  function startGame() {
    // Cancel any existing game
    if (timer) clearInterval(timer);
    
    const crashPoint = generateCrashPoint();
    startTime = Date.now();
    
    // Reset the game state
    update(state => ({
      ...state,
      isRunning: true,
      isCrashed: false,
      userCashedOut: false,
      multiplier: 1,
      crashPoint,
      pointsHistory: [{ x: 0, y: canvasHeight }],
      userWinnings: 0
    }));
    
    currentMultiplier.set(1);
    
    // Start the game loop
    timer = setInterval(() => updateGame(canvasHeight), UPDATE_INTERVAL);
  }
  
  function updateGame(height: number) {
    canvasHeight = height;
    
    update(state => {
      // If already crashed or cashed out, just return current state
      if (state.isCrashed || (!state.isRunning && state.pointsHistory.length > 1)) {
        return state;
      }
      
      const elapsed = (Date.now() - startTime) / 1000;
      // Exponential growth formula
      const newMultiplier = Math.pow(Math.E, GROWTH_RATE * elapsed);
      
      // Calculate new point for trail
      const x = (state.pointsHistory.length) * 5;
      // Inverted y-axis because canvas y increases downward
      const y = height - (Math.log(newMultiplier) * 50);
      
      const newPointsHistory = [...state.pointsHistory, { x, y }];
      
      // Check for crash
      if (newMultiplier >= state.crashPoint) {
        // Execute crash logic immediately, but ensure we return a state
        setTimeout(() => endGame(), 0);
        
        return {
          ...state,
          multiplier: newMultiplier,
          pointsHistory: newPointsHistory,
          isCrashed: true,
          isRunning: false
        };
      }
      
      return {
        ...state,
        multiplier: newMultiplier,
        pointsHistory: newPointsHistory
      };
    });
    
    // Update the tweened store
    update(state => {
      currentMultiplier.set(state.multiplier);
      return state;
    });
  }
  
  function cashOut() {
    update(state => {
      if (!state.isRunning || state.userCashedOut || state.isCrashed) {
        return state;
      }
      
      return {
        ...state,
        userCashedOut: true,
        userWinnings: state.betAmount * state.multiplier
      };
    });
  }
  
  function endGame() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    
    update(state => {
      // Add to game history only if we haven't already
      const historyAlreadyUpdated = state.gameHistory.length > 0 && 
                                    state.gameHistory[0] === state.crashPoint;
      
      const newGameHistory = historyAlreadyUpdated ? 
        state.gameHistory : 
        [state.crashPoint, ...state.gameHistory].slice(0, 10);
      
      return {
        ...state,
        isRunning: false,
        isCrashed: !state.userCashedOut,
        userWinnings: state.userCashedOut ? state.userWinnings : 0,
        gameHistory: newGameHistory
      };
    });
  }
  
  function setBetAmount(amount: number) {
    update(state => ({
      ...state,
      betAmount: amount
    }));
  }
  
  function adjustPointsHistory(canvasWidth: number) {
    update(state => {
      if (!state.pointsHistory.length) return state;
      
      const lastPoint = state.pointsHistory[state.pointsHistory.length - 1];
      
      if (lastPoint && lastPoint.x > canvasWidth) {
        const diff = lastPoint.x - canvasWidth;
        const adjustedHistory = state.pointsHistory.map(point => ({
          x: point.x - diff,
          y: point.y
        }));
        
        return {
          ...state,
          pointsHistory: adjustedHistory
        };
      }
      
      return state;
    });
  }
  
  function reset() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    set(initialState);
    currentMultiplier.set(1);
  }
  
  // Clean up on destroy
  function destroy() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  
  return {
    subscribe,
    currentMultiplier: { subscribe: currentMultiplier.subscribe },
    startGame,
    cashOut,
    endGame,
    setBetAmount,
    adjustPointsHistory,
    reset,
    destroy
  };
}

export const crashGame = createCrashGameStore();