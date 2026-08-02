import { DecryptedVaultItem, VaultItemType } from '@/types';
import { parseTags } from '@/lib/vault';

export type WebVaultItemType = Extract<VaultItemType, 'password' | 'note' | 'card' | 'apikey' | 'identity' | 'wifi'>;

export interface VaultItemFormData {
  title: string;
  username: string;
  password: string;
  url: string;
  note: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVV: string;
  cardHolder: string;
  apiKey: string;
  apiService: string;
  fullName: string;
  emailAddress: string;
  phone: string;
  address: string;
  company: string;
  ssid: string;
  networkPassword: string;
  routerIp: string;
  tags: string;
}

export const emptyVaultItemFormData: VaultItemFormData = {
  title: '',
  username: '',
  password: '',
  url: '',
  note: '',
  cardNumber: '',
  cardExpiry: '',
  cardCVV: '',
  cardHolder: '',
  apiKey: '',
  apiService: '',
  fullName: '',
  emailAddress: '',
  phone: '',
  address: '',
  company: '',
  ssid: '',
  networkPassword: '',
  routerIp: '',
  tags: '',
};

export function validateVaultItemForm(
  selectedType: WebVaultItemType,
  formData: VaultItemFormData
): string | null {
  if (!formData.title.trim()) {
    return 'Please enter a title';
  }

  if (selectedType === 'password' && !formData.password) {
    return 'Please enter a password';
  }

  if (selectedType === 'note' && !formData.note.trim()) {
    return 'Please enter a secure note';
  }

  if (selectedType === 'card') {
    if (!formData.cardNumber.trim()) {
      return 'Please enter a card number';
    }

    if (formData.cardExpiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.cardExpiry.trim())) {
      return 'Expiry date must use MM/YY format';
    }

    if (formData.cardCVV && !/^\d{3,4}$/.test(formData.cardCVV.trim())) {
      return 'CVV must be 3 or 4 digits';
    }
  }

  if (selectedType === 'apikey' && !formData.apiKey) {
    return 'Please enter an API key';
  }

  if (selectedType === 'wifi' && !formData.networkPassword) {
    return 'Please enter a network password';
  }

  return null;
}

export function buildVaultItemData(
  selectedType: WebVaultItemType,
  formData: VaultItemFormData
): Record<string, unknown> {
  const itemData: Record<string, unknown> = {
    title: formData.title.trim(),
    itemType: selectedType,
    tags: parseTags(formData.tags),
  };

  switch (selectedType) {
    case 'password':
      itemData.username = formData.username.trim();
      itemData.password = formData.password;
      itemData.url = formData.url.trim();
      break;
    case 'note':
      itemData.note = formData.note.trim();
      break;
    case 'card':
      itemData.cardNumber = formData.cardNumber.trim();
      itemData.cardExpiry = formData.cardExpiry.trim();
      itemData.cardCVV = formData.cardCVV.trim();
      itemData.cardHolder = formData.cardHolder.trim();
      break;
    case 'apikey':
      itemData.apiKey = formData.apiKey;
      itemData.apiService = formData.apiService.trim();
      break;
    case 'identity':
      itemData.fullName = formData.fullName.trim();
      itemData.emailAddress = formData.emailAddress.trim();
      itemData.phone = formData.phone.trim();
      itemData.address = formData.address.trim();
      itemData.company = formData.company.trim();
      break;
    case 'wifi':
      itemData.ssid = formData.ssid.trim();
      itemData.networkPassword = formData.networkPassword;
      itemData.routerIp = formData.routerIp.trim();
      break;
  }

  return itemData;
}

export function formDataFromVaultItem(item: DecryptedVaultItem): VaultItemFormData {
  return {
    title: item.title ?? '',
    username: item.username ?? '',
    password: item.password ?? '',
    url: item.url ?? '',
    note: item.note ?? '',
    cardNumber: item.cardNumber ?? '',
    cardExpiry: item.cardExpiry ?? '',
    cardCVV: item.cardCVV ?? '',
    cardHolder: item.cardHolder ?? '',
    apiKey: item.apiKey ?? '',
    apiService: item.apiService ?? '',
    fullName: item.fullName ?? '',
    emailAddress: item.emailAddress ?? '',
    phone: item.phone ?? '',
    address: item.address ?? '',
    company: item.company ?? '',
    ssid: item.ssid ?? '',
    networkPassword: item.networkPassword ?? '',
    routerIp: item.routerIp ?? '',
    tags: item.tags?.join(', ') ?? '',
  };
}

export function toDecryptedVaultItem(
  id: string,
  selectedType: WebVaultItemType,
  formData: VaultItemFormData,
  createdAt: string,
  updatedAt: string
): DecryptedVaultItem {
  const itemData = buildVaultItemData(selectedType, formData);

  return {
    ...itemData,
    id,
    itemType: selectedType,
    title: String(itemData.title),
    tags: itemData.tags as string[],
    createdAt,
    updatedAt,
  } as DecryptedVaultItem;
}
