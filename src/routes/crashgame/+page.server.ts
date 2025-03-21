// src/routes/crashgame/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
  // Make sure the user is authenticated and has a valid model
  if (!locals.pb.authStore.isValid || !locals.pb.authStore.model) {
    return {
      user: null
    };
  }

  try {
    // Get fresh user data to ensure we have the latest coin balance
    const userData = await locals.pb.collection('users').getOne(locals.pb.authStore.model.id, {
      fields: 'id,email,username,coins,verified,emailVisibility'
    });
    
    return {
      user: userData
    };
  } catch (err) {
    console.error('Error loading user data:', err);
    return {
      user: locals.pb.authStore.model
    };
  }
}) satisfies PageServerLoad;