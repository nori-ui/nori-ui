import { AspectRatio } from '@nori-ui/core';
import { View } from 'react-native';

export default function AspectRatioBasic() {
    return (
        <View style={{ width: 320 }}>
            <AspectRatio ratio={16 / 9}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: '#e2e8f0',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* 16/9 container — replace with <Image> or <Video> */}
                </View>
            </AspectRatio>
        </View>
    );
}
