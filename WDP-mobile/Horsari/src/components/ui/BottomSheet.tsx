import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Elevation, Palette, Radius } from '@/constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const OFF_SCREEN = 600;
// Exit runs faster than enter — see Phase 1 design system audit animation rules.
const ENTER_SPRING = { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 };
const EXIT_TIMING = { toValue: OFF_SCREEN, duration: 180, useNativeDriver: true };

/**
 * Shared bottom sheet — see Phase 1 design system audit. Used for
 * confirmations tied to a screen action (bet confirm, accept/decline).
 * Enters with a spring, exits with a quicker slide so it stays mounted
 * (and interactive) for the full dismiss animation instead of vanishing
 * the instant `visible` flips to false.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const translateY = useRef(new Animated.Value(OFF_SCREEN)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.spring(translateY, ENTER_SPRING),
        Animated.timing(scrimOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (shouldRender) {
      Animated.parallel([
        Animated.timing(translateY, EXIT_TIMING),
        Animated.timing(scrimOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setShouldRender(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
      </Animated.View>
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, Elevation.overlay, { transform: [{ translateY }] }]}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.grabber} />
            {children}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.scrim,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.cardRaised,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Palette.cardBorder,
    marginBottom: 16,
  },
});
