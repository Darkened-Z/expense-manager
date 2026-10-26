/**
 * Biometric Authentication Service (WebAuthn / Windows Hello / Touch ID / Face ID)
 * Allows 1-touch biometric unlocking for mobile and desktop PWA users.
 */

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export const BiometricService = {
  /**
   * Check if the device hardware supports platform biometric verification (Touch ID / Face ID / Windows Hello)
   */
  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!window.PublicKeyCredential) return false;
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }

    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  },

  /**
   * Register a new biometric platform credential on this device
   */
  async register(): Promise<{ credentialId: string } | null> {
    if (!(await this.isAvailable())) {
      throw new Error('Biometric hardware is not available on this device.');
    }

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const userId = window.crypto.getRandomValues(new Uint8Array(16));
    const hostname = window.location.hostname || 'localhost';

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Expense Manager',
        id: hostname,
      },
      user: {
        id: userId,
        name: 'expense-user',
        displayName: 'Expense Manager User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    try {
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;

      if (!credential) return null;

      const credentialId = bufferToBase64(credential.rawId);
      return { credentialId };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Biometric prompt was cancelled or timed out.');
      }
      throw err;
    }
  },

  /**
   * Verify biometric identity against registered credential (or any platform authenticator)
   */
  async verify(credentialId?: string | null): Promise<boolean> {
    if (!(await this.isAvailable())) return false;

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const hostname = window.location.hostname || 'localhost';

    const publicKeyRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: hostname,
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: credentialId
        ? [
            {
              id: base64ToBuffer(credentialId),
              type: 'public-key',
              transports: ['internal'],
            },
          ]
        : undefined,
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyRequestOptions,
      });

      return !!assertion;
    } catch (err: any) {
      // User cancelled or biometric check failed
      console.warn('Biometric verification failed or cancelled:', err);
      return false;
    }
  },
};
