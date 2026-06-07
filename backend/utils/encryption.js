const crypto = require('crypto');

// AES-256-GCM encryption for sensitive data (e.g., Razorpay key_secret)
// Uses JWT_SECRET as the base for deriving the encryption key

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 32-byte encryption key.
 * 
 * Priority:
 * 1. ENCRYPTION_KEY env var — dedicated key, independent of JWT_SECRET
 * 2. JWT_SECRET — backward-compatible fallback (for existing deployments)
 * 
 * IMPORTANT: Once you set ENCRYPTION_KEY in production, never change it
 * without re-encrypting all stored secrets. Rotating JWT_SECRET alone is now safe.
 */
const getEncryptionKey = () => {
    const keySource = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!keySource) throw new Error('ENCRYPTION_KEY (or JWT_SECRET as fallback) is required for encryption');
    return crypto.createHash('sha256').update(keySource).digest();
};

/**
 * Encrypt a plaintext string
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - Encrypted string in format: iv:authTag:ciphertext (all hex)
 */
const encrypt = (text) => {
    if (!text) return null;
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - The encrypted string (iv:authTag:ciphertext)
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (encryptedText) => {
    if (!encryptedText) return null;
    
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted text format');
    
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};

module.exports = { encrypt, decrypt };
