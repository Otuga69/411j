// src/lib/stores/crashGame.ts
import { writable, readable, derived } from 'svelte/store';
import type PocketBase from 'pocketbase';

export interface GamePoint {
  x: number;
  y: number;
}

export interface GameState {
  userId: string | null;
  userCoins: number;
  betAmount: number;
  isRunning: boolean;
  isCrashed: boolean;
  userCashedOut: boolean;
  crashPoint: number;
  userWinnings: number;
  gameHistory: number[];
  multiplier: number;
  pointsHistory: GamePoint[];
  error: string | null;
}

// Initialize multiplier store
const multiplier = writable(1.00);

// Initialize game state
const initialState: GameState = {
  userId: null,
  userCoins: 0,
  betAmount: 10,
  isRunning: false,
  isCrashed: false,
  userCashedOut: false,
  crashPoint: 0,
  userWinnings: 0,
  gameHistory: [],
  multiplier: 1.00,
  pointsHistory: [],
  error: null
};

function createCrashGameStore() {
  const { subscribe, set, update } = writable<GameState>(initialState);
  let gameInterval: number | null = null;
  
  return {
    subscribe,
    update: (updater: (state: GameState) => GameState) => {
      update(updater);
    },
    currentMultiplier: {
      subscribe: multiplier.subscribe
    },
    
    initializeUser: async (pb: PocketBase, userId: string) => {
      try {
        if (!pb || !userId) {
          console.error('Missing required parameters for initialization');
          return false;
        }
        
        const userData = await pb.collection('users').getOne(userId);
        
        update(state => {
          // Set bet amount to reasonable default
          const newBetAmount = Math.min(state.betAmount, userData.coins || 0);
          return {
            ...state,
            userId: userId,
            userCoins: userData.coins || 0,
            betAmount: newBetAmount > 0 ? newBetAmount : 1
          };
        });
        
        // Force an immediate update of the multiplier to ensure UI is consistent
        multiplier.set(1.00);
        
        return true; // Return success
      } catch (error) {
        console.error('Failed to initialize user:', error);
        update(state => ({
          ...state,
          error: 'Failed to initialize user data'
        }));
        return false;
      }
    },
    
    setBetAmount: (amount: number) => {
      update(state => ({
        ...state,
        betAmount: amount
      }));
    },
    
    startGame: async (pb: PocketBase) => {
      if (!pb) {
        update(state => ({ ...state, error: 'Authentication required' }));
        return;
      }
      
      update(state => {
        if (state.isRunning) {
          return state;
        }
        
        if (state.betAmount <= 0 || state.betAmount > state.userCoins) {
          return {
            ...state,
            error: 'Invalid bet amount'
          };
        }
        
        // Deduct the bet amount immediately
        return {
          ...state,
          isRunning: true,
          isCrashed: false,
          userCashedOut: false,
          userCoins: state.userCoins - state.betAmount,
          pointsHistory: [{ x: 0, y: 400 }], // Add initial point for canvas
          error: null
        };
      });
      
      // Reset multiplier
      multiplier.set(1.00);
      
      try {
        // Starting the game simulation
        let currentMult = 1.00;
        let crashed = false;
        
        // Generate a crash point using a random algorithm
        // This is a simple implementation - you'd want something more sophisticated in production
        const crashMultiplier = Math.random() < 0.33 ? 
          1 + Math.random() : // 33% chance of crashing early (1.00-2.00x)
          2 + Math.random() * 8; // 67% chance of going higher
        
        // Start game interval
        gameInterval = window.setInterval(() => {
          if (crashed) {
            clearInterval(gameInterval!);
            gameInterval = null;
            return;
          }
          
          // Increase multiplier at varying rates
          if (currentMult < 1.5) {
            currentMult += 0.01;
          } else if (currentMult < 5) {
            currentMult += 0.05;
          } else {
            currentMult += 0.1;
          }
          
          // Round to 2 decimal places
          currentMult = Math.round(currentMult * 100) / 100;
          multiplier.set(currentMult);
          
          // Update the pointsHistory for the graph
          update(state => {
            const x = state.pointsHistory.length * 5;
            const y = 400 - (Math.log(currentMult) * 50); // Adjust for canvas height
            
            return {
              ...state,
              multiplier: currentMult,
              pointsHistory: [...state.pointsHistory, { x, y }]
            };
          });
          
          // Check if we've reached the crash point
          if (currentMult >= crashMultiplier) {
            crashed = true;
            
            // Update game state
            update(state => {
              // Add to history
              const newHistory = [crashMultiplier, ...state.gameHistory];
              if (newHistory.length > 10) {
                newHistory.pop();
              }
              
              return {
                ...state,
                isRunning: false,
                isCrashed: true,
                crashPoint: crashMultiplier,
                gameHistory: newHistory
              };
            });
            
            // Stop the interval
            clearInterval(gameInterval!);
            gameInterval = null;
          }
        }, 100);
      } catch (error) {
        console.error('Error starting game:', error);
        update(state => ({
          ...state,
          isRunning: false,
          error: 'Failed to start game'
        }));
      }
    },
    
    cashOut: async (pb: PocketBase) => {
      try {
        update(state => {
          if (!state.isRunning || state.userCashedOut || state.isCrashed) {
            return state;
          }
          
          // Calculate winnings
          const currentMult = state.multiplier;
          const winnings = Math.floor(state.betAmount * currentMult);
          
          // Update user record asynchronously
          const updateUserCoins = async () => {
            try {
              if (pb && state.userId) {
                await pb.collection('users').update(state.userId, {
                  coins: state.userCoins + winnings
                });
              }
            } catch (err) {
              console.error('Failed to update user coins:', err);
            }
          };
          
          // Fire and forget - we're already updating the UI state
          updateUserCoins();
          
          return {
            ...state,
            userCashedOut: true,
            userWinnings: winnings,
            userCoins: state.userCoins + winnings
          };
        });
      } catch (error) {
        console.error('Error cashing out:', error);
        update(state => ({
          ...state,
          error: 'Failed to cash out'
        }));
      }
    },
    
    clearError: () => {
      update(state => ({
        ...state,
        error: null
      }));
    },
    
    // Add these methods from the old store to maintain compatibility
    adjustPointsHistory: (canvasWidth: number) => {
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
    },
    
    reset: () => {
      if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
      }
      
      // Keep user ID and coins when resetting
      update(state => ({
        ...initialState,
        userId: state.userId,
        userCoins: state.userCoins
      }));
      
      multiplier.set(1);
    },
    
    destroy: () => {
      if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
      }
      
      // Reset state
      set(initialState);
      multiplier.set(1.00);
    }
  };
}

export const crashGame = createCrashGameStore();