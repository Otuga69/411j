<script lang="ts">
    import { goto } from '$app/navigation';
    import * as config from '$lib/config';
    import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';
    import FluentColorCoinMultiple24 from '~icons/fluent-color/coin-multiple-24';
    import LineMdCompassFilledLoop from '~icons/line-md/compass-filled-loop';
    import { page } from '$app/stores';
    
    function goToLogin() {
        goto('/login');
    }
    
    function goToSignup() {
        goto('/register');
    }

    function goToLoan() {
        goto('/loan');
    }

    function goToProfile() {
        goto('/profile');
    }

    // Get user data from page store
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
            <div class="auth-buttons">
                <div class="card preset-outlined-surface-200-800 flex items-center p-1">
                    <button type="button" on:click={goToLoan}>
                        <FluentColorCoinMultiple24 class="w-5 h-5" />
                    </button>
                    <p class="ml-1">10000.00</p>
                </div>

                {#if user}
                    <!-- Show avatar for logged in user -->
                    
                        <Avatar
                            name="John Doe"
                            background="preset-filled-primary-500"
                            
                        ></Avatar>
                   
                {:else}
                    <!-- Show login/signup buttons for guests -->
                    <div class="flex gap-2">
                    </div>
                {/if}
            </div>
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

    .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
    }
</style>