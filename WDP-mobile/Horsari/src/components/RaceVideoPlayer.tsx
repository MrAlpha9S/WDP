import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

// Placeholder race-broadcast video — shown whenever a race is live but no
// real Mux playback is available yet (stream not provisioned, or invalid id).
const PLACEHOLDER_EMBED_URL =
  'https://www.youtube.com/embed/2rKE4YIrDRk?autoplay=1&mute=1&loop=1&playlist=2rKE4YIrDRk&controls=0&showinfo=0&playsinline=1';

// Mux playback IDs are alphanumeric (base64url-ish); guard against anything
// unexpected before it's interpolated into the WebView's HTML string.
const VALID_PLAYBACK_ID = /^[A-Za-z0-9_-]+$/;

interface RaceVideoPlayerProps {
  style?: ViewStyle;
  muxPlaybackId?: string | null;
}

// Real Mux HLS playback is done via the <mux-player> web component (loaded
// from a CDN) inside a WebView, rather than a native HLS player library —
// this app is pure Expo managed workflow with no native HLS module
// installed, and a bare .m3u8 fed into a raw <video> tag has no native HLS
// demuxing on Android's Chromium WebView (unlike iOS Safari/WebKit).
// mux-player wraps hls.js so it works the same way across platforms here.
function buildPlayerHtml(playbackId: string | null) {
  if (playbackId && VALID_PLAYBACK_ID.test(playbackId)) {
    return `<html><body style="margin:0;background:#000;">
      <script src="https://cdn.jsdelivr.net/npm/@mux/mux-player"></script>
      <mux-player
        playback-id="${playbackId}"
        stream-type="live"
        autoplay
        muted
        playsinline
        style="width:100%;height:100%;display:block;"
      ></mux-player>
    </body></html>`;
  }
  return `<html><body style="margin:0;background:#000;"><iframe width="100%" height="100%" style="border:0;display:block;" src="${PLACEHOLDER_EMBED_URL}" allow="autoplay; encrypted-media" allowfullscreen></iframe></body></html>`;
}

export function RaceVideoPlayer({ style, muxPlaybackId }: RaceVideoPlayerProps) {
  const hasRealStream = !!muxPlaybackId && VALID_PLAYBACK_ID.test(muxPlaybackId);

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'web' ? (
        // @ts-ignore — iframe is valid in react-native-web
        // Web-preview build only (no dedicated spectator web app); real Mux
        // playback here is left as a follow-up, matching the mobile-only
        // scope of this fix.
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
            source={{ html: buildPlayerHtml(muxPlaybackId ?? null) }}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            // Real playback needs touch to reach mux-player's own controls
            // (mute/fullscreen); the placeholder stays non-interactive.
            pointerEvents={hasRealStream ? 'auto' : 'none'}
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
