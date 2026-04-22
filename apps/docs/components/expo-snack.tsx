export type ExpoSnackProps = {
    /** Snack ID from https://snack.expo.dev (the last URL segment) */
    id: string;
    platform?: 'ios' | 'android' | 'web';
    preview?: boolean;
    theme?: 'light' | 'dark';
    height?: number;
};

/**
 * Embeds an Expo Snack for native previews. Snacks are free and hosted by
 * Expo — consumers can fork and run the example on a real device.
 */
export function ExpoSnack({ id, platform = 'ios', preview = true, theme = 'light', height = 500 }: ExpoSnackProps) {
    const params = new URLSearchParams({
        platform,
        preview: preview ? 'true' : 'false',
        theme,
    });
    const src = `https://snack.expo.dev/embedded/${id}?${params.toString()}`;
    return (
        <iframe
            title={`Expo Snack ${id}`}
            src={src}
            style={{
                width: '100%',
                height,
                border: '1px solid #e4e4e7',
                borderRadius: 8,
            }}
            loading="lazy"
        />
    );
}
