import fs from 'fs';
import { execSync } from 'child_process';

// Check CLI arguments for --remote
const isRemote = process.argv.includes('--remote');
const wranglerFlag = isRemote ? '--remote' : '--local';
const envLabel = isRemote ? 'remote' : 'local';

function parseWranglerJson(output: string): unknown {
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

const today = new Date();
const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getRelativeDate = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offsetDays);
  return formatDate(d);
};

const events = [
  {
    name: 'Pop-up Craft Fair (Past)',
    country: 'Thailand',
    startDate: getRelativeDate(-45),
    endDate: getRelativeDate(-40),
    boothRental: 1000,
    travel: 200,
    accommodation: 500,
    foodAllowance: 100,
  },
  {
    name: 'Singapore Art Festival (Past)',
    country: 'Singapore',
    startDate: getRelativeDate(-20),
    endDate: getRelativeDate(-15),
    boothRental: 1500,
    travel: 400,
    accommodation: 800,
    foodAllowance: 200,
  },
  {
    name: 'Design Week Expo (Current)',
    country: 'Thailand',
    startDate: getRelativeDate(-2),
    endDate: getRelativeDate(2),
    boothRental: 1200,
    travel: 100,
    accommodation: 400,
    foodAllowance: 150,
  },
  {
    name: 'Charni Showcase (Upcoming)',
    country: 'Singapore',
    startDate: getRelativeDate(15),
    endDate: getRelativeDate(20),
    boothRental: 1800,
    travel: 500,
    accommodation: 1000,
    foodAllowance: 250,
  }
];

async function run() {
  console.log(`Querying existing events in ${envLabel} D1 database...`);
  const queryEventsCommand = `npx wrangler d1 execute charnipos-db ${wranglerFlag} --command="SELECT id, name FROM event WHERE shop_id = 1" --json`;
  const eventsResult = execSync(queryEventsCommand, { encoding: 'utf-8' });
  const eventsJson = parseWranglerJson(eventsResult) as { results?: { id: number; name: string }[] } | { results?: { id: number; name: string }[] }[];
  const existingEvents: Array<{ id: number; name: string }> =
    Array.isArray(eventsJson) ? (eventsJson[0]?.results || []) : (eventsJson?.results || []);

  const existingEventsMap = new Map<string, number>();
  existingEvents.forEach(evt => existingEventsMap.set(evt.name, evt.id));

  const sqlLines: string[] = [];

  events.forEach((evt) => {
    const existingId = existingEventsMap.get(evt.name);
    if (existingId !== undefined) {
      console.log(`  -> Event "${evt.name}" already exists. Preparing UPDATE SQL...`);
      sqlLines.push(
        `UPDATE event SET start_date = '${evt.startDate}', end_date = '${evt.endDate}' WHERE id = ${existingId};`
      );
    } else {
      console.log(`  -> Event "${evt.name}" does not exist. Preparing INSERT SQL...`);
      sqlLines.push(
        `INSERT INTO event (shop_id, name, country, start_date, end_date, booth_rental, travel, accommodation, food_allowance) ` +
        `VALUES (1, '${evt.name.replace(/'/g, "''")}', '${evt.country.replace(/'/g, "''")}', '${evt.startDate}', '${evt.endDate}', ${evt.boothRental}, ${evt.travel}, ${evt.accommodation}, ${evt.foodAllowance});`
      );
    }
  });

  if (sqlLines.length > 0) {
    const tempSqlFile = 'event_seed_temp.sql';
    fs.writeFileSync(tempSqlFile, sqlLines.join('\n'));
    console.log(`Executing event seed SQL in ${envLabel} D1...`);
    execSync(`npx wrangler d1 execute charnipos-db ${wranglerFlag} --file=./${tempSqlFile}`, { stdio: 'inherit' });
    fs.unlinkSync(tempSqlFile);
  }

  console.log('Event seeding/updates completed successfully!');
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
