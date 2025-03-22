<script lang="ts">
    import { goto } from '$app/navigation';
    import * as config from '$lib/config';
    import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';
    import FluentColorCoinMultiple24 from '~icons/fluent-color/coin-multiple-24';
    import LineMdCompassFilledLoop from '~icons/line-md/compass-filled-loop';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    
    // Get user data from page store with type safety
    $: user = $page.data.user;
</script>

<div class="header-wrapper">
    <AppBar>
        {#snippet lead()}
            <LineMdCompassFilledLoop class="w-9 h-9" />
            <a href="/" class="title">
                <strong>{config.title}</strong>
            </a>
        {/snippet}
        
        {#snippet trail()}
            {#if user}
                <div class="auth-buttons">
                    <div class="card preset-outlined-surface-200-800 flex items-center p-1">
                        <button type="button">
                            <FluentColorCoinMultiple24 class="w-5 h-5" />
                        </button>
                        <p class="ml-1">{user.coins || 0}</p>
                    </div>
                    
                    <!-- Show avatar for logged in user -->
                    <div class="flex gap-2 items-center">
                        <button class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                          <Avatar
                          name={(() => {
                            const name = user.username || user.email;
                            if (name.includes(' ')) {
                              // For names with spaces (e.g., "John Doe" -> "JD")
                              return name
                                .split(' ')
                                .map((word: string) => word[0].toUpperCase())
                                .join('');
                            } else {
                              // For single words (e.g., "johnes1234" -> "Jo")
                              return name.slice(0, 2).toUpperCase();
                            }
                          })()}
                            background="bg-primary-500"
                            classes="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          />
                        </button>
                      </div>
                      
                </div>
            {:else}
                <!-- Show login/signup buttons for guests -->
                <div class="flex gap-2">
                    <a href="/login" class="btn preset-filled-primary-500 w-[90%]">Login</a>
                    <a href="/register" class="btn preset-filled-primary-500 w-[90%]">Signup</a>
                </div>
            {/if}
        {/snippet}
    </AppBar>
</div>

<style>
    .header-wrapper :global(.app-bar) {
        height: 3.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .title {
        color: rgb(3, 233, 194);
        font-size: 1.75rem;
    }
    
    .auth-buttons {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .auth-buttons :global(.login-btn) {
        font-size: 1rem;
        padding: 0.375rem 1rem;
        font-weight: 500;
    }
    
    
</style>