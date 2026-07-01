import { execSync } from 'child_process';
import crypto from 'crypto';

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

async function run() {
  console.log(`Seeding user and shop in ${envLabel} D1 database...`);

  const targetEmail = 'nutthawit1513@gmail.com';
  const targetPassword = 'password123';
  const targetShopName = 'Fly away to somewhere';

  try {
    // 1. Check if user exists
    console.log(`Checking if user "${targetEmail}" exists...`);
    const queryUserCmd = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id FROM \\"user\\" WHERE email = '${targetEmail}'" --json`;
    const userResult = execSync(queryUserCmd, { encoding: 'utf-8' });
    const userJson = parseWranglerJson(userResult);
    const users = Array.isArray(userJson) ? (userJson[0]?.results || []) : (userJson?.results || []);

    let userId: number;

    if (users.length === 0) {
      console.log(`User "${targetEmail}" does not exist. Creating...`);
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.createHash('sha256').update(targetPassword + salt).digest('hex');

      const createUserCmd = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="INSERT INTO \\"user\\" (email, password_hash, password_salt, is_verified) VALUES ('${targetEmail}', '${hash}', '${salt}', 1) RETURNING id" --json`;
      const createResult = execSync(createUserCmd, { encoding: 'utf-8' });
      const createJson = parseWranglerJson(createResult);
      const newUsers = Array.isArray(createJson) ? (createJson[0]?.results || []) : (createJson?.results || []);
      
      if (newUsers.length === 0 || !newUsers[0].id) {
        throw new Error('Failed to create user and retrieve RETURNING id.');
      }
      userId = newUsers[0].id;
      console.log(`User created with ID: ${userId}`);
    } else {
      userId = users[0].id;
      console.log(`User already exists with ID: ${userId}`);
    }

    // 2. Check if shop exists
    console.log(`Checking if shop "${targetShopName}" exists...`);
    const queryShopCmd = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id FROM shop WHERE name = '${targetShopName}'" --json`;
    const shopResult = execSync(queryShopCmd, { encoding: 'utf-8' });
    const shopJson = parseWranglerJson(shopResult);
    const shops = Array.isArray(shopJson) ? (shopJson[0]?.results || []) : (shopJson?.results || []);

    let shopId: number;

    if (shops.length === 0) {
      console.log(`Shop "${targetShopName}" does not exist. Creating...`);
      const createShopCmd = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="INSERT INTO shop (name) VALUES ('${targetShopName}') RETURNING id" --json`;
      const createShopResult = execSync(createShopCmd, { encoding: 'utf-8' });
      const createShopJson = parseWranglerJson(createShopResult);
      const newShops = Array.isArray(createShopJson) ? (createShopJson[0]?.results || []) : (createShopJson?.results || []);

      if (newShops.length === 0 || !newShops[0].id) {
        throw new Error('Failed to create shop and retrieve RETURNING id.');
      }
      shopId = newShops[0].id;
      console.log(`Shop created with ID: ${shopId}`);
    } else {
      shopId = shops[0].id;
      console.log(`Shop already exists with ID: ${shopId}`);
    }

    // 3. Bind user as shop owner
    console.log(`Checking shop member binding for user ${userId} and shop ${shopId}...`);
    const queryBindingCmd = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id FROM shop_member WHERE shop_id = ${shopId} AND user_id = ${userId}" --json`;
    const bindingResult = execSync(queryBindingCmd, { encoding: 'utf-8' });
    const bindingJson = parseWranglerJson(bindingResult);
    const bindings = Array.isArray(bindingJson) ? (bindingJson[0]?.results || []) : (bindingJson?.results || []);

    if (bindings.length === 0) {
      console.log(`Binding user ${userId} to shop ${shopId} as owner...`);
      const createBindingCmd = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="INSERT INTO shop_member (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')"`;
      execSync(createBindingCmd, { stdio: 'inherit' });
      console.log('User successfully bound to shop as owner.');
    } else {
      console.log('User is already bound to this shop.');
    }

    console.log('Seeding shop completed successfully!');
  } catch (error: any) {
    console.error('Seeding shop failed:', error.message || error);
    process.exit(1);
  }
}

run();
