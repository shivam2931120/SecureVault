import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

let clipboardTimeout: ReturnType<typeof setTimeout> | null = null;
const CLIPBOARD_CLEAR_DELAY = 30000; // 30 seconds

/**
 * Copy text to clipboard and automatically clear after 30 seconds
 */
export async function secureCopy(text: string): Promise<boolean> {
    try {
        await Clipboard.setStringAsync(text);

        // Clear any existing timeout
        if (clipboardTimeout) {
            clearTimeout(clipboardTimeout);
        }

        // Set timeout to clear clipboard
        clipboardTimeout = setTimeout(async () => {
            await clearClipboard();
            clipboardTimeout = null;
        }, CLIPBOARD_CLEAR_DELAY);

        return true;
    } catch (e) {
        console.error('Failed to copy to clipboard', e);
        return false;
    }
}

/**
 * Clear the clipboard
 */
export async function clearClipboard(): Promise<void> {
    try {
        // Set empty string to clear
        await Clipboard.setStringAsync('');
    } catch (e) {
        console.error('Failed to clear clipboard', e);
    }
}

/**
 * Get clipboard content
 */
export async function getClipboard(): Promise<string> {
    try {
        return await Clipboard.getStringAsync();
    } catch (e) {
        console.error('Failed to read clipboard', e);
        return '';
    }
}

/**
 * Check if clipboard has content
 */
export async function hasClipboardContent(): Promise<boolean> {
    try {
        const content = await Clipboard.getStringAsync();
        return content.length > 0;
    } catch (e) {
        return false;
    }
}

/**
 * Cancel auto-clear (call when user navigates away)
 */
export function cancelClipboardClear(): void {
    if (clipboardTimeout) {
        clearTimeout(clipboardTimeout);
        clipboardTimeout = null;
    }
}
