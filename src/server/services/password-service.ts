import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function derivePasswordKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, scryptOptions, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
}

// scrypt is a Node built-in. The salt is unique for every password.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derivePasswordKey(password, salt);
  return 'scrypt:' + salt + ':' + key.toString('hex');
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, encodedKey] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !encodedKey) return false;

  const key = await derivePasswordKey(password, salt);
  const expected = Buffer.from(encodedKey, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
