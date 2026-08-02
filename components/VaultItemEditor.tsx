'use client';

import { PageHeader } from './PageHeader';
import { SecureInput } from './SecureInput';
import { VaultItemFormData, WebVaultItemType } from '@/lib/vaultForm';
import { cn } from '@/lib/utils';

interface VaultItemEditorProps {
  mode: 'add' | 'edit';
  selectedType: WebVaultItemType;
  onTypeChange: (type: WebVaultItemType) => void;
  formData: VaultItemFormData;
  onInputChange: (field: keyof VaultItemFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
}

const types: { value: WebVaultItemType; label: string }[] = [
  { value: 'password', label: 'Password' },
  { value: 'note', label: 'Secure Note' },
  { value: 'card', label: 'Credit Card' },
  { value: 'apikey', label: 'API Key' },
  { value: 'identity', label: 'Identity' },
  { value: 'wifi', label: 'Wi-Fi' },
];

export function VaultItemEditor({
  mode,
  selectedType,
  onTypeChange,
  formData,
  onInputChange,
  onSubmit,
  onCancel,
  saving,
}: VaultItemEditorProps) {
  return (
    <div className="space-y-6 font-mono">
      <PageHeader
        eyebrow={`VAULT_OP // ${mode.toUpperCase()}`}
        title={mode === 'add' ? 'ADD_ENTRY' : 'EDIT_ENTRY'}
        description={mode === 'add' ? 'Create a new encrypted record in the local vault.' : 'Modify an existing encrypted record.'}
      />

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border border-border p-3 h-fit">
          <div className="text-[10px] text-muted uppercase tracking-widest mb-3 px-2">// item_type</div>
          <nav className="space-y-1">
            {types.map((type) => {
              const active = selectedType === type.value;
              return (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => onTypeChange(type.value)}
                  disabled={mode === 'edit'}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors',
                    active ? 'bg-primary/10 text-primary border-l-2 border-primary text-glow' : 'text-text-secondary border-l-2 border-transparent hover:text-primary hover:bg-primary/5',
                    mode === 'edit' && !active && 'opacity-30 cursor-not-allowed'
                  )}
                >
                  <span className="text-muted">{'>'}</span> {type.label.toUpperCase()}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="border border-border bg-background p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
                <span className="text-primary text-xs">┌──</span>
                <h2 className="text-xs font-bold text-primary uppercase tracking-wider text-glow">METADATA</h2>
                <span className="text-primary text-xs">──┐</span>
              </div>
              <SecureInput
                label="TITLE"
                value={formData.title}
                onChange={(val) => onInputChange('title', val)}
                placeholder="e.g. Production Database"
                required
                type="text"
              />

              {/* Dynamic Fields based on selectedType */}
              {selectedType === 'password' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <SecureInput
                      label="USERNAME / EMAIL"
                      value={formData.username}
                      onChange={(val) => onInputChange('username', val)}
                      placeholder="admin@example.com"
                      type="text"
                    />
                    <SecureInput
                      label="PASSWORD"
                      value={formData.password}
                      onChange={(val) => onInputChange('password', val)}
                      placeholder="••••••••"
                    />
                  </div>
                  <SecureInput
                    label="URL"
                    value={formData.url}
                    onChange={(val) => onInputChange('url', val)}
                    placeholder="https://..."
                    type="text"
                  />
                </>
              )}

              {selectedType === 'note' && (
                <div className="space-y-1.5">
                  <label className="block text-xs text-text-secondary uppercase tracking-wider">
                    <span className="text-muted">// </span>SECURE_NOTE
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => onInputChange('note', e.target.value)}
                    className="form-input min-h-[200px] resize-y"
                    placeholder="Enter private note..."
                  />
                </div>
              )}

              {selectedType === 'card' && (
                <>
                  <SecureInput
                    label="CARDHOLDER NAME"
                    value={formData.cardHolder}
                    onChange={(val) => onInputChange('cardHolder', val)}
                    placeholder="John Doe"
                    type="text"
                  />
                  <SecureInput
                    label="CARD NUMBER"
                    value={formData.cardNumber}
                    onChange={(val) => onInputChange('cardNumber', val)}
                    placeholder="•••• •••• •••• ••••"
                    type="text"
                  />
                  <div className="grid gap-4 grid-cols-2">
                    <SecureInput
                      label="EXPIRY"
                      value={formData.cardExpiry}
                      onChange={(val) => onInputChange('cardExpiry', val)}
                      placeholder="MM/YY"
                      type="text"
                    />
                    <SecureInput
                      label="CVV"
                      value={formData.cardCVV}
                      onChange={(val) => onInputChange('cardCVV', val)}
                      placeholder="•••"
                    />
                  </div>
                </>
              )}

              {selectedType === 'apikey' && (
                <>
                  <SecureInput
                    label="SERVICE"
                    value={formData.apiService}
                    onChange={(val) => onInputChange('apiService', val)}
                    placeholder="e.g. AWS"
                    type="text"
                  />
                  <SecureInput
                    label="API KEY"
                    value={formData.apiKey}
                    onChange={(val) => onInputChange('apiKey', val)}
                    placeholder="••••••••••••"
                  />
                </>
              )}

              {selectedType === 'identity' && (
                <>
                  <SecureInput
                    label="FULL NAME"
                    value={formData.fullName}
                    onChange={(val) => onInputChange('fullName', val)}
                    placeholder="John Doe"
                    type="text"
                  />
                  <SecureInput
                    label="EMAIL ADDRESS"
                    value={formData.emailAddress}
                    onChange={(val) => onInputChange('emailAddress', val)}
                    placeholder="john@example.com"
                    type="text"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <SecureInput
                      label="PHONE"
                      value={formData.phone}
                      onChange={(val) => onInputChange('phone', val)}
                      placeholder="+1..."
                      type="text"
                    />
                    <SecureInput
                      label="COMPANY"
                      value={formData.company}
                      onChange={(val) => onInputChange('company', val)}
                      placeholder="Acme Corp"
                      type="text"
                    />
                  </div>
                  <SecureInput
                    label="ADDRESS"
                    value={formData.address}
                    onChange={(val) => onInputChange('address', val)}
                    placeholder="123 Main St..."
                    type="text"
                  />
                </>
              )}

              {selectedType === 'wifi' && (
                <>
                  <SecureInput
                    label="SSID (NETWORK NAME)"
                    value={formData.ssid}
                    onChange={(val) => onInputChange('ssid', val)}
                    placeholder="MyNetwork"
                    type="text"
                  />
                  <SecureInput
                    label="NETWORK PASSWORD"
                    value={formData.networkPassword}
                    onChange={(val) => onInputChange('networkPassword', val)}
                    placeholder="••••••••"
                  />
                  <SecureInput
                    label="ROUTER IP (OPTIONAL)"
                    value={formData.routerIp}
                    onChange={(val) => onInputChange('routerIp', val)}
                    placeholder="192.168.1.1"
                    type="text"
                  />
                </>
              )}

              <SecureInput
                label="TAGS (COMMA SEPARATED)"
                value={formData.tags}
                onChange={(val) => onInputChange('tags', val)}
                placeholder="work, prod, db"
                type="text"
              />
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={onCancel} className="btn-secondary">
                [ ABORT ]
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? '[ ENCRYPTING... ]' : '[ COMMIT_RECORD ]'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default VaultItemEditor;
