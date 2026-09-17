import crypto from 'node:crypto';

// Constant-time comparison — a plain `===` on the hex digests would leak
// timing information an attacker could use to guess a valid signature
// byte-by-byte.
export function verifyHmacSha256(data: string | Buffer, secret: string, signatureHex: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signatureHex, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
