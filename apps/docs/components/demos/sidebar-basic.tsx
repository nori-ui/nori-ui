'use client';

import { useState } from 'react';

function HomeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path
                d="M2 6.5L8 1l6 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
            />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 13c0-2.21-1.79-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function CogIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.929 2.929l1.06 1.06M11.01 11.01l1.06 1.06M2.929 13.07l1.06-1.06M11.01 4.99l1.06-1.06"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function SidebarBasic() {
    const [activeItem, setActiveItem] = useState<string>('home');
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            style={{
                position: 'relative',
                height: 420,
                display: 'flex',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
            }}
        >
            {/* Sidebar — positioned statically inside this demo container */}
            <div
                style={{
                    width: collapsed ? 56 : 240,
                    transition: 'width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    flexShrink: 0,
                    borderRight: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            backgroundColor: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        A
                    </div>
                    {!collapsed && (
                        <span
                            style={{
                                fontWeight: 600,
                                fontSize: 14,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            Acme Inc.
                        </span>
                    )}
                </div>

                {/* Nav */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                    {/* Group: Main */}
                    {!collapsed && (
                        <div
                            style={{
                                padding: '4px 16px 2px',
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: '#9ca3af',
                            }}
                        >
                            Main
                        </div>
                    )}
                    {[
                        { id: 'home', label: 'Home', icon: <HomeIcon /> },
                        { id: 'team', label: 'Team', icon: <UsersIcon /> },
                    ].map(({ id, label, icon }) => (
                        <div key={id} style={{ padding: '2px 8px' }}>
                            <button
                                type="button"
                                title={collapsed ? label : undefined}
                                aria-current={activeItem === id ? 'page' : undefined}
                                onClick={() => setActiveItem(id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: collapsed ? '8px' : '7px 10px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: activeItem === id ? '#6366f11a' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    color: activeItem === id ? '#4338ca' : '#374151',
                                    fontWeight: activeItem === id ? 600 : 400,
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    transition: 'background 150ms',
                                }}
                            >
                                {icon}
                                {!collapsed && (
                                    <span
                                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                        {label}
                                    </span>
                                )}
                            </button>
                        </div>
                    ))}

                    {!collapsed && (
                        <div
                            style={{
                                padding: '12px 16px 2px',
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                color: '#9ca3af',
                            }}
                        >
                            Settings
                        </div>
                    )}
                    <div style={{ padding: '2px 8px' }}>
                        <button
                            type="button"
                            title={collapsed ? 'Preferences' : undefined}
                            aria-current={activeItem === 'prefs' ? 'page' : undefined}
                            onClick={() => setActiveItem('prefs')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                width: '100%',
                                padding: collapsed ? '8px' : '7px 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: activeItem === 'prefs' ? '#6366f11a' : 'transparent',
                                cursor: 'pointer',
                                fontSize: 14,
                                color: activeItem === 'prefs' ? '#4338ca' : '#374151',
                                fontWeight: activeItem === 'prefs' ? 600 : 400,
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                transition: 'background 150ms',
                            }}
                        >
                            <CogIcon />
                            {!collapsed && <span>Preferences</span>}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 8px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                        type="button"
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 8,
                            width: '100%',
                            padding: collapsed ? '7px' : '7px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#6b7280',
                            fontSize: 13,
                        }}
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path
                                d={collapsed ? 'M6 3l5 5-5 5' : 'M10 3L5 8l5 5'}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {!collapsed && <span>Collapse</span>}
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>
                    {activeItem === 'home' && 'Home'}
                    {activeItem === 'team' && 'Team'}
                    {activeItem === 'prefs' && 'Preferences'}
                </h2>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
                    Sidebar demo — click an item or use the collapse toggle.
                </p>
            </div>
        </div>
    );
}
