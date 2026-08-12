import crypto from "crypto";
import fs from "fs";

const localEnvPath = new URL("../.env", import.meta.url);
if (fs.existsSync(localEnvPath)) {
  for (const line of fs.readFileSync(localEnvPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const secret = () => process.env.ADMIN_TOKEN_SECRET;
const password = () => process.env.ADMIN_PASSWORD;
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

export const isAdminConfigured = () => Boolean(password() && secret());

export const validPassword = (value) => {
  if (!isAdminConfigured() || typeof value !== "string") return false;
  const expected = Buffer.from(password());
  const received = Buffer.from(value);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const createToken = () => {
  const payload = encode({ role: "admin", exp: Date.now() + 8 * 60 * 60 * 1000 });
  const signature = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};

export const requireAdmin = (request, response, next) => {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!isAdminConfigured() || !token) return response.status(401).json({ error: "Não autorizado." });
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return response.status(401).json({ error: "Sessão inválida." });
  try {
    if (JSON.parse(Buffer.from(payload, "base64url").toString()).exp < Date.now()) throw new Error();
    next();
  } catch { return response.status(401).json({ error: "Sessão expirada." }); }
};
