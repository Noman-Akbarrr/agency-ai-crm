import * as dns from "node:dns"
import { promisify } from "node:util"

const resolveMx = promisify(dns.resolveMx)

/**
 * Role-account email prefixes to block during local hygiene filtering.
 * These are generic mailboxes, not individual decision-makers.
 */
export const ROLE_PREFIXES = [
  "noreply",
  "donotreply",
  "billing",
  "abuse",
  "webmaster",
  "admin",
  "support",
  "info",
  "sales",
  "help",
  "postmaster",
  "hostmaster",
  "usenet",
  "uucp",
]

/**
 * Maps US state / territory postal codes to IANA timezone strings.
 * Used during CSV import to auto-set Company.timezone.
 */
export const US_STATE_TIMEZONES: Record<string, string> = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "America/Honolulu",
  ID: "America/Denver",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  IA: "America/Chicago",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  MT: "America/Denver",
  NE: "America/Chicago",
  NV: "America/Los_Angeles",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NY: "America/New_York",
  NC: "America/New_York",
  ND: "America/Chicago",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  PR: "America/Puerto_Rico",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VT: "America/New_York",
  VI: "America/St_Thomas",
  VA: "America/New_York",
  WA: "America/Los_Angeles",
  WV: "America/New_York",
  WI: "America/Chicago",
  WY: "America/Denver",
} as const

/**
 * Look up a timezone by US state postal code. Falls back to America/New_York.
 */
export function getTimezoneForState(state?: string | null): string {
  if (!state) return "America/New_York"
  const normalized = state.trim().toUpperCase()
  return US_STATE_TIMEZONES[normalized] ?? "America/New_York"
}

/**
 * Check if an email uses a blocked role-account prefix.
 */
export function isRoleAccount(email: string): boolean {
  const localPart = email.split("@")[0]?.toLowerCase() ?? ""
  return ROLE_PREFIXES.some((prefix) => localPart.startsWith(prefix))
}

/**
 * Basic regex syntax validation for an email address.
 */
export function isValidEmailSyntax(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Stage 1 local hygiene check: syntax + role account + DNS MX lookup.
 * Returns the verification status and whether MX records were found.
 * Zero cost — no external API calls.
 */
export async function runLocalHygiene(email: string): Promise<{
  status: "VALID_SYNTAX" | "INVALID_SYNTAX" | "ROLE_ACCOUNT"
  mxRecordsFound: boolean
  verificationStatus: "LOCAL_MX_PASSED" | "INVALID"
}> {
  // 1. Syntax check
  if (!isValidEmailSyntax(email)) {
    return {
      status: "INVALID_SYNTAX",
      mxRecordsFound: false,
      verificationStatus: "INVALID",
    }
  }

  // 2. Role account check
  if (isRoleAccount(email)) {
    return {
      status: "ROLE_ACCOUNT",
      mxRecordsFound: false,
      verificationStatus: "INVALID",
    }
  }

  // 3. DNS MX lookup
  const domain = email.split("@")[1] ?? ""
  try {
    const mxRecords = await resolveMx(domain)
    if (mxRecords.length === 0) {
      return {
        status: "VALID_SYNTAX",
        mxRecordsFound: false,
        verificationStatus: "INVALID",
      }
    }
    return {
      status: "VALID_SYNTAX",
      mxRecordsFound: true,
      verificationStatus: "LOCAL_MX_PASSED",
    }
  } catch {
    // DNS error (NXDOMAIN, no MX, etc.) → treat as invalid
    return {
      status: "VALID_SYNTAX",
      mxRecordsFound: false,
      verificationStatus: "INVALID",
    }
  }
}