import { Stack } from 'expo-router';
import { COLORS } from '@/theme';

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.background },
                headerTintColor: COLORS.textPrimary,
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: COLORS.background },
            }}
        >
            <Stack.Screen
                name="autofill"
                options={{
                    title: 'Autofill Settings',
                    headerShown: true,
                }}
            />
        </Stack>
    );
}
