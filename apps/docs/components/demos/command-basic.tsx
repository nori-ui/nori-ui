'use client';

import { Command } from '@nori-ui/core';

export default function CommandBasic() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Command>
                <Command.Trigger>
                    <button
                        type="button"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#374151',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                            style={{ color: '#9ca3af' }}
                        >
                            <path
                                d="M6.5 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM14 14l-3-3"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Search
                        <kbd
                            style={{
                                fontSize: 11,
                                color: '#9ca3af',
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                borderRadius: 4,
                                padding: '1px 5px',
                                fontFamily: 'inherit',
                            }}
                        >
                            ⌘K
                        </kbd>
                    </button>
                </Command.Trigger>
                <Command.Dialog placeholder="Type a command or search…">
                    <Command.Empty>No results found.</Command.Empty>
                    <Command.Group heading="Suggestions">
                        <Command.Item onSelect={() => {}}>Calendar</Command.Item>
                        <Command.Item onSelect={() => {}}>Search Emoji</Command.Item>
                        <Command.Item onSelect={() => {}}>Calculator</Command.Item>
                    </Command.Group>
                    <Command.Group heading="Settings">
                        <Command.Item onSelect={() => {}}>
                            Profile
                            <Command.Shortcut>⌘P</Command.Shortcut>
                        </Command.Item>
                        <Command.Item onSelect={() => {}}>
                            Billing
                            <Command.Shortcut>⌘B</Command.Shortcut>
                        </Command.Item>
                        <Command.Item onSelect={() => {}}>
                            Settings
                            <Command.Shortcut>⌘,</Command.Shortcut>
                        </Command.Item>
                    </Command.Group>
                </Command.Dialog>
            </Command>
        </div>
    );
}
