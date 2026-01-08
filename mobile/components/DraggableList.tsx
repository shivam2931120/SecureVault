import React, { useCallback, useRef, useState } from 'react';
import {
    View,
    PanResponder,
    Animated,
    StyleSheet,
    LayoutChangeEvent,
} from 'react-native';
import { COLORS, SPACING } from '@/theme';

interface DraggableListProps<T> {
    data: T[];
    keyExtractor: (item: T) => string;
    renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
    onReorder: (data: T[]) => void;
    itemHeight: number;
}

export function DraggableList<T>({
    data,
    keyExtractor,
    renderItem,
    onReorder,
    itemHeight,
}: DraggableListProps<T>) {
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dataState, setDataState] = useState(data);
    const positions = useRef<{ [key: string]: Animated.ValueXY }>({}).current;
    const containerY = useRef(0);

    // Initialize positions for each item
    data.forEach((item) => {
        const key = keyExtractor(item);
        if (!positions[key]) {
            positions[key] = new Animated.ValueXY();
        }
    });

    const handleLayout = (event: LayoutChangeEvent) => {
        containerY.current = event.nativeEvent.layout.y;
    };

    const createPanResponder = (index: number, key: string) => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                setDraggingIndex(index);
            },

            onPanResponderMove: (_, gestureState) => {
                positions[key].setValue({ x: 0, y: gestureState.dy });

                // Calculate new index based on position
                const newIndex = Math.round(gestureState.dy / itemHeight) + index;
                if (newIndex >= 0 && newIndex < dataState.length && newIndex !== index) {
                    // Swap items
                    const newData = [...dataState];
                    const item = newData.splice(index, 1)[0];
                    newData.splice(newIndex, 0, item);
                    setDataState(newData);
                }
            },

            onPanResponderRelease: () => {
                positions[key].flattenOffset();
                Animated.spring(positions[key], {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
                setDraggingIndex(null);
                onReorder(dataState);
            },
        });
    };

    return (
        <View style={styles.container} onLayout={handleLayout}>
            {dataState.map((item, index) => {
                const key = keyExtractor(item);
                const panResponder = createPanResponder(index, key);
                const isDragging = draggingIndex === index;

                return (
                    <Animated.View
                        key={key}
                        style={[
                            styles.item,
                            {
                                height: itemHeight,
                                transform: positions[key].getTranslateTransform(),
                                zIndex: isDragging ? 100 : 1,
                                opacity: isDragging ? 0.9 : 1,
                            },
                            isDragging && styles.draggingItem,
                        ]}
                        {...panResponder.panHandlers}
                    >
                        {renderItem(item, index, isDragging)}
                    </Animated.View>
                );
            })}
        </View>
    );
}

/**
 * Simple hook for managing reorderable list state
 */
export function useReorderableList<T>(initialData: T[]) {
    const [data, setData] = useState(initialData);

    const reorder = useCallback((fromIndex: number, toIndex: number) => {
        setData(prevData => {
            const newData = [...prevData];
            const [removed] = newData.splice(fromIndex, 1);
            newData.splice(toIndex, 0, removed);
            return newData;
        });
    }, []);

    const moveUp = useCallback((index: number) => {
        if (index > 0) {
            reorder(index, index - 1);
        }
    }, [reorder]);

    const moveDown = useCallback((index: number, length: number) => {
        if (index < length - 1) {
            reorder(index, index + 1);
        }
    }, [reorder]);

    const moveToTop = useCallback((index: number) => {
        if (index > 0) {
            reorder(index, 0);
        }
    }, [reorder]);

    const moveToBottom = useCallback((index: number, length: number) => {
        if (index < length - 1) {
            reorder(index, length - 1);
        }
    }, [reorder]);

    return {
        data,
        setData,
        reorder,
        moveUp,
        moveDown,
        moveToTop,
        moveToBottom,
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    item: {
        backgroundColor: COLORS.card,
        marginBottom: SPACING.s,
    },
    draggingItem: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
