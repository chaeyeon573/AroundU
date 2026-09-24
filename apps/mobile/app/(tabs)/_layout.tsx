import { useState } from 'react';
import { Tabs } from 'expo-router';
import { CreateSheet } from '@/components/CreateSheet';
import { Pressable, View } from 'react-native';
import { Users, Compass, Plus, School, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@core/i18n';

const PRIMARY = '#0F2B48';
const MUTED = '#74777E';

/** 사람 | 발견 | + | 캠퍼스 | 나 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  return (<>
    <CreateSheet open={open} onClose={() => setOpen(false)} />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { height: 58 + insets.bottom, paddingTop: 6, borderTopColor: '#E6E8E1', backgroundColor: '#fff' },
        sceneStyle: { backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('사람'), tabBarIcon: ({ color }) => <Users size={24} color={color} /> }} />
      <Tabs.Screen name="discover" options={{ title: t('발견'), tabBarIcon: ({ color }) => <Compass size={24} color={color} /> }} />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={{ marginTop: -18, height: 52, width: 52, borderRadius: 26, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
              <Plus size={26} color="#fff" />
            </View>
          ),
          tabBarButton: ({ children, style }) => <Pressable onPress={() => setOpen(true)} style={[style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>{children}</Pressable>,
        }}
      />
      <Tabs.Screen name="campus" options={{ title: t('캠퍼스'), tabBarIcon: ({ color }) => <School size={24} color={color} /> }} />
      <Tabs.Screen name="me" options={{ title: t('나'), tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
    </Tabs>
  </>);
}
