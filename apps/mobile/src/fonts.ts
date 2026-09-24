/**
 * Plus Jakarta Sans 를 모든 <Text>의 기본 글꼴로. 네이티브는 fontWeight 로 굵기를 고르지 못하므로
 * Text.render 를 감싸 fontWeight → 해당 굵기의 폰트 패밀리로 바꿔 준다.
 */
import { StyleSheet, Text, type TextStyle } from 'react-native';
import React from 'react';
import {
  PlusJakartaSans_400Regular, PlusJakartaSans_400Regular_Italic, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

export const FONTS = { PlusJakartaSans_400Regular, PlusJakartaSans_400Regular_Italic, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold };

const family = (w?: TextStyle['fontWeight'], italic?: boolean) => {
  const n = w === 'bold' ? 700 : w === 'normal' || !w ? 400 : Number(w);
  if (italic && n <= 400) return 'PlusJakartaSans_400Regular_Italic';
  if (n >= 800) return 'PlusJakartaSans_800ExtraBold';
  if (n >= 700) return 'PlusJakartaSans_700Bold';
  if (n >= 600) return 'PlusJakartaSans_600SemiBold';
  if (n >= 500) return 'PlusJakartaSans_500Medium';
  return 'PlusJakartaSans_400Regular';
};

let patched = false;
export function applyDefaultFont() {
  if (patched) return; patched = true;
  const T = Text as unknown as { render?: (...args: unknown[]) => React.ReactElement<{ style?: TextStyle }> };
  const orig = T.render;
  if (!orig) return;
  T.render = function (this: unknown, ...args: unknown[]) {
    const el = orig.apply(this, args) as React.ReactElement<{ style?: TextStyle }>;
    const flat = (StyleSheet.flatten(el.props.style) ?? {}) as TextStyle;
    if (flat.fontFamily) return el;
    return React.cloneElement(el, { style: [{ fontFamily: family(flat.fontWeight, flat.fontStyle === 'italic') }, el.props.style] as unknown as TextStyle });
  };
}
