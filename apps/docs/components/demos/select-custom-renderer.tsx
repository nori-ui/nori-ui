'use client';

import { Avatar, Badge, HStack, Select, type SelectOption, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

type Member = { name: string; email: string; role: 'Owner' | 'Admin' | 'Editor' | 'Viewer'; avatar?: string };

const MEMBERS: SelectOption<Member>[] = [
    {
        value: 'ada',
        label: 'Ada Lovelace',
        data: {
            name: 'Ada Lovelace',
            email: 'ada@nori-ui.com',
            role: 'Owner',
            avatar: 'https://i.pravatar.cc/64?img=47',
        },
    },
    {
        value: 'grace',
        label: 'Grace Hopper',
        data: {
            name: 'Grace Hopper',
            email: 'grace@nori-ui.com',
            role: 'Admin',
            avatar: 'https://i.pravatar.cc/64?img=49',
        },
    },
    {
        value: 'margaret',
        label: 'Margaret Hamilton',
        data: {
            name: 'Margaret Hamilton',
            email: 'margaret@nori-ui.com',
            role: 'Editor',
            avatar: 'https://i.pravatar.cc/64?img=44',
        },
    },
    {
        value: 'katherine',
        label: 'Katherine Johnson',
        data: {
            name: 'Katherine Johnson',
            email: 'katherine@nori-ui.com',
            role: 'Editor',
            avatar: 'https://i.pravatar.cc/64?img=48',
        },
    },
    {
        value: 'radia',
        label: 'Radia Perlman',
        data: {
            name: 'Radia Perlman',
            email: 'radia@nori-ui.com',
            role: 'Viewer',
            avatar: 'https://i.pravatar.cc/64?img=45',
        },
    },
];

const ROLE_TONE: Record<Member['role'], 'primary' | 'success' | 'warning' | 'neutral'> = {
    Owner: 'primary',
    Admin: 'success',
    Editor: 'warning',
    Viewer: 'neutral',
};

/**
 * People-picker. Shows what a custom `renderOption` is actually for —
 * a richer row with an avatar, name, role badge, and a muted email.
 * Designed to look like the kind of assignee picker a serious product
 * would ship, not a debug-text dump.
 */
export default function SelectCustomRenderer() {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
        <VStack gap={3}>
            <Text variant="body-sm">Assign this issue to a teammate.</Text>
            <Select<Member>
                options={MEMBERS}
                {...(value !== undefined ? { value } : {})}
                onChange={(next) => setValue(next)}
                placeholder="Choose a teammate…"
                aria-label="Assignee"
                itemHeight={64}
                renderOption={(option, { selected }) => {
                    const member = option.data;
                    if (!member) {
                        return null;
                    }
                    return (
                        <HStack gap={3} className="flex-1 items-center" style={{ paddingVertical: 4 }}>
                            <Avatar {...(member.avatar ? { src: member.avatar } : {})} name={member.name} size="md" />
                            <VStack gap={0} className="flex-1">
                                <HStack gap={2} className="items-center">
                                    <Text style={{ fontWeight: '600' }}>{member.name}</Text>
                                    <Badge tone={ROLE_TONE[member.role]} appearance="soft">
                                        {member.role}
                                    </Badge>
                                </HStack>
                                <Text variant="body-sm">{member.email}</Text>
                            </VStack>
                            {selected ? <Text style={{ fontWeight: '600' }}>✓</Text> : null}
                        </HStack>
                    );
                }}
            />
        </VStack>
    );
}
