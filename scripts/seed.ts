import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const csvPath = path.resolve(process.cwd(), 'seed/products.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim() !== '');

// Skip header
for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 10) continue;

    const [name, tha, sgp, idn, deu, jpn, chn, twn, kor, imgUrl] = cols;
    
    // Construct SQL
    const sql = `INSERT INTO Product (name, tha_price, sgp_price, idn_price, deu_price, jpn_price, chn_price, twn_price, kor_price, image_url) VALUES ('${name}', ${tha}, ${sgp || 'NULL'}, ${idn || 'NULL'}, ${deu || 'NULL'}, ${jpn || 'NULL'}, ${chn || 'NULL'}, ${twn || 'NULL'}, ${kor || 'NULL'}, '${imgUrl.trim()}');`;

    console.log(`Executing: ${sql}`);
    execSync(`npx wrangler d1 execute charnipos-db --local --command="${sql}"`);
}

console.log('Seed completed.');
