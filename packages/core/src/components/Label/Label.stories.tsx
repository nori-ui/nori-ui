import { View } from 'react-native';
import { Switch } from '../Switch';
import { Label } from './Label';

export default { title: 'Components/Label' };

export const Standalone = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Label htmlFor="opt">Subscribe to newsletter</Label>
        <Switch id="opt" testID="opt" />
    </View>
);

export const Required = () => (
    <Label htmlFor="opt" required>
        Email
    </Label>
);

export const Disabled = () => (
    <Label htmlFor="opt" disabled>
        Disabled label
    </Label>
);
