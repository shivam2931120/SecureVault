import { useState, useEffect } from 'react';
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVICON_CACHE_KEY = 'favicon_cache';

interface FaviconCache {
    [domain: string]: string | null;
}

let memoryCache: FaviconCache = {};

export function useFavicon(url: string | undefined) {
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!url) {
            setFaviconUrl(null);
            return;
        }

        const fetchFavicon = async () => {
            try {
                // Extract domain from URL
                let domain: string;
                try {
                    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                    domain = urlObj.hostname;
                } catch {
                    setFaviconUrl(null);
                    return;
                }

                // Check memory cache
                if (memoryCache[domain] !== undefined) {
                    setFaviconUrl(memoryCache[domain]);
                    return;
                }

                // Check persistent cache
                const cachedData = await AsyncStorage.getItem(FAVICON_CACHE_KEY);
                const cache: FaviconCache = cachedData ? JSON.parse(cachedData) : {};

                if (cache[domain] !== undefined) {
                    memoryCache[domain] = cache[domain];
                    setFaviconUrl(cache[domain]);
                    return;
                }

                // Fetch from Google's favicon service
                const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                // Verify the image loads
                Image.prefetch(googleFaviconUrl)
                    .then(() => {
                        memoryCache[domain] = googleFaviconUrl;
                        cache[domain] = googleFaviconUrl;
                        AsyncStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
                        setFaviconUrl(googleFaviconUrl);
                    })
                    .catch(() => {
                        memoryCache[domain] = null;
                        cache[domain] = null;
                        AsyncStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
                        setFaviconUrl(null);
                    });

            } catch (e) {
                console.log('Favicon fetch error', e);
                setFaviconUrl(null);
            }
        };

        fetchFavicon();
    }, [url]);

    return faviconUrl;
}

// Utility to get favicon URL directly (for non-hook usage)
export function getFaviconUrl(url: string): string {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
        return '';
    }
}
