import { ImageResponse } from 'next/og';

// Next.js's app/icon.tsx convention: this becomes the favicon. Generated
// at build time so we never ship a stale 404 for /favicon.ico.
//
// Mark: a soft-rounded "n" cut from a deep ocean-teal disc — ties the
// favicon to the "nori" name (Japanese for the seaweed used to wrap
// sushi → deep green/teal).

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0d9488',
                color: '#f0fdfa',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'system-ui',
                borderRadius: 7,
                letterSpacing: '-0.04em',
            }}
        >
            n
        </div>,
        size
    );
}
