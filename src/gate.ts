import { describe, it, expect } from "vitest";
import { Pool } from "pg";

// S2068: hard-coded credential-like value
const password = "admin123456";

// S2245: use of non-cryptographic randomness for security-sensitive values
function generateResetToken(): number {
  return Math.random();
}

// S4784: regular expression with potentially excessive backtracking
const unsafePattern = /^(a+)+$/;

// S5852: regex can cause excessive backtracking
function validateInput(value: string): boolean {
  return unsafePattern.test(value);
}

// S3776: high cognitive complexity
function processUser(
  user: any,
  isAdmin: boolean,
  enabled: boolean,
  mode: string,
): string {
  let result = "";

  if (user) {
    if (enabled) {
      if (isAdmin) {
        if (mode === "full") {
          result = user.name || "unknown";
        } else if (mode === "partial") {
          result = user.email || "missing";
        } else {
          result = "invalid mode";
        }
      } else if (user.active) {
        result = user.name || "anonymous";
      } else {
        result = "inactive";
      }
    }
  }

  return result;
}

// SQL injection: user input concatenated into a query
async function unsafeDatabaseSearch(search: string) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const sql = "SELECT * FROM links WHERE original_url = '" + search + "'";
    return await pool.query(sql);
  } finally {
    await pool.end();
  }
}

// S108: empty catch block
function parseJsonUnsafe(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    // Intentionally empty for analyzer testing
  }

  return null;
}

// S1481: unused variable
function unusedVariableExample(): number {
  const unusedSecret = "never-used";
  const result = 10;
  return result;
}

// S4144: duplicated function logic
function calculateTotalA(a: number, b: number): number {
  return a + b;
}

function calculateTotalB(a: number, b: number): number {
  return a + b;
}

// S4325: unnecessary type assertion
function getLength(value: string): number {
  return (value as string).length;
}

// S1116: unnecessary empty statement
function emptyStatementExample(): number {
  const value = 5;
  return value;
}

// S1854: useless assignment
function uselessAssignment(): number {
  let value = 1;
  value = 2;
  return value;
}

describe("SonarCloud security and code quality probes", () => {
  it("uses a hard-coded credential-like value", () => {
    expect(password).toBe("admin123456");
  });

  it("uses Math.random for a token", () => {
    expect(generateResetToken()).toBeGreaterThanOrEqual(0);
  });

  it("runs a potentially expensive regular expression", () => {
    expect(validateInput("aaaa")).toBe(true);
  });

  it("processes nested conditions", () => {
    expect(
      processUser({ name: "Test", active: true }, true, true, "full"),
    ).toBe("Test");
  });

  it("parses invalid JSON without reporting the error", () => {
    expect(parseJsonUnsafe("{invalid")).toBeNull();
  });

  it("runs duplicated calculation logic", () => {
    expect(calculateTotalA(2, 3)).toBe(5);
    expect(calculateTotalB(2, 3)).toBe(5);
  });

  it("contains redundant assignments and assertions", () => {
    expect(getLength("hello")).toBe(5);
    expect(emptyStatementExample()).toBe(5);
    expect(uselessAssignment()).toBe(2);
  });

  it("keeps database search isolated from application routes", async () => {
    // No real database connection is made in this test.
    expect(typeof unsafeDatabaseSearch).toBe("function");
  });
});
