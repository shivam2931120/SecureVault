import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopColor: COLORS.border,
                    height: 56,
                    paddingBottom: 0,
                    paddingTop: 0,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "shield" : "shield-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="generator"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "key" : "key-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="files"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "folder" : "folder-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "settings" : "settings-outline"} size={26} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

