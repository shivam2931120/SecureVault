import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';
import { useVaultStore } from '@/store/vaultStore';
import { useAuthStore } from '@/store/authStore';
import { VaultItemType, ITEM_TYPE_META } from '@/types/vault';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ITEM_TYPES: VaultItemType[] = ['login', 'card', 'note', 'identity', 'apikey', 'wifi'];

export default function AddItemScreen() {
    const [selectedType, setSelectedType] = useState<VaultItemType>('login');
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Login fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [url, setUrl] = useState('');
    const [totp, setTotp] = useState('');
    const [notes, setNotes] = useState('');

    // Card fields
    const [cardholder, setCardholder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [pin, setPin] = useState('');

    // Identity fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [idNumber, setIdNumber] = useState('');

    // API Key fields
    const [service, setService] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiExpiry, setApiExpiry] = useState('');

    // Wi-Fi fields
    const [ssid, setSsid] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [securityType, setSecurityType] = useState<'WPA2' | 'WPA3' | 'WEP' | 'Open'>('WPA2');

    const { addItem } = useVaultStore();
    const { userId, masterKey } = useAuthStore();

    const getDataForType = () => {
        switch (selectedType) {
            case 'login':
                return { username, password, url, totp, notes };
            case 'card':
                return { cardholder, cardNumber, expiry, cvv, pin, notes };
            case 'note':
                return { body: notes };
            case 'identity':
                return { firstName, lastName, phone, email, address, idNumber, notes };
            case 'apikey':
                return { service, key: apiKey, expiry: apiExpiry, notes };
            case 'wifi':
                return { ssid, password: wifiPassword, securityType, notes };
            default:
                return {};
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        if (!masterKey) {
            alert('Please unlock your vault first');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = getDataForType();
            await addItem(userId, selectedType, title, data, masterKey);
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
            alert('Failed to save item');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderInput = (label: string, value: string, setter: (v: string) => void, props: any = {}) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: 'top' }]}
                placeholderTextColor={COLORS.textSecondary}
                value={value}
                onChangeText={setter}
                {...props}
            />
        </View>
    );

    const renderTypeSpecificFields = () => {
        switch (selectedType) {
            case 'login':
                return (
                    <>
                        {renderInput('URL', url, setUrl, { placeholder: 'https://example.com', autoCapitalize: 'none' })}
                        {renderInput('Username / Email', username, setUsername, { placeholder: 'user@example.com', autoCapitalize: 'none' })}
                        {renderInput('Password', password, setPassword, { placeholder: '••••••••', secureTextEntry: true })}
                        {renderInput('TOTP Secret (Optional)', totp, setTotp, { placeholder: 'Base32 secret', autoCapitalize: 'none' })}
                        {renderInput('Notes', notes, setNotes, { placeholder: 'Additional notes...', multiline: true })}
                    </>
                );
            case 'card':
                return (
                    <>
                        {renderInput('Cardholder Name', cardholder, setCardholder, { placeholder: 'John Doe' })}
                        {renderInput('Card Number', cardNumber, setCardNumber, { placeholder: '4242 4242 4242 4242', keyboardType: 'numeric' })}
                        {renderInput('Expiry (MM/YY)', expiry, setExpiry, { placeholder: '12/25' })}
                        {renderInput('CVV', cvv, setCvv, { placeholder: '123', keyboardType: 'numeric', maxLength: 4 })}
                        {renderInput('PIN (Optional)', pin, setPin, { placeholder: '••••', secureTextEntry: true, keyboardType: 'numeric' })}
                        {renderInput('Notes', notes, setNotes, { placeholder: 'Additional notes...', multiline: true })}
                    </>
                );
            case 'note':
                return (
                    <>
                        {renderInput('Content', notes, setNotes, { placeholder: 'Your secure note...', multiline: true })}
                    </>
                );
            case 'identity':
                return (
                    <>
                        {renderInput('First Name', firstName, setFirstName, { placeholder: 'John' })}
                        {renderInput('Last Name', lastName, setLastName, { placeholder: 'Doe' })}
                        {renderInput('Email', email, setEmail, { placeholder: 'john@example.com', autoCapitalize: 'none' })}
                        {renderInput('Phone', phone, setPhone, { placeholder: '+1 234 567 8900', keyboardType: 'phone-pad' })}
                        {renderInput('Address', address, setAddress, { placeholder: '123 Main St, City', multiline: true })}
                        {renderInput('ID/Passport Number', idNumber, setIdNumber, { placeholder: 'AB1234567' })}
                        {renderInput('Notes', notes, setNotes, { placeholder: 'Additional notes...', multiline: true })}
                    </>
                );
            case 'apikey':
                return (
                    <>
                        {renderInput('Service Name', service, setService, { placeholder: 'e.g. AWS, Stripe' })}
                        {renderInput('API Key', apiKey, setApiKey, { placeholder: 'sk_live_...', autoCapitalize: 'none' })}
                        {renderInput('Expiry Date (Optional)', apiExpiry, setApiExpiry, { placeholder: 'YYYY-MM-DD' })}
                        {renderInput('Notes', notes, setNotes, { placeholder: 'Additional notes...', multiline: true })}
                    </>
                );
            case 'wifi':
                return (
                    <>
                        {renderInput('Network Name (SSID)', ssid, setSsid, { placeholder: 'MyWiFiNetwork' })}
                        {renderInput('Password', wifiPassword, setWifiPassword, { placeholder: '••••••••', secureTextEntry: true })}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Security Type</Text>
                            <View style={styles.securityOptions}>
                                {(['WPA2', 'WPA3', 'WEP', 'Open'] as const).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.securityButton, securityType === type && styles.securityButtonActive]}
                                        onPress={() => setSecurityType(type)}
                                    >
                                        <Text style={[styles.securityButtonText, securityType === type && styles.securityButtonTextActive]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        {renderInput('Notes', notes, setNotes, { placeholder: 'Additional notes...', multiline: true })}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>Add Item</Text>

            {/* Type Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                {ITEM_TYPES.map((type) => {
                    const meta = ITEM_TYPE_META[type];
                    const isSelected = selectedType === type;
                    return (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Ionicons name={meta.icon as any} size={20} color={isSelected ? meta.color : COLORS.textSecondary} />
                            <Text style={[styles.typeLabel, isSelected && { color: meta.color }]}>{meta.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Title Field */}
            {renderInput('Title', title, setTitle, { placeholder: 'Give this item a name' })}

            {/* Type-Specific Fields */}
            {renderTypeSpecificFields()}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSubmitting}>
                {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="checkmark" size={24} color="#FFF" />
                        <Text style={styles.saveButtonText}>Save</Text>
                    </>
                )}
            </TouchableOpacity>
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
    typeSelector: {
        marginBottom: SPACING.l,
        maxHeight: 60,
    },
    typeButton: {
        alignItems: 'center',
        marginRight: SPACING.m,
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 70,
    },
    typeButtonSelected: {
        backgroundColor: `${COLORS.primary}20`,
        borderColor: COLORS.primary,
    },
    typeLabel: {
        ...TYPOGRAPHY.small,
        marginTop: 4,
        color: COLORS.textSecondary,
    } as any,
    inputGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    } as any,
    input: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        color: COLORS.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    securityOptions: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    securityButton: {
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    securityButtonActive: {
        backgroundColor: `${COLORS.primary}20`,
        borderColor: COLORS.primary,
    },
    securityButtonText: {
        color: COLORS.textSecondary,
    },
    securityButtonTextActive: {
        color: COLORS.primary,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        marginTop: SPACING.l,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
