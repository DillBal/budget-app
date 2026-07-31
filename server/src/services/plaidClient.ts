import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { config } from "../config";

const configuration = new Configuration({
  basePath: PlaidEnvironments[config.plaid.env as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": config.plaid.clientId,
      "PLAID-SECRET": config.plaid.secret,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
