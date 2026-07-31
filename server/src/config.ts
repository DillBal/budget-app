import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID ?? "",
    secret: process.env.PLAID_SECRET ?? "",
    env: process.env.PLAID_ENV ?? "sandbox",
    products: (process.env.PLAID_PRODUCTS ?? "transactions").split(","),
    countryCodes: (process.env.PLAID_COUNTRY_CODES ?? "US").split(","),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    fromEmail: process.env.ALERT_FROM_EMAIL ?? "alerts@yourbudgetapp.com",
  },
};
