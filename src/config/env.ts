import 'dotenv/config';

/**
 * Centralised, validated access to environment configuration.
 *
 * Secrets (credentials, base URL) are read from the environment — never hardcoded in
 * source or step definitions. If a required variable is missing we fail loud with a
 * clear message rather than running with a silent, wrong default.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export const env = {
  baseUrl: required('BASE_URL'),
  standardUser: required('STANDARD_USER'),
  standardPassword: required('STANDARD_PASSWORD'),
} as const;
