import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useIntruderStore } from '@/store/intruderStore';

export interface IntruderCaptureRef {
    capture: () => Promise<void>;
}

export const IntruderCapture = forwardRef<IntruderCaptureRef, {}>((props, ref) => {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const { addIntruder } = useIntruderStore();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    useImperativeHandle(ref, () => ({
        capture: async () => {
            if (!cameraRef.current || !permission?.granted) return;

            try {
                // Wait a tiny bit to ensure camera is ready
                if (!ready) {
                    // small retry or just fail silently
                }

                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    skipProcessing: true,
                    shutterSound: false,
                });

                if (photo) {
                    // Move to permanent storage
                    const fileName = `intruder_${Date.now()}.jpg`;
                    const newPath = `${FileSystem.documentDirectory}${fileName}`;

                    await FileSystem.moveAsync({
                        from: photo.uri,
                        to: newPath
                    });

                    await addIntruder(newPath);
                }
            } catch (e) {
                console.error('Intruder capture failed', e);
            }
        }
    }));

    if (!permission || !permission.granted) return null;

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="front"
                onCameraReady={() => setReady(true)}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 1,
        height: 1,
        overflow: 'hidden',
        opacity: 0.01, // Almost invisible but rendered
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: -100, // Behind everything
    },
    camera: {
        width: 100, // Needs some size to work usually
        height: 100,
    }
});
