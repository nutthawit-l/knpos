import { execSync } from 'child_process';

// Check CLI arguments for --remote
const isRemote = process.argv.includes('--remote');
const wranglerFlag = isRemote ? '--remote' : '--local';
const envLabel = isRemote ? 'remote' : 'local';

function parseWranglerJson(output: string): any {
  const startIndex = output.indexOf('[');
  const startObject = output.indexOf('{');

  let index = -1;
  if (startIndex !== -1 && startObject !== -1) {
    index = Math.min(startIndex, startObject);
  } else if (startIndex !== -1) {
    index = startIndex;
  } else if (startObject !== -1) {
    index = startObject;
  }

  if (index === -1) {
    throw new Error(`Could not find start of JSON in output: ${output}`);
  }

  const jsonStr = output.substring(index).trim();
  return JSON.parse(jsonStr);
}

function check() {
  console.log(`Checking if User 1 and Shop 1 exist in ${envLabel} D1 database...`);
  try {
    // Check User 1
    const userQuery = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id FROM \\"user\\" WHERE id = 1" --json`;
    const userResult = execSync(userQuery, { encoding: 'utf-8' });
    const userJson = parseWranglerJson(userResult);
    const users = Array.isArray(userJson) ? (userJson[0]?.results || []) : (userJson?.results || []);

    if (users.length === 0) {
      console.error(`Error: User with ID 1 does not exist in ${envLabel} D1 database.`);
      process.exit(1);
    }

    // Check Shop 1
    const shopQuery = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id FROM shop WHERE id = 1" --json`;
    const shopResult = execSync(shopQuery, { encoding: 'utf-8' });
    const shopJson = parseWranglerJson(shopResult);
    const shops = Array.isArray(shopJson) ? (shopJson[0]?.results || []) : (shopJson?.results || []);

    if (shops.length === 0) {
      console.error(`Error: Shop with ID 1 does not exist in ${envLabel} D1 database.`);
      process.exit(1);
    }

    console.log(`Success: User 1 and Shop 1 verified in ${envLabel} D1 database.`);
  } catch (error: any) {
    console.error(`Error running database verification check:`, error.message || error);
    process.exit(1);
  }
}

check();
