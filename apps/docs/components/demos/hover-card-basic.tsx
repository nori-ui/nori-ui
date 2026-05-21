'use client';

import { HoverCard } from '@nori-ui/core';

export default function HoverCardBasic() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <HoverCard>
                <HoverCard.Trigger>
                    <button
                        type="button"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: '#6366f1',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 16,
                        }}
                    >
                        MB
                    </button>
                </HoverCard.Trigger>
                <HoverCard.Content>
                    <div
                        style={{
                            padding: '12px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            minWidth: 220,
                        }}
                    >
                        <strong>@manuelbieh</strong>
                        <span>Senior dev at Wiremore</span>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>Joined April 2020 · 42 repos</span>
                    </div>
                </HoverCard.Content>
            </HoverCard>
        </div>
    );
}
