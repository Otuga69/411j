<!-- src/routes/crashgame/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { crashGame, type GameState } from '$lib/stores/crashGame';
  import CrashGameCanvas from '$lib/components/CrashGameCanvas.svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import PocketBase from 'pocketbase';
  import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
  
  // Reactive variables with explicit types
  let gameState: GameState;
  let currentMultiplier: number = 1;
  let pb: PocketBase;
  
  // Subscribe to stores
  const unsubGame = crashGame.subscribe(state => {
    gameState = state;
  });
  
  const unsubMultiplier = crashGame.currentMultiplier.subscribe(value => {
    currentMultiplier = value;
  });

  // Add reactive statement for coin synchronization
  $: if ($page.data.user && gameState && $page.data.user.coins !== gameState.userCoins) {
    // Synchronize coins when there's a mismatch
    crashGame.update(state => ({
      ...state,
      userCoins: $page.data.user.coins || 0
    }));
  }

  // Handle input changes
  function updateBetAmount(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value > 0) {
      crashGame.setBetAmount(value);
    }
  }
  
  // Initialize user data on page load
  onMount(async () => {
  if (browser) {
    pb = new PocketBase(PUBLIC_POCKETBASE_URL);
    
    if (document.cookie) {
      pb.authStore.loadFromCookie(document.cookie);
    }
    
    if ($page.data.user) {
      // Force synchronous initialization of game state
      crashGame.reset(); // Reset the game state first
      
      // Directly set user coins to match page data
      gameState = {
        ...gameState,
        userId: $page.data.user.id,
        userCoins: $page.data.user.coins || 0,
        betAmount: Math.min(10, $page.data.user.coins || 0)
      };
      
      // Then initialize properly
      await crashGame.initializeUser(pb, $page.data.user.id);
    }
  }
});
  
  async function handleStartGame() {
    if (!$page.data.user) {
      window.location.href = '/login';
      return;
    }
    
    await crashGame.startGame(pb);
  }
  
  async function handleCashOut() {
    await crashGame.cashOut(pb);
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
  
  <!-- User Coins Display -->
  <div class="w-full flex justify-between items-center mb-4">
    <div class="text-xl font-bold">
      {#if $page.data.user}
        Coins: {$page.data.user.coins || 0}
      {:else}
        <a href="/login" class="text-blue-400 hover:underline">Login to play</a>
      {/if}
    </div>
    
    {#if gameState?.error}
      <div class="bg-red-800 px-4 py-2 rounded-lg text-white">
        {gameState.error}
        <button 
          class="ml-2 text-white hover:text-gray-300" 
          on:click={() => crashGame.clearError()}>
          ✕
        </button>
      </div>
    {/if}
  </div>
  
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
          Cashed Out: {gameState.userWinnings.toFixed(0)} coins
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
          max={gameState?.userCoins || 0}
          value={gameState?.betAmount}
          on:input={updateBetAmount}
          class="bg-gray-700 text-white p-2 rounded w-full mr-2"
          disabled={gameState?.isRunning || !$page.data.user}
        />
        <span>coins</span>
      </div>
      
      <div class="flex gap-2">
        <!-- Debug output -->
        <pre class="text-xs text-gray-400 mb-2">
          {JSON.stringify({
            userCoins: gameState?.userCoins,
            betAmount: gameState?.betAmount,
            pageDataCoins: $page.data.user?.coins,
            isRunning: gameState?.isRunning,
            buttonDisabled: gameState?.isRunning || 
                          (gameState?.betAmount > (gameState?.userCoins || 0)) || 
                          !$page.data.user
          }, null, 2)}
        </pre>

        <button 
          on:click={handleStartGame} 
          disabled={gameState?.isRunning || 
                   (gameState?.betAmount > (gameState?.userCoins || 0)) || 
                   !$page.data.user}
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:opacity-50 rounded font-semibold"
        >
          {gameState?.isRunning ? "In Progress..." : "Start Game"}
        </button>
        
        <button 
          on:click={handleCashOut} 
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
      <li>Enter your bet amount (must be less than or equal to your current coins)</li>
      <li>Click "Start Game" to begin</li>
      <li>The multiplier increases over time</li>
      <li>Click "Cash Out" before the game crashes to win your bet × multiplier</li>
      <li>If the game crashes before you cash out, you lose your bet</li>
    </ol>
  </div>
</div>