import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

// Placeholder race-broadcast video — used on the spectator race detail
// screen whenever a race is live. Deliberately has no real Mux/HLS branch:
// a raw .m3u8 URL fed into a bare <video> tag has no native HLS demuxing on
// Android's Chromium WebView (unlike iOS Safari/WebKit), and this app has no
// HLS-capable player library installed, so the real-stream path was removed
// rather than shipping something broken on Android. Web keeps real Mux
// playback via @mux/mux-player-react — this component is mobile/web-preview
// only, and always shows the same placeholder regardless of platform.
const PLACEHOLDER_EMBED_URL =
  'https://www.youtube.com/embed/2rKE4YIrDRk?autoplay=1&mute=1&loop=1&playlist=2rKE4YIrDRk&controls=0&showinfo=0&playsinline=1';

interface RaceVideoPlayerProps {
  style?: ViewStyle;
}

export function RaceVideoPlayer({ style }: RaceVideoPlayerProps) {
  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'web' ? (
        // @ts-ignore — iframe is valid in react-native-web
        <iframe
          src={PLACEHOLDER_EMBED_URL}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          allow="autoplay; encrypted-media"
        />
      ) : (
        // Wrapped in a flex:1 View rather than relying on the WebView's own
        // absolute-positioning style — react-native-webview on Android can
        // measure itself at 0x0 on the initial layout pass when it's the one
        // doing the absolute positioning, leaving the video area blank even
        // though the parent box renders fine.
        <View style={styles.webviewWrapper}>
          <WebView
            style={styles.webview}
            source={{
              html: `<html><body style="margin:0;background:#000;"><iframe width="100%" height="100%" style="border:0;display:block;" src="${PLACEHOLDER_EMBED_URL}" allow="autoplay; encrypted-media" allowfullscreen></iframe></body></html>`,
            }}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            pointerEvents="none"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    backgroundColor: '#0d0d0e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262629',
    overflow: 'hidden',
  },
  webviewWrapper: { flex: 1 },
  webview: { flex: 1 },
});
