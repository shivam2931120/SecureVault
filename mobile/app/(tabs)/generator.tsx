import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { secureCopy } from '@/utils/secureClipboard';

// Platform-safe haptics
let Haptics: any = null;
if (Platform.OS !== 'web') {
    Haptics = require('expo-haptics');
}

const triggerHaptic = async (type: 'medium' | 'success' | 'error') => {
    if (!Haptics || Platform.OS === 'web') return;
    try {
        if (type === 'medium') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (type === 'success') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    } catch (e) {
        // Ignore haptic errors
    }
};

interface PasswordHistory {
    password: string;
    timestamp: number;
}

const WORD_LIST = ['apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'galaxy', 'harbor', 'island', 'jungle', 'knight', 'lemon', 'mountain', 'neptune', 'ocean', 'phoenix', 'quantum', 'river', 'saturn', 'thunder', 'ultra', 'violet', 'wizard', 'xenon', 'yellow', 'zenith'];

export default function GeneratorScreen() {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);
    const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
    const [customSymbols, setCustomSymbols] = useState('!@#$%^&*');
    const [mode, setMode] = useState<'password' | 'passphrase' | 'pin'>('password');
    const [wordCount, setWordCount] = useState(4);
    const [wordSeparator, setWordSeparator] = useState('-');
    const [pinLength, setPinLength] = useState(6);
    const [history, setHistory] = useState<PasswordHistory[]>([]);
    const [copied, setCopied] = useState(false);

    const calculateStrength = useCallback((pwd: string): { score: number; label: string; color: string } => {
        if (!pwd) return { score: 0, label: 'None', color: COLORS.border };

        let score = 0;

        // Length score
        if (pwd.length >= 8) score += 1;
        if (pwd.length >= 12) score += 1;
        if (pwd.length >= 16) score += 1;
        if (pwd.length >= 24) score += 1;

        // Character variety
        if (/[a-z]/.test(pwd)) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

        // Bonus for mixing
        if (pwd.length >= 12 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) {
            score += 2;
        }

        if (score <= 2) return { score: score / 10, label: 'Weak', color: '#FF4444' };
        if (score <= 4) return { score: score / 10, label: 'Fair', color: '#FF8844' };
        if (score <= 6) return { score: score / 10, label: 'Good', color: '#FFCC00' };
        if (score <= 8) return { score: score / 10, label: 'Strong', color: '#44CC44' };
        return { score: 1, label: 'Very Strong', color: '#00CC88' };
    }, []);

    const generate = useCallback(() => {
        let result = '';

        if (mode === 'password') {
            let charset = '';
            const ambiguous = 'Il1O0';

            if (useUpper) charset += avoidAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (useLower) charset += avoidAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
            if (useNumbers) charset += avoidAmbiguous ? '23456789' : '0123456789';
            if (useSymbols) charset += customSymbols;

            if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';

            // Use crypto for better randomness
            const array = new Uint32Array(length);
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
                crypto.getRandomValues(array);
            } else {
                for (let i = 0; i < length; i++) {
                    array[i] = Math.floor(Math.random() * charset.length);
                }
            }

            for (let i = 0; i < length; i++) {
                result += charset.charAt(array[i] % charset.length);
            }
        } else if (mode === 'passphrase') {
            const words: string[] = [];
            for (let i = 0; i < wordCount; i++) {
                const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
                let word = WORD_LIST[randomIndex];
                // Capitalize first letter
                word = word.charAt(0).toUpperCase() + word.slice(1);
                words.push(word);
            }
            result = words.join(wordSeparator);

            // Add a random number at the end
            result += wordSeparator + Math.floor(Math.random() * 100);
        } else if (mode === 'pin') {
            for (let i = 0; i < pinLength; i++) {
                result += Math.floor(Math.random() * 10).toString();
            }
        }

        setPassword(result);
        triggerHaptic('medium');

        // Add to history
        setHistory(prev => [{ password: result, timestamp: Date.now() }, ...prev.slice(0, 9)]);
    }, [mode, length, useUpper, useLower, useNumbers, useSymbols, avoidAmbiguous, customSymbols, wordCount, wordSeparator, pinLength]);

    const copyToClipboard = async () => {
        if (!password) return;
        const success = await secureCopy(password);
        if (success) {
            setCopied(true);
            triggerHaptic('success');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const strength = calculateStrength(password);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>Generator</Text>

            {/* Output */}
            <View style={styles.outputContainer}>
                <Text style={styles.password} numberOfLines={1}>{password || 'Tap Generate'}</Text>
                <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                    <Ionicons name={copied ? "checkmark" : "copy-outline"} size={24} color={copied ? '#00CC88' : COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Strength Meter */}
            {password && (
                <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                        <View style={[styles.strengthFill, { width: `${strength.score * 100}%`, backgroundColor: strength.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
            )}

            {/* Mode Selector */}
            <View style={styles.modeContainer}>
                {(['password', 'passphrase', 'pin'] as const).map((m) => (
                    <TouchableOpacity
                        key={m}
                        style={[styles.modeButton, mode === m && styles.modeButtonActive]}
                        onPress={() => setMode(m)}
                    >
                        <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                            {m === 'password' ? 'Password' : m === 'passphrase' ? 'Passphrase' : 'PIN'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                {mode === 'password' && (
                    <>
                        <View style={styles.controlRow}>
                            <Text style={styles.label}>Length: {length}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={8}
                                maximumValue={64}
                                step={1}
                                value={length}
                                onValueChange={setLength}
                                thumbTintColor={COLORS.primary}
                                minimumTrackTintColor={COLORS.primary}
                                maximumTrackTintColor={COLORS.border}
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Uppercase (A-Z)</Text>
                            <Switch value={useUpper} onValueChange={setUseUpper} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Lowercase (a-z)</Text>
                            <Switch value={useLower} onValueChange={setUseLower} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Numbers (0-9)</Text>
                            <Switch value={useNumbers} onValueChange={setUseNumbers} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Symbols (!@#$)</Text>
                            <Switch value={useSymbols} onValueChange={setUseSymbols} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Avoid Ambiguous (0O, 1l)</Text>
                            <Switch value={avoidAmbiguous} onValueChange={setAvoidAmbiguous} trackColor={{ false: COLORS.border, true: COLORS.primary }} />
                        </View>
                    </>
                )}

                {mode === 'passphrase' && (
                    <>
                        <View style={styles.controlRow}>
                            <Text style={styles.label}>Words: {wordCount}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={3}
                                maximumValue={8}
                                step={1}
                                value={wordCount}
                                onValueChange={setWordCount}
                                thumbTintColor={COLORS.primary}
                                minimumTrackTintColor={COLORS.primary}
                                maximumTrackTintColor={COLORS.border}
                            />
                        </View>

                        <View style={styles.separatorRow}>
                            <Text style={styles.label}>Separator:</Text>
                            <View style={styles.separatorOptions}>
                                {['-', '_', '.', ' '].map((sep) => (
                                    <TouchableOpacity
                                        key={sep}
                                        style={[styles.sepButton, wordSeparator === sep && styles.sepButtonActive]}
                                        onPress={() => setWordSeparator(sep)}
                                    >
                                        <Text style={styles.sepText}>{sep === ' ' ? 'Space' : sep}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {mode === 'pin' && (
                    <View style={styles.controlRow}>
                        <Text style={styles.label}>PIN Length: {pinLength}</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={4}
                            maximumValue={12}
                            step={1}
                            value={pinLength}
                            onValueChange={setPinLength}
                            thumbTintColor={COLORS.primary}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor={COLORS.border}
                        />
                    </View>
                )}

                <TouchableOpacity style={styles.generateButton} onPress={generate}>
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={styles.generateText}>Generate</Text>
                </TouchableOpacity>
            </View>

            {/* History */}
            {history.length > 0 && (
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    {history.slice(0, 5).map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.historyItem}
                            onPress={() => setPassword(item.password)}
                        >
                            <Text style={styles.historyPassword} numberOfLines={1}>{item.password}</Text>
                            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.l,
        paddingTop: 60,
        paddingBottom: 100,
    },
    headerTitle: {
        ...TYPOGRAPHY.h1,
        marginBottom: SPACING.l,
    } as any,
    outputContainer: {
        backgroundColor: COLORS.card,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    password: {
        ...TYPOGRAPHY.h3,
        color: COLORS.primary,
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 16,
    } as any,
    copyButton: {
        padding: SPACING.s,
        marginLeft: SPACING.s,
    },
    strengthContainer: {
        marginTop: SPACING.m,
        gap: SPACING.xs,
    },
    strengthBar: {
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    modeContainer: {
        flexDirection: 'row',
        marginTop: SPACING.l,
        marginBottom: SPACING.m,
        gap: SPACING.s,
    },
    modeButton: {
        flex: 1,
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    modeButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}20`,
    },
    modeText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    modeTextActive: {
        color: COLORS.primary,
    },
    controls: {
        gap: SPACING.m,
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
    } as any,
    slider: {
        flex: 1,
        marginLeft: SPACING.m,
        height: 40,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    toggleLabel: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    } as any,
    separatorRow: {
        gap: SPACING.s,
    },
    separatorOptions: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    sepButton: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sepButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}20`,
    },
    sepText: {
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    generateButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        marginTop: SPACING.m,
    },
    generateText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    historySection: {
        marginTop: SPACING.xl,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.m,
    } as any,
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    historyPassword: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    } as any,
});
