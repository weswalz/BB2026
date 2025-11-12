import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'database', 'biyuboxing.db');
const db = new Database(DB_PATH);

const now = new Date().toISOString();

// Fix BiYu Brawl 3 missing image
console.log('📸 Fixing event images...');
try {
  const fixEventStmt = db.prepare(`
    UPDATE events
    SET image = ?
    WHERE id = ? AND (image IS NULL OR image = '')
  `);

  const result = fixEventStmt.run('/images/biyubrawl3.jpg', '68bef31f3c5eb4685f53cc2d');
  if (result.changes > 0) {
    console.log('✅ Fixed BiYu Brawl 3 image');
  }
} catch (error) {
  console.error('❌ Error fixing event image:', error.message);
}

// Populate Fighter Bios
console.log('\n👊 Populating fighter bios...');

const fighterBios = {
  'Marquis Taylor': 'Marquis Taylor is a talented middleweight contender currently ranked 13th in the world by the WBC. With an impressive record and devastating power, Taylor is on a mission to claim a world title. Training at the BiYu Training Complex in Houston, he represents the next generation of elite fighters developed by BiYu Promotions.',

  'Michael Chaise Nelson': 'Michael Chaise Nelson is an exciting young prospect with exceptional technical skills and ring IQ. Known for his speed and precision, Nelson has quickly made a name for himself in the competitive boxing landscape. Under the guidance of BiYu Promotions, he continues to develop into a formidable force in his weight division.',

  'Eridson Garcia': 'Eridson Garcia is a super featherweight world title contender currently ranked 13th by the WBA. Hailing from the Dominican Republic, Garcia brings explosive power and relentless pressure to every fight. His aggressive style and championship ambitions make him one of the most exciting fighters in BiYu Promotions\' stable.',

  'Chavon Stillwell': 'Known as the "Silent Assassin," Chavon Stillwell is a rising star in the boxing world. His calculated approach and devastating finishing ability have earned him recognition as one of the sport\'s most dangerous prospects. Recently signed to BiYu Promotions, Stillwell is poised to make a major impact in his division.',

  'Eliesel Rodriguez Ledesma': 'Eliesel Rodriguez Ledesma is a skilled boxer from the Dominican Republic with exceptional footwork and defensive abilities. His technical prowess and ring generalship make him a difficult opponent for anyone in his weight class. BiYu Promotions is committed to guiding his career toward championship glory.',

  'Rafael Abreu': 'Rafael Abreu is a powerful puncher from the Dominican Republic with an exciting, fan-friendly fighting style. His combination of speed, power, and determination has made him a crowd favorite. Training under BiYu Promotions, Abreu is on the fast track to major championship opportunities.',

  'Erick Rosado': 'Erick Rosado is a versatile boxer with excellent technical skills and ring intelligence. His ability to adapt to any opponent\'s style makes him a formidable competitor. As part of the BiYu Promotions roster, Rosado continues to climb the ranks and establish himself as a legitimate contender.'
};

try {
  const updateBioStmt = db.prepare(`
    UPDATE fighters
    SET bio = ?
    WHERE name = ? AND (bio IS NULL OR bio = '')
  `);

  let biosUpdated = 0;

  for (const [name, bio] of Object.entries(fighterBios)) {
    const result = updateBioStmt.run(bio, name);
    if (result.changes > 0) {
      biosUpdated++;
      console.log(`✅ Updated bio for ${name}`);
    }
  }

  console.log(`\n📊 Total fighter bios updated: ${biosUpdated}`);
} catch (error) {
  console.error('❌ Error updating fighter bios:', error.message);
}

// Verify all content
console.log('\n🔍 Verifying all content types...');

try {
  // Check events
  const eventsCheck = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN image IS NULL OR image = '' THEN 1 ELSE 0 END) as missing_images,
      SUM(CASE WHEN description IS NULL OR description = '' THEN 1 ELSE 0 END) as missing_descriptions
    FROM events
  `).get();

  console.log('\n📅 Events:');
  console.log(`   Total: ${eventsCheck.total}`);
  console.log(`   Missing images: ${eventsCheck.missing_images}`);
  console.log(`   Missing descriptions: ${eventsCheck.missing_descriptions}`);

  // Check fighters
  const fightersCheck = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN image IS NULL OR image = '' THEN 1 ELSE 0 END) as missing_images,
      SUM(CASE WHEN bio IS NULL OR bio = '' THEN 1 ELSE 0 END) as missing_bios
    FROM fighters
  `).get();

  console.log('\n👊 Fighters:');
  console.log(`   Total: ${fightersCheck.total}`);
  console.log(`   Missing images: ${fightersCheck.missing_images}`);
  console.log(`   Missing bios: ${fightersCheck.missing_bios}`);

  // Check news
  const newsCheck = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN featuredImage IS NULL OR featuredImage = '' THEN 1 ELSE 0 END) as missing_images,
      SUM(CASE WHEN content IS NULL OR content = '' THEN 1 ELSE 0 END) as missing_content
    FROM news
  `).get();

  console.log('\n📰 News:');
  console.log(`   Total: ${newsCheck.total}`);
  console.log(`   Missing images: ${newsCheck.missing_images}`);
  console.log(`   Missing content: ${newsCheck.missing_content}`);

  // Check pages
  const pagesCheck = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN content IS NULL OR content = '' OR content = '{}' THEN 1 ELSE 0 END) as missing_content
    FROM pages
  `).get();

  console.log('\n📄 Pages:');
  console.log(`   Total: ${pagesCheck.total}`);
  console.log(`   Missing content: ${pagesCheck.missing_content}`);

  // Check globals
  const globalsCheck = db.prepare(`
    SELECT COUNT(*) as total FROM globals
  `).get();

  console.log('\n🌍 Globals:');
  console.log(`   Total settings: ${globalsCheck.total}`);

  console.log('\n✨ Content verification complete!');

} catch (error) {
  console.error('❌ Error during verification:', error.message);
}

db.close();
