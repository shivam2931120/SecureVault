import { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Hook for fade in/out animations
 */
export function useFadeAnimation(visible: boolean, duration: number = 200) {
    const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    }, [visible, duration]);

    return opacity;
}

/**
 * Hook for scale animations (press feedback)
 */
export function useScaleAnimation(initialScale: number = 1) {
    const scale = useRef(new Animated.Value(initialScale)).current;

    const onPressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    }, []);

    const onPressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, []);

    return { scale, onPressIn, onPressOut };
}

/**
 * Hook for slide in animations
 */
export function useSlideAnimation(
    visible: boolean,
    direction: 'left' | 'right' | 'up' | 'down' = 'up',
    distance: number = 50,
    duration: number = 300
) {
    const getInitialValue = () => {
        switch (direction) {
            case 'left': return distance;
            case 'right': return -distance;
            case 'up': return distance;
            case 'down': return -distance;
        }
    };

    const translateValue = useRef(new Animated.Value(visible ? 0 : getInitialValue())).current;
    const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateValue, {
                toValue: visible ? 0 : getInitialValue(),
                duration,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: visible ? 1 : 0,
                duration: duration * 0.8,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, duration]);

    const transform = direction === 'left' || direction === 'right'
        ? [{ translateX: translateValue }]
        : [{ translateY: translateValue }];

    return { transform, opacity };
}

/**
 * Hook for staggered list item animations
 */
export function useStaggerAnimation(itemCount: number, delay: number = 50) {
    const animations = useRef<Animated.Value[]>([]).current;

    // Initialize animations for each item
    useEffect(() => {
        while (animations.length < itemCount) {
            animations.push(new Animated.Value(0));
        }
    }, [itemCount]);

    const startAnimation = useCallback(() => {
        const staggerAnimations = animations.slice(0, itemCount).map((anim, index) => {
            anim.setValue(0);
            return Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                delay: index * delay,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            });
        });

        Animated.stagger(delay, staggerAnimations).start();
    }, [itemCount, delay]);

    const getItemStyle = useCallback((index: number) => {
        if (!animations[index]) return {};

        return {
            opacity: animations[index],
            transform: [{
                translateY: animations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                }),
            }],
        };
    }, [animations]);

    return { startAnimation, getItemStyle };
}

/**
 * Hook for shake animation (error feedback)
 */
export function useShakeAnimation() {
    const translateX = useRef(new Animated.Value(0)).current;

    const shake = useCallback(() => {
        Animated.sequence([
            Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    }, []);

    return { translateX, shake };
}

/**
 * Hook for pulse animation (attention grabbing)
 */
export function usePulseAnimation(active: boolean = false) {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (active) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scale, { toValue: 1.05, duration: 500, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            scale.setValue(1);
        }
    }, [active]);

    return scale;
}

/**
 * Hook for rotation animation (loading spinner)
 */
export function useRotationAnimation(active: boolean = true) {
    const rotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (active) {
            Animated.loop(
                Animated.timing(rotation, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            rotation.setValue(0);
        }
    }, [active]);

    const rotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return rotate;
}
