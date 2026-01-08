import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmergencyContact {
    id: string;
    name: string;
    email: string;
    waitPeriodDays: number; // How long to wait before granting access
    status: 'pending' | 'active' | 'revoked';
    createdAt: string;
    lastRequestAt?: string;
    accessGrantedAt?: string;
}

export interface EmergencyAccessRequest {
    contactId: string;
    requestedAt: string;
    accessGrantedAt?: string;
    status: 'waiting' | 'granted' | 'denied' | 'expired';
}

const CONTACTS_KEY = 'emergency_contacts';
const REQUESTS_KEY = 'emergency_requests';

/**
 * Add an emergency contact
 */
export async function addEmergencyContact(
    name: string,
    email: string,
    waitPeriodDays: number = 7
): Promise<EmergencyContact> {
    const stored = await AsyncStorage.getItem(CONTACTS_KEY);
    const contacts: EmergencyContact[] = stored ? JSON.parse(stored) : [];

    const newContact: EmergencyContact = {
        id: `ec_${Date.now()}`,
        name,
        email,
        waitPeriodDays,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    contacts.push(newContact);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));

    // TODO: Send email invitation to the contact

    return newContact;
}

/**
 * Get all emergency contacts
 */
export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
    const stored = await AsyncStorage.getItem(CONTACTS_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Remove an emergency contact
 */
export async function removeEmergencyContact(contactId: string): Promise<void> {
    const stored = await AsyncStorage.getItem(CONTACTS_KEY);
    if (!stored) return;

    const contacts: EmergencyContact[] = JSON.parse(stored);
    const updated = contacts.filter(c => c.id !== contactId);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
}

/**
 * Request emergency access (called by contact)
 */
export async function requestEmergencyAccess(contactId: string): Promise<EmergencyAccessRequest> {
    const stored = await AsyncStorage.getItem(REQUESTS_KEY);
    const requests: EmergencyAccessRequest[] = stored ? JSON.parse(stored) : [];

    const newRequest: EmergencyAccessRequest = {
        contactId,
        requestedAt: new Date().toISOString(),
        status: 'waiting',
    };

    requests.push(newRequest);
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));

    // TODO: Send notification to vault owner

    return newRequest;
}

/**
 * Check if any emergency access request should be granted
 */
export async function checkEmergencyAccessRequests(): Promise<EmergencyAccessRequest[]> {
    const contactsStored = await AsyncStorage.getItem(CONTACTS_KEY);
    const requestsStored = await AsyncStorage.getItem(REQUESTS_KEY);

    if (!contactsStored || !requestsStored) return [];

    const contacts: EmergencyContact[] = JSON.parse(contactsStored);
    const requests: EmergencyAccessRequest[] = JSON.parse(requestsStored);

    const now = new Date();
    const grantedRequests: EmergencyAccessRequest[] = [];

    for (const request of requests) {
        if (request.status !== 'waiting') continue;

        const contact = contacts.find(c => c.id === request.contactId);
        if (!contact || contact.status !== 'active') continue;

        const requestDate = new Date(request.requestedAt);
        const waitMs = contact.waitPeriodDays * 24 * 60 * 60 * 1000;

        if (now.getTime() - requestDate.getTime() >= waitMs) {
            request.status = 'granted';
            request.accessGrantedAt = now.toISOString();
            grantedRequests.push(request);
        }
    }

    if (grantedRequests.length > 0) {
        await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    }

    return grantedRequests;
}

/**
 * Deny an emergency access request
 */
export async function denyEmergencyAccess(contactId: string): Promise<void> {
    const stored = await AsyncStorage.getItem(REQUESTS_KEY);
    if (!stored) return;

    const requests: EmergencyAccessRequest[] = JSON.parse(stored);
    const updated = requests.map(r =>
        r.contactId === contactId && r.status === 'waiting'
            ? { ...r, status: 'denied' as const }
            : r
    );
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
}
