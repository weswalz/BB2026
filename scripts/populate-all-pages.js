import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'database', 'biyuboxing.db');
const db = new Database(DB_PATH);

const now = new Date().toISOString();

// Home Page Content
const homeContent = {
  seoTitle: 'BiYu Promotions - Boxing Promotions in Houston, Texas',
  seoDescription: 'Fighting For Legacy, Driven by Culture. Professional boxing promotion company based in Houston with operations in Tampa and Santo Domingo.',
  heroImage: '/images/biyoubrawl3banner.jpg',
  heroTitle: 'BIYU PROMOTIONS',
  heroSubtitle: 'Fighting For Legacy, Driven by Culture',
  latestNewsTitle: '<span class="biyu-title-yellow text-gradient">latest</span> <span class="biyu-title-white">News</span>',
  companyInfoImage: '/images/home/gloves-hero.png',
  companyInfoLogo: '/images/logos/logo-white.png',
  companyInfoParagraph1: 'BiYu Promotions is a multi-brand organization dedicated to the sport of Boxing and is led by licensed promoter and manager Bobby Harrison.',
  companyInfoParagraph2: 'The organization includes various entertainment businesses and is now headquartered in Houston, Texas with offices in Tampa, Florida and Santo Domingo, Dominican Republic.',
  companyInfoParagraph3: 'BiYu houses the BiYu Training Complex in Houston where professional and amateur fighters train under some of the best trainers in boxing.'
};

// Upcoming Events Page Content
const upcomingEventsContent = {
  seoTitle: 'Upcoming Events - BiYu Promotions',
  seoDescription: "Don't miss BiYu Promotions' upcoming boxing events across the USA & beyond. Experience the action live—check out our fight schedule and get your tickets now!",
  heroImage: '/images/upcomingeventshero.webp',
  heroTitle: 'UPCOMING EVENTS'
};

// Previous Events Page Content
const previousEventsContent = {
  seoTitle: 'Previous Events - BiYu Promotions | Past Boxing Events',
  seoDescription: "View BiYu Promotions' previous boxing events. Championship fights, memorable moments, and fight results from our past events.",
  heroImage: '/images/previouseventshero.webp',
  heroTitle: 'PREVIOUS EVENTS',
  viewMoreButtonText: 'View More'
};

// Contact Us Page Content
const contactUsContent = {
  seoTitle: 'Contact Us - BiYu Promotions | Get in Touch',
  seoDescription: 'Contact BiYu Promotions for boxing promotion inquiries, fighter opportunities, and event information. Houston, Texas based boxing promotion company.',
  heroImage: '/images/contactushero.webp',
  heroTitle: 'CONTACT US'
};

// Box For Us Page Content
const boxForUsContent = {
  seoTitle: 'Box for Us - BiYu Promotions | Professional Boxing Career',
  seoDescription: 'Take your boxing career to the next level with BiYu Promotions. Professional management, world-class training facilities, and career development opportunities.',
  heroImage: '/images/boxforushero.webp',
  heroTitle: '<span class="text-[#FFD700]">BOX FOR US</span>',

  careerTitle: 'Are you looking to accelerate your professional boxing career?',
  careerParagraph1: 'If you are a talented boxer seeking to carve out a career in the professional ranks then we want to hear from you.',
  careerParagraph2: 'BiYu Promotions has an excellent track record for managing and promoting boxers – and providing a pathway to compete at the top levels of boxing.',
  careerParagraph3: 'We currently manage two world title contenders in middleweight Marquis Taylor currently ranked 13th in the world by the WBC (May 2025), and super featherweight Eridson Garcia who is ranked 13th in the world by the WBA (May 2025).',

  facilitiesTitle: 'World-Class Facilities',
  facilitiesParagraph1: 'BiYu Promotions provides you with everything you need to succeed, including access to the top trainers, matchmakers, its own Legions Training Complex in Houston, and living accommodation in Houston.',
  facilitiesParagraph2: 'BiYu Promotions also organises regular boxing events in Houston, Texas; the Dominican Republic and in South America to showcase your boxing talents.',
  facilitiesParagraph3: 'We provide consistent opportunities for you to enhance your professional career against reputable opponents.',

  leadershipTitle: 'Experienced Leadership',
  leadershipParagraph1: 'The boxing operation is overseen by BiYu Promotions CEO Bobby Harrison and Rene Sanchez, who have more than 40 years boxing experience between them.',
  leadershipParagraph2: 'If you are a talented boxer looking for boxing promotion and management – we want to hear from you.',
  leadershipParagraph3: 'Please complete the contact form below, sharing key details about you and your career for consideration.',

  formTitle: 'Apply to Join BiYu Promotions',
  formSubtitle: 'Ready to take your boxing career to the next level? Fill out the form below and our team will be in touch.',
  formSubmitButton: 'Submit Application'
};

// News Listing Page Content
const newsListingContent = {
  seoTitle: 'News - BiYu Promotions | Latest Boxing News & Updates',
  seoDescription: 'Stay updated with the latest boxing news from BiYu Promotions. Fighter signings, fight results, upcoming events, and exclusive updates.',
  heroImage: '/images/newshero.webp',
  heroTitle: 'NEWS',
  sectionTitle: 'Latest News',
  readMoreButtonText: 'Read More'
};

// 404 Page Content
const notFoundContent = {
  seoTitle: 'Page Not Found - Biyu Boxing',
  seoDescription: "The page you're looking for doesn't exist. Return to the homepage or explore our fighters and events.",
  mainText: '404',
  subtitle: 'Page Not Found',
  heading: 'Looks like this page threw in the towel!',
  paragraph: "The page you're looking for doesn't exist or may have been moved. Don't worry though - there's plenty more to explore on our site.",
  homeButtonText: 'Back to Homepage',
  fightersButtonText: 'Meet Our Fighters',
  quickLinksText: 'Or explore these popular sections:',
  quoteText: "\"It's not about how hard you hit. It's about how hard you can get hit and keep moving forward.\"",
  quoteCite: '- Rocky Balboa'
};

const pages = [
  { id: 'home', content: homeContent, name: 'Home' },
  { id: 'upcoming-events', content: upcomingEventsContent, name: 'Upcoming Events' },
  { id: 'previous-events', content: previousEventsContent, name: 'Previous Events' },
  { id: 'contact-us', content: contactUsContent, name: 'Contact Us' },
  { id: 'box-for-us', content: boxForUsContent, name: 'Box For Us' },
  { id: 'news-listing', content: newsListingContent, name: 'News Listing' },
  { id: '404', content: notFoundContent, name: '404 Page' }
];

try {
  const stmt = db.prepare(`
    UPDATE pages
    SET content = ?, updatedAt = ?
    WHERE id = ?
  `);

  let updated = 0;
  let created = 0;

  for (const page of pages) {
    // Check if exists
    const exists = db.prepare('SELECT id FROM pages WHERE id = ?').get(page.id);

    if (exists) {
      stmt.run(JSON.stringify(page.content), now, page.id);
      updated++;
      console.log(`✅ Updated: ${page.name} (${Object.keys(page.content).length} fields)`);
    } else {
      // Create if doesn't exist
      const createStmt = db.prepare(
        'INSERT INTO pages (id, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)'
      );
      createStmt.run(page.id, JSON.stringify(page.content), now, now);
      created++;
      console.log(`✨ Created: ${page.name} (${Object.keys(page.content).length} fields)`);
    }
  }

  console.log('\n🎉 All pages populated successfully!');
  console.log(`📊 Summary: ${updated} updated, ${created} created`);
  console.log(`📋 Total pages: ${pages.length}`);

} catch (error) {
  console.error('❌ Error populating pages:', error.message);
} finally {
  db.close();
}
