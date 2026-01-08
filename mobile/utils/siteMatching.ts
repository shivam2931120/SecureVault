/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
    try {
        // Add protocol if missing
        let fullUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            fullUrl = 'https://' + url;
        }

        const urlObj = new URL(fullUrl);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return null;
    }
}

/**
 * Check if two URLs match for autofill purposes
 */
export function urlsMatch(url1: string, url2: string): boolean {
    const domain1 = extractDomain(url1);
    const domain2 = extractDomain(url2);

    if (!domain1 || !domain2) return false;

    // Exact match
    if (domain1 === domain2) return true;

    // Check if one is subdomain of other
    if (domain1.endsWith('.' + domain2) || domain2.endsWith('.' + domain1)) {
        return true;
    }

    return false;
}

/**
 * Common domain equivalents (e.g., google.com = accounts.google.com = mail.google.com)
 */
const DOMAIN_GROUPS: Record<string, string[]> = {
    'google.com': ['accounts.google.com', 'mail.google.com', 'drive.google.com', 'docs.google.com'],
    'microsoft.com': ['login.microsoft.com', 'outlook.com', 'live.com', 'office.com'],
    'apple.com': ['icloud.com', 'appleid.apple.com'],
    'amazon.com': ['amazon.in', 'amazon.co.uk', 'amazon.de', 'aws.amazon.com'],
    'facebook.com': ['fb.com', 'messenger.com', 'instagram.com'],
};

/**
 * Find matching vault items for a given URL
 */
export function findMatchingItems<T extends { decrypted?: { url?: string } }>(
    items: T[],
    currentUrl: string
): T[] {
    const currentDomain = extractDomain(currentUrl);
    if (!currentDomain) return [];

    // First pass: exact domain match
    const exactMatches = items.filter(item => {
        const itemUrl = item.decrypted?.url;
        if (!itemUrl) return false;
        return extractDomain(itemUrl) === currentDomain;
    });

    if (exactMatches.length > 0) return exactMatches;

    // Second pass: subdomain match
    const subdomainMatches = items.filter(item => {
        const itemUrl = item.decrypted?.url;
        if (!itemUrl) return false;
        return urlsMatch(itemUrl, currentUrl);
    });

    if (subdomainMatches.length > 0) return subdomainMatches;

    // Third pass: domain group match
    let groupRoot: string | null = null;
    for (const [root, group] of Object.entries(DOMAIN_GROUPS)) {
        if (currentDomain === root || group.includes(currentDomain)) {
            groupRoot = root;
            break;
        }
    }

    if (groupRoot) {
        const group = DOMAIN_GROUPS[groupRoot];
        return items.filter(item => {
            const itemUrl = item.decrypted?.url;
            if (!itemUrl) return false;
            const itemDomain = extractDomain(itemUrl);
            return itemDomain === groupRoot || (itemDomain && group.includes(itemDomain));
        });
    }

    return [];
}

/**
 * Score how well a vault item matches a URL (higher = better)
 */
export function matchScore(itemUrl: string | undefined, targetUrl: string): number {
    if (!itemUrl) return 0;

    const itemDomain = extractDomain(itemUrl);
    const targetDomain = extractDomain(targetUrl);

    if (!itemDomain || !targetDomain) return 0;

    // Exact match
    if (itemDomain === targetDomain) return 100;

    // Same root domain
    const itemRoot = itemDomain.split('.').slice(-2).join('.');
    const targetRoot = targetDomain.split('.').slice(-2).join('.');
    if (itemRoot === targetRoot) return 80;

    // Domain group match
    for (const [root, group] of Object.entries(DOMAIN_GROUPS)) {
        const itemInGroup = itemDomain === root || group.includes(itemDomain);
        const targetInGroup = targetDomain === root || group.includes(targetDomain);
        if (itemInGroup && targetInGroup) return 60;
    }

    return 0;
}
