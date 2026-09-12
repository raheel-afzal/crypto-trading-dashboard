import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): boolean {
  const [salt, key] = passwordHash.split(":");
  const expected = Buffer.from(key, "hex");
  return timingSafeEqual(
    scryptSync(password, Buffer.from(salt, "hex"), expected.length),
    expected,
  );
}

// Demo accounts, hashed on boot. A real deployment would read them from a database.
export const USERS: User[] = [
  {
    id: "demo",
    email: "demo@trading.dev",
    name: "Demo Trader",
    passwordHash: hashPassword("demo1234"),
  },
  {
    id: "alex",
    email: "alex@trading.dev",
    name: "Alex Chen",
    passwordHash: hashPassword("alex1234"),
  },
];
