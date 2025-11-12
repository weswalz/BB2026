import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'database', 'biyuboxing.db');
const db = new Database(DB_PATH);

const aboutUsContent = {
  // SEO
  seoTitle: 'About Us - BiYu Promotions | Professional Boxing Promotion',
  seoDescription: "BiYu Promotions is a multi-brand organization led by Bobby Harrison. With offices in Houston, Tampa, and Santo Domingo, we're dedicated to developing world-class fighters.",

  // Hero Section
  heroTitle: 'ABOUT US',
  heroImage: '/images/aboutushero.webp',

  // About Section
  aboutTitle: 'ABOUT',
  aboutImage: '/images/aboutusfeature.webp',
  aboutParagraph1: 'BiYu Promotions is a multi-brand organization dedicated to the sport of Boxing and is led by licensed promoter and manager Bobby Harrison. Harrison brings fifteen years of experience in Boxing and has been involved in entertainment for over 30 years.',
  aboutParagraph2: 'The organization includes various entertainment businesses and is now headquartered in Houston, Texas with offices in Tampa, Florida and Santo Domingo, Dominican Republic.',
  aboutParagraph3: 'BiYu houses the BiYu Training Complex in Houston where professional and amateur fighters train under some of the best trainers in boxing.',

  // Our Experience Section
  experienceTitle: 'OUR EXPERIENCE',
  experienceImage: '/images/ourexperience.webp',
  experienceParagraph1: 'Our professional team serves all fighting/boxing disciplines that surround the sport. We have developed working relationships with many of the premier venues around the country and world.',
  experienceParagraph2: 'The facility also houses our television production and event day management crews who have experience in sports entertainment.',
  experienceParagraph3: 'BiYu Promotions and its brand companies bring audiences jaw-dropping boxing action around the world featuring top-tier fighters and contenders.',

  // Our Partners Section
  partnersTitle: 'OUR PARTNERS',
  partnersImage: '/images/ourpartners.webp',
  partnersParagraph1: 'BiYu Promotions has an excellent track record/knowledge promoting and managing boxers – and providing a pathway to compete at the top-levels of boxing.',
  partnersParagraph2: 'We have developed relationships with world renowned sanctioning bodies such as the WBC and WBA as well as premier networks DAZN, beIN Sports and Fite TV.',
  partnersParagraph3: 'BiYu Promotions is proud to have worked with world champions such as Juan Diaz, Reggie Johnson and more recently Sean Porter.',

  // Dominican Republic Section
  drTitle: 'A SHOWCASE FOR<br><span class="text-[#FFD700]">DOMINICAN REPUBLIC BOXING</span>',
  drImage: '/images/dominican-republic-boxing.webp',
  drParagraph1: 'BiYu Promotions is at the forefront of developing and showcasing boxing talents across all professional disciplines spanning multiple continents – most importantly the DR.',
  drParagraph2: 'We are determined to provide top-tier events showcasing some talents that may have been overlooked by larger boxing promotional companies that can\'t provide the personal touch that we provide.',
  drParagraph3: 'Utilizing strategic partnerships, Top-caliber events, and premier venues, we provide consistent opportunities for fighters to showcase their talents.',

  // Core Aims Section
  aimsTitle: 'OUR CORE AIMS ARE',
  aim1: 'To identify young talent through our scouting network and training programs',
  aim2: 'To collaborate with top coaching and performance teams',
  aim3: 'To provide development opportunities rising stars, coaches and officials'
};

const now = new Date().toISOString();

try {
  // Update the about-us page with all content
  const stmt = db.prepare(`
    UPDATE pages
    SET content = ?, updatedAt = ?
    WHERE id = ?
  `);

  stmt.run(JSON.stringify(aboutUsContent), now, 'about-us');

  console.log('✅ Successfully populated About Us page content!');
  console.log('📋 Fields updated:', Object.keys(aboutUsContent).length);

} catch (error) {
  console.error('❌ Error populating content:', error.message);
} finally {
  db.close();
}
