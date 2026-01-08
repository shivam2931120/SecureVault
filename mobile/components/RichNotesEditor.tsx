import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Text,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/theme';

interface RichNotesEditorProps {
    value: string;
    onChange: (text: string) => void;
    placeholder?: string;
    minHeight?: number;
}

type FormatType = 'bold' | 'italic' | 'underline' | 'bullet' | 'number' | 'heading' | 'code' | 'link';

export function RichNotesEditor({
    value,
    onChange,
    placeholder = 'Write your secure note...',
    minHeight = 200
}: RichNotesEditorProps) {
    const inputRef = useRef<TextInput>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const wrapSelection = useCallback((prefix: string, suffix: string) => {
        const before = value.substring(0, selection.start);
        const selected = value.substring(selection.start, selection.end);
        const after = value.substring(selection.end);

        const newText = `${before}${prefix}${selected || 'text'}${suffix}${after}`;
        onChange(newText);

        // Focus back on input
        inputRef.current?.focus();
    }, [value, selection, onChange]);

    const insertAtCursor = useCallback((text: string) => {
        const before = value.substring(0, selection.start);
        const after = value.substring(selection.end);

        onChange(`${before}${text}${after}`);
        inputRef.current?.focus();
    }, [value, selection, onChange]);

    const applyFormat = useCallback((format: FormatType) => {
        switch (format) {
            case 'bold':
                wrapSelection('**', '**');
                break;
            case 'italic':
                wrapSelection('*', '*');
                break;
            case 'underline':
                wrapSelection('__', '__');
                break;
            case 'code':
                wrapSelection('`', '`');
                break;
            case 'heading':
                insertAtCursor('\n## ');
                break;
            case 'bullet':
                insertAtCursor('\n• ');
                break;
            case 'number':
                insertAtCursor('\n1. ');
                break;
            case 'link':
                wrapSelection('[', '](url)');
                break;
        }
    }, [wrapSelection, insertAtCursor]);

    const insertCheckbox = useCallback(() => {
        insertAtCursor('\n☐ ');
    }, [insertAtCursor]);

    const insertDivider = useCallback(() => {
        insertAtCursor('\n---\n');
    }, [insertAtCursor]);

    return (
        <View style={styles.container}>
            {/* Toolbar */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.toolbar}
                contentContainerStyle={styles.toolbarContent}
            >
                <ToolbarButton icon="text" onPress={() => applyFormat('heading')} label="H" />
                <ToolbarButton icon="text-outline" onPress={() => applyFormat('bold')} label="B" bold />
                <ToolbarButton icon="text-outline" onPress={() => applyFormat('italic')} label="I" italic />
                <ToolbarButton icon="code-slash" onPress={() => applyFormat('code')} />
                <View style={styles.divider} />
                <ToolbarButton icon="list" onPress={() => applyFormat('bullet')} />
                <ToolbarButton icon="list-outline" onPress={() => applyFormat('number')} />
                <ToolbarButton icon="checkbox-outline" onPress={insertCheckbox} />
                <View style={styles.divider} />
                <ToolbarButton icon="link-outline" onPress={() => applyFormat('link')} />
                <ToolbarButton icon="remove-outline" onPress={insertDivider} />
            </ScrollView>

            {/* Editor */}
            <TextInput
                ref={inputRef}
                style={[styles.editor, { minHeight }]}
                value={value}
                onChangeText={onChange}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textSecondary}
                multiline
                textAlignVertical="top"
            />

            {/* Character count */}
            <Text style={styles.charCount}>{value.length} characters</Text>
        </View>
    );
}

interface ToolbarButtonProps {
    icon?: string;
    label?: string;
    bold?: boolean;
    italic?: boolean;
    onPress: () => void;
}

function ToolbarButton({ icon, label, bold, italic, onPress }: ToolbarButtonProps) {
    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={onPress}>
            {label ? (
                <Text style={[
                    styles.toolbarLabel,
                    bold && styles.boldLabel,
                    italic && styles.italicLabel,
                ]}>{label}</Text>
            ) : (
                <Ionicons name={icon as any} size={18} color={COLORS.textPrimary} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.m,
        backgroundColor: COLORS.card,
        overflow: 'hidden',
    },
    toolbar: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        maxHeight: 44,
    },
    toolbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.s,
        paddingVertical: SPACING.xs,
        gap: 2,
    },
    toolbarButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolbarLabel: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '400',
    },
    boldLabel: {
        fontWeight: '700',
    },
    italicLabel: {
        fontStyle: 'italic',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: COLORS.border,
        marginHorizontal: 4,
    },
    editor: {
        padding: SPACING.m,
        color: COLORS.textPrimary,
        fontSize: 16,
        lineHeight: 24,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    charCount: {
        textAlign: 'right',
        padding: SPACING.s,
        ...TYPOGRAPHY.small,
        color: COLORS.textSecondary,
    } as any,
});
