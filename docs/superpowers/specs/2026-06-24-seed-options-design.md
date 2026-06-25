# Database Seeding and Schema Control Options

Adding options to control the database seeding process:
1. Recreating the database schema and seeding it with mock data (`seed`).
2. Recreating the database schema and clearing all existing data without inserting seed data (`seed --schema-only`).

## Proposed Changes

### Scripts

#### [MODIFY] [seed.ts](file:///home/tie/Projects/knpos/scripts/seed.ts)
- Parse process arguments to detect `--schema-only`:
  ```typescript
  const isSchemaOnly = process.argv.includes('--schema-only');
  ```
- Modify the `run()` function to terminate early after D1 schema execution if `isSchemaOnly` is `true`:
  ```typescript
  console.log(`Resetting ${envLabel} D1 database schema...`);
  execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./schema.sql`, { stdio: 'inherit' });

  if (isSchemaOnly) {
    console.log(`Database schema recreated and all data cleared for ${envLabel}.`);
    return;
  }
  ```

---

### Project Configuration

#### [MODIFY] [package.json](file:///home/tie/Projects/knpos/package.json)
- Add a new `"seed"` script under `"scripts"`:
  ```json
  "scripts": {
    ...
    "seed": "tsx scripts/seed.ts"
  }
  ```

---

### Makefile

#### [MODIFY] [Makefile](file:///home/tie/Projects/knpos/Makefile)
- Add `seed-schema` and `seed-schema-remote` targets.
- Update the `help` menu to include descriptions of the new targets.
  ```makefile
  .PHONY: help seed-local seed-remote seed-schema seed-schema-remote ...

  help:
  	...
  	@echo "  make seed-schema       Recreate schema and clear all data locally"
  	@echo "  make seed-schema-remote Recreate schema and clear all data remotely"

  seed-schema:
  	npx tsx scripts/seed.ts --schema-only

  seed-schema-remote:
  	npx tsx scripts/seed.ts --remote --schema-only
  ```

## Verification Plan

### Automated Verification
- Verify that `pnpm seed` runs full seeding.
- Verify that `pnpm seed --schema-only` only executes `schema.sql` and exits early.
- Verify that `make seed-schema` works as expected.

### Manual Verification
- Check local D1 database state after running schema-only and normal seeding commands.
