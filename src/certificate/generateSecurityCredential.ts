import crypto from "crypto";

//nitiator password
const initiatorPassword = "Safaricom123!!";

// Official Daraja sandbox public key 
const pubKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArw6rPlgIidKztP0ovl5q
+vM6YlyvXQ6tFbhc5w7Z7F6FjkC+xkHbwCNY9Ezg3+4nx/5m5t0D+b2qjJpP8OiJ
Lx7Hk+u4F3CkW3H9dR49vEeJ5hQ3k0OYpAzR+5Z+vHpmA5H+nQlwXYB0i0WJJ1kh
b8qThtEwruwvzH1r6+z2x4OPKHoj7yzD2c1+6+gzWxX9rktCvjC0pF4k6b0xBq2G
G5F5lYshD7cXH1ZVj4I2p7KQaJcB+5FlJ1+Sg3K0y5/GcPT9R2pP1TgCV3Yd1uFc
j0hT4yYpoeO3+1rVtMiB7w9g3DPHJdQpQ8wXgu43jE+Iz8qH6kl6Z3c2uJHrcD0X
qwIDAQAB
-----END PUBLIC KEY-----`;

// Convert password to a buffer
const buffer = Buffer.from(initiatorPassword, "utf-8");

// Encrypt the password using the sandbox public key
const encrypted = crypto.publicEncrypt(
  {
    key: pubKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  },
  buffer
);

// Convert the encrypted buffer to base64 
const securityCredential = encrypted.toString("base64");

// Output the result
console.log("MPESA_SECURITY_CREDENTIAL:");
console.log(securityCredential);
