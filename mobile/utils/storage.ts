
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const storage = {
    getItem: async (key: string) => {
        if (isWeb) {
            return await AsyncStorage.getItem(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },
    setItem: async (key: string, value: string, options?: SecureStore.SecureStoreOptions) => {
        if (isWeb) {
            return await AsyncStorage.setItem(key, value);
        } else {
            return await SecureStore.setItemAsync(key, value, options);
        }
    },
    removeItem: async (key: string) => {
        if (isWeb) {
            return await AsyncStorage.removeItem(key);
        } else {
            return await SecureStore.deleteItemAsync(key);
        }
    }
};
