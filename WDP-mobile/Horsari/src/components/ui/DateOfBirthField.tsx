import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette as SharedPalette } from '@/constants/theme';

const Palette = {
  ...SharedPalette,
  inputBackground: '#0E0E10',
  inputBorder: '#2A2A2D',
  textPlaceholder: '#6A6A70',
} as const;

// YYYY-MM-DD
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 80;
const MAX_YEAR = CURRENT_YEAR - 10;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function formatDisplayDate(dob: string) {
  if (!DATE_RE.test(dob)) return null;
  const [y, m, d] = dob.split('-').map(Number);
  return `${d} ${MONTH_LABELS[m - 1]} ${y}`;
}

function WheelColumn<T extends number>({
  data,
  selectedValue,
  onChange,
  renderLabel,
}: {
  data: T[];
  selectedValue: T;
  onChange: (value: T) => void;
  renderLabel?: (value: T) => string;
}) {
  const initialIndex = Math.max(0, data.indexOf(selectedValue));

  const handleMomentumEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.min(Math.max(index, 0), data.length - 1);
    onChange(data[clamped]);
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item)}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
      initialScrollIndex={initialIndex}
      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }}
      onMomentumScrollEnd={handleMomentumEnd}
      style={styles.wheelColumn}
      renderItem={({ item }) => (
        <View style={styles.wheelItem}>
          <Text style={[styles.wheelItemText, item === selectedValue && styles.wheelItemTextActive]}>
            {renderLabel ? renderLabel(item) : item}
          </Text>
        </View>
      )}
    />
  );
}

export function DateOfBirthField({
  value,
  onChange,
  accentColor = Palette.gold,
  placeholder = 'Select date of birth',
}: {
  value: string;
  onChange: (value: string) => void;
  accentColor?: string;
  placeholder?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempYear, setTempYear] = useState(CURRENT_YEAR - 25);

  const open = () => {
    if (DATE_RE.test(value.trim())) {
      const [y, m, d] = value.trim().split('-').map(Number);
      setTempYear(y);
      setTempMonth(m);
      setTempDay(d);
    } else {
      setTempYear(CURRENT_YEAR - 25);
      setTempMonth(1);
      setTempDay(1);
    }
    setIsVisible(true);
  };

  const confirm = () => {
    const day = Math.min(tempDay, daysInMonth(tempMonth, tempYear));
    const mm = String(tempMonth).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${tempYear}-${mm}-${dd}`);
    setIsVisible(false);
  };

  return (
    <>
      <Pressable style={styles.inputWrapper} onPress={open}>
        <Ionicons name="calendar-outline" size={18} color={Palette.textMuted} />
        <Text style={[styles.inputText, !value && styles.inputPlaceholder]}>
          {formatDisplayDate(value) ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Palette.textMuted} />
      </Pressable>

      <Modal visible={isVisible} transparent animationType="slide" onRequestClose={() => setIsVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setIsVisible(false)} hitSlop={8}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Date of Birth</Text>
              <Pressable onPress={confirm} hitSlop={8}>
                <Text style={[styles.modalDone, { color: accentColor }]}>Done</Text>
              </Pressable>
            </View>

            {isVisible && (
              <View style={styles.pickerRow}>
                <View style={[styles.pickerHighlight, { borderColor: accentColor }]} pointerEvents="none" />
                <WheelColumn data={DAYS} selectedValue={tempDay} onChange={setTempDay} />
                <WheelColumn
                  data={MONTHS}
                  selectedValue={tempMonth}
                  onChange={setTempMonth}
                  renderLabel={(m) => MONTH_LABELS[m - 1]}
                />
                <WheelColumn data={YEARS} selectedValue={tempYear} onChange={setTempYear} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: Palette.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 10,
  },
  inputText: {
    flex: 1,
    color: Palette.text,
    fontSize: 15,
  },
  inputPlaceholder: {
    color: Palette.textPlaceholder,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  modalCancel: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 14,
    color: Palette.text,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalDone: {
    fontSize: 14,
    fontWeight: '700',
  },

  pickerRow: {
    flexDirection: 'row',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    paddingHorizontal: 12,
  },
  pickerHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(201,162,75,0.08)',
    borderRadius: 8,
  },
  wheelColumn: {
    flex: 1,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontSize: 16,
    color: Palette.textMuted,
  },
  wheelItemTextActive: {
    color: Palette.text,
    fontWeight: '700',
  },
});
