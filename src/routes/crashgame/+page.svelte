<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { onDestroy } from 'svelte';
    import { crashGame, type GameState } from '$lib/stores/crashGame';
    import CrashGameCanvas from '$lib/components/CrashGameCanvas.svelte';
    
    // Reactive variables with explicit types
    let gameState: GameState;
    let currentMultiplier: number = 1;
    
    // Subscribe to stores
    const unsubGame = crashGame.subscribe(state => {
      gameState = state;
    });
    
    const unsubMultiplier = crashGame.currentMultiplier.subscribe(value => {
      currentMultiplier = value;
    });
    
    // Handle input changes
    function updateBetAmount(e: Event) {
      const input = e.target as HTMLInputElement;
      const value = parseFloat(input.value);
      if (!isNaN(value) && value > 0) {
        crashGame.setBetAmount(value);
      }
    }
    
    // Clean up subscriptions on destroy
    onDestroy(() => {
      unsubGame();
      unsubMultiplier();
      crashGame.destroy();
    });
  </script>
  
  <div class="flex flex-col items-center w-full max-w-4xl mx-auto p-4 bg-gray-900 text-white">
    <h1 class="text-3xl font-bold mb-6">Crash Game</h1>
    
    <!-- Game Display -->
    <div class="w-full bg-gray-800 rounded-lg p-4 mb-4">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center">
          <span class="text-lg font-semibold mr-2">Multiplier:</span>
          <span class="text-2xl font-bold" 
                class:text-red-500={gameState?.isCrashed} 
                class:text-green-500={gameState?.userCashedOut}>
            {gameState?.isCrashed ? "CRASHED" : currentMultiplier?.toFixed(2)}x
          </span>
        </div>
        {#if gameState?.userCashedOut}
          <div class="text-green-500 font-bold text-xl">
            Cashed Out: {gameState.userWinnings.toFixed(2)}
          </div>
        {/if}
        
        {#if gameState?.isCrashed && !gameState?.userCashedOut}
          <div class="text-red-500 font-bold text-xl">
            CRASHED AT {gameState.crashPoint.toFixed(2)}x
          </div>
        {/if}
      </div>
      
      <!-- Game Canvas -->
      <div class="w-full relative bg-gray-900 rounded border border-gray-700 overflow-hidden">
        <CrashGameCanvas width={800} height={400} />
      </div>
    </div>
    
    <!-- Controls -->
    <div class="flex flex-col md:flex-row w-full gap-4 mb-6">
      <div class="flex flex-col flex-1 bg-gray-800 rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-2">Bet</h2>
        <div class="flex items-center mb-2">
          <input
            type="number"
            min="1"
            value={gameState?.betAmount}
            on:input={updateBetAmount}
            class="bg-gray-700 text-white p-2 rounded w-full mr-2"
            disabled={gameState?.isRunning}
          />
          <span>$</span>
        </div>
        
        <div class="flex gap-2">
          <button 
            on:click={() => crashGame.startGame()} 
            disabled={gameState?.isRunning}
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:opacity-50 rounded font-semibold"
          >
            {gameState?.isRunning ? "In Progress..." : "Start Game"}
          </button>
          
          <button 
            on:click={() => crashGame.cashOut()} 
            disabled={!gameState?.isRunning || gameState?.userCashedOut || gameState?.isCrashed}
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:opacity-50 rounded font-semibold"
          >
            Cash Out
          </button>
        </div>
      </div>
      
      <div class="flex-1 bg-gray-800 rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-2">History</h2>
        <div class="flex flex-wrap gap-2">
          {#each gameState?.gameHistory || [] as crashValue}
            <div class="px-2 py-1 rounded text-sm {crashValue < 2 ? 'bg-red-800' : crashValue < 4 ? 'bg-yellow-800' : 'bg-green-800'}">
              {crashValue.toFixed(2)}x
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <!-- Game Info -->
    <div class="w-full bg-gray-800 rounded-lg p-4">
      <h2 class="text-xl font-semibold mb-2">How to Play</h2>
      <ol class="list-decimal pl-5 space-y-1">
        <li>Enter your bet amount</li>
        <li>Click "Start Game" to begin</li>
        <li>The multiplier increases over time</li>
        <li>Click "Cash Out" before the game crashes to win your bet × multiplier</li>
        <li>If the game crashes before you cash out, you lose your bet</li>
      </ol>
    </div>
  </div>