'use client';

// Client-side re-export of the nori-ui surface for use inside MDX previews.
//
// Components like Button forward an `onPress` to RN `Pressable`, which cannot
// cross the RSC server→client boundary when rendered from an MDX (server)
// file. Importing from this module in MDX flips the render frame to the
// client so the event handlers stay on the client.

export * from '@nori-ui/core/client';
