'use client';

import type { ReactNode } from 'react';
import { View } from 'react-native';

export const Footer = ({ children }: { children?: ReactNode }) => <View style={{ paddingTop: 12 }}>{children}</View>;
