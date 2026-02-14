
export const decryptKey = (encryptedKey: string): string => {
  // 1. Sanitize Input
  const cleanKey = encryptedKey ? encryptedKey.trim().replace(/^["']|["']$/g, '') : '';

  // 2. Check for Empty State
  if (!cleanKey) {
    throw new Error("ERR_SECURE_VOID: API Key input is missing or empty.");
  }

  // 3. Direct Pass-through for known Raw Key formats
  // Gemini keys start with 'AIza', Anthropic/OpenAI often start with 'sk-'
  if (cleanKey.startsWith('AIza') || cleanKey.startsWith('sk-') || cleanKey.startsWith('gsk_')) {
    return cleanKey;
  }

  try {
    // 4. Attempt Decryption (Base64 Decode -> Reverse)
    // This supports the obfuscated format if used
    const decoded = atob(cleanKey);
    return decoded.split('').reverse().join('');
  } catch (e: any) {
    // 5. Fallback: If decoding fails, assume it's a raw key that didn't match the prefix check
    // This prevents the app from crashing if a user pastes a raw key that isn't base64 valid
    console.warn("FRIDAY_SECURE: Decryption failed, using raw key.");
    return cleanKey;
  }
};
