<script lang="ts">
    import type { ActionData } from './$types';
    import { enhance } from '$app/forms';
    
    export let form: ActionData;
    
    // Track form submission state
    let isSubmitting = false;
</script>

<div class="flex justify-center items-center min-h-screen p-4">
    <div class="card w-full max-w-sm shadow-xl">
        <header class="card-header p-4 border-b border-surface-200-700-token">
            <h2 class="h3 font-semibold">Create Account</h2>
        </header>
        
        {#if form?.fail}
            <div class="alert variant-filled-error mx-4 mt-4">
                <span>{form.message}</span>
            </div>
        {/if}
        
        <div class="p-4">
            <form 
                action="?/login" 
                method="post" 
                class="space-y-4"
                use:enhance={() => {
                    isSubmitting = true;
                    
                    return async ({ update }) => {
                        await update();
                        isSubmitting = false;
                    };
                }}
            >
                <label class="label">
                    <span>Email</span>
                    <input 
                        class="input" 
                        name="email" 
                        type="email" 
                        placeholder="mail@example.com" 
                        required 
                        autocomplete="email"
                    />
                </label>

                <label class="label">
                    <span>Email</span>
                    <input 
                        class="input" 
                        name="username" 
                        type="username" 
                        placeholder="hehehe1234" 
                        
                    />
                </label>
                
                <label class="label">
                    <span>Password</span>
                    <input 
                        class="input" 
                        name="password" 
                        type="password" 
                        placeholder="••••••" 
                        required 
                        autocomplete="current-password"
                    />
                </label>
                
                <div class="flex justify-end">
                    <button 
                        class="anchor text-sm"
                        formnovalidate 
                        formaction="?/reset"
                        type="button"
                    >
                        Forgot Password?
                    </button>
                </div>
                
                <div class="space-y-2 flex justify-center">
                    <button 
                        class="btn variant-filled-primary w-full" 
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {#if isSubmitting}
                            <span class="spinner-border"></span>
                        {:else}
                            Sign In
                        {/if}
                    </button>
                    
                    <button 
                        class="btn preset-filled-primary-500 w-[90%]" 
                        formaction="?/register"
                        disabled={isSubmitting}
                    >
                        Create Account
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>