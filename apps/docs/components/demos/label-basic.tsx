import { Label, Switch } from '@nori-ui/core';
import { View } from 'react-native';

export default function LabelBasic() {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Label htmlFor="newsletter">Subscribe to newsletter</Label>
            <Switch id="newsletter" testID="newsletter" />
        </View>
    );
}
