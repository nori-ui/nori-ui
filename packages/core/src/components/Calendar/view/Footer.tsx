'use client';

import type { ReactNode } from 'react';
import { View } from 'react-native';
import { px } from '../../../theme/px';

export const Footer = ({ children }: { children?: ReactNode }) => (
    <View style={{ paddingTop: px('3') }}>{children}</View>
);
