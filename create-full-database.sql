-- BiYu Boxing Complete Database
-- SQLite Version

-- Drop tables if they exist
DROP TABLE IF EXISTS fighters;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS media;

-- Create tables
CREATE TABLE IF NOT EXISTS fighters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  record TEXT,
  nationality TEXT,
  weightClass TEXT,
  height TEXT,
  weight TEXT,
  reach TEXT,
  stance TEXT,
  hometown TEXT,
  bio TEXT,
  image TEXT,
  flag TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  kos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  slug TEXT UNIQUE,
  displayOrder INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  venue TEXT,
  location TEXT,
  description TEXT,
  image TEXT,
  ticketUrl TEXT,
  fights TEXT, -- JSON string
  status TEXT DEFAULT 'upcoming',
  featured BOOLEAN DEFAULT false,
  slug TEXT UNIQUE,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  image TEXT,
  author TEXT,
  category TEXT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  createdAt TEXT,
  updatedAt TEXT,
  publishedAt TEXT,
  status TEXT DEFAULT 'published',
  slug TEXT UNIQUE,
  seoTitle TEXT,
  seoDescription TEXT,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  category TEXT,
  siteName TEXT,
  siteTagline TEXT,
  updatedAt TEXT,
  updatedBy TEXT
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  originalName TEXT NOT NULL,
  url TEXT NOT NULL,
  mimetype TEXT,
  size INTEGER,
  alt TEXT,
  createdAt TEXT
);

-- Insert Fighters
-- Note: Adding NULL for new columns: nickname, height, weight, reach, stance, hometown, bio
INSERT INTO fighters VALUES 
('68ba98af54d9b5f308d27960', 'Marquis Taylor', NULL, '18-1-2 (3 KOs)', 'USA', 'Middleweight', NULL, NULL, NULL, NULL, NULL, NULL, '/images/MarquisTaylor.webp', '/images/USAflag.webp', 18, 1, 2, 3, 'active', 'marquis-taylor', 0),
('68ba98af54d9b5f308d27961', 'Michael Chaise Nelson', NULL, '21-3-1 (8 KOs)', 'USA', 'Featherweight', NULL, NULL, NULL, NULL, NULL, NULL, '/images/MichaelChaiseNelson.webp', '/images/USAflag.webp', 21, 3, 1, 8, 'active', 'michael-chaise-nelson', 0),
('68ba98af54d9b5f308d27962', 'Eridson Garcia', NULL, '20-1-0 (12 KOs)', 'DR', 'Super Featherweight', NULL, NULL, NULL, NULL, NULL, NULL, '/images/EridsonGarcia.webp', '/images/DRflag.webp', 20, 1, 0, 12, 'active', 'eridson-garcia', 0),
('68ba98af54d9b5f308d27963', 'Chavon Stillwell', NULL, '6-0-0 (5 KOs)', 'USA', 'Cruiserweight', NULL, NULL, NULL, NULL, NULL, NULL, '/images/ChavonStillwell.webp', '/images/USAflag.webp', 6, 0, 0, 5, 'active', 'chavon-stillwell', 0),
('68ba98af54d9b5f308d27964', 'Eliesel Rodriguez Ledesma', NULL, '5-0-1 (4 KOs)', 'DR', 'Super Featherweight', NULL, NULL, NULL, NULL, NULL, NULL, '/images/ElieselRodriguezLedesma.webp', '/images/DRflag.webp', 5, 0, 1, 4, 'active', 'eliesel-rodriguez-ledesma', 0),
('68ba98af54d9b5f308d27965', 'Rafael Abreu', NULL, '7-0-0 (6 KOs)', 'DR', 'Super Welterweight', NULL, NULL, NULL, NULL, NULL, NULL, '/images/RafaelAbreu.webp', '/images/DRflag.webp', 7, 0, 0, 6, 'active', 'rafael-abreu', 0),
('68ba98af54d9b5f308d27966', 'Erick Rosado', NULL, '15-3-0 (11 KOs)', 'DR', 'Featherweight', NULL, NULL, NULL, NULL, NULL, NULL, '/images/ErickRosado.webp', '/images/DRflag.webp', 15, 3, 0, 11, 'active', 'erick-rosado', 0);

-- Insert Events
INSERT INTO events VALUES 
('68ba98f92a75e2ac7721abc8', 'Gloves & Glory', '2025-09-06', 'Bert Ogden Arena', 'Edinburg, USA', 'BiYu Promotions and Marquez Promotions Presents Gloves & Glory', '/images/glovesandglory.webp', 'https://bertogdenarena.com/events/gloves-and-glory/', '[]', 'upcoming', 0, 'gloves-and-glory', NULL, NULL),
('68ba98f92a75e2ac7721abc9', 'BiYu Brawl April 26th', '2024-04-26', '', 'Houston, USA', '', '/images/biyubrawlapril26th.webp', '', '[]', 'previous', 0, 'biyu-brawl-april-26th', NULL, NULL),
('68ba98f92a75e2ac7721abca', 'Torres Event July 3rd', '2024-07-03', '', 'Houston, USA', '', '/images/torresjuly3rd.webp', '', '[]', 'previous', 0, 'torres-event-july-3rd', NULL, NULL),
('68bef31f3c5eb4685f53cc2d', 'Biyu Brawl 3', '2025-10-11', 'Club Hefe', 'Houston, USA', 'The third installment of the explosive Biyu Brawl boxing series', '/images/biyubrawl3.jpg', 'https://tickets.friendlysky.com/event/biyu-boxing-promotions-10-11-2025?e=EBb&lang=', '[]', 'upcoming', 1, 'biyu-brawl-3', '2025-09-08', '2025-09-08');

-- Insert News
INSERT INTO news VALUES 
('68ba8e572c7f1cc6a659d8ea', 'BiYu Trio to Box on Gloves & Glory Card', 'BiYu Promotions announced that three of its premier fighters will compete on the highly anticipated "Gloves & Glory" card, scheduled for September 6, 2024, at the Bert Ogden Arena in Edinburg, Texas. The event promises to showcase the exceptional talent and skill that BiYu Promotions is known for developing.

Headlining BiYu''s presence on the card is the explosive Eridson Garcia, who will face off against Cristian Perez Hernandez for the prestigious WBO NABO Super Featherweight title. Garcia, known for his devastating power and technical precision, has been preparing intensively for this career-defining moment. With his impressive knockout ratio and unwavering determination, Garcia is poised to make a statement in the super featherweight division.

Joining Garcia on the card is the formidable Chavon Stillwell, whose powerful punching ability and strategic approach have made him a standout in the cruiserweight division. Stillwell''s recent performances have caught the attention of boxing enthusiasts and experts alike, and his participation in "Gloves & Glory" represents another step toward championship contention.

Completing the BiYu trio is Erick Rosado, a skilled featherweight whose technical prowess and ring intelligence have earned him recognition as one of the division''s rising stars. Rosado''s inclusion on such a high-profile card reflects his growing status in the boxing world and BiYu Promotions'' commitment to providing opportunities for their fighters to shine on significant stages.

The "Gloves & Glory" event represents more than just individual fights; it showcases BiYu Promotions'' dedication to developing world-class talent and providing platforms for their fighters to achieve their championship aspirations. Each of these three fighters brings unique strengths and compelling storylines that promise to deliver excitement and memorable moments for boxing fans.

With comprehensive training camps behind them and the full support of the BiYu Promotions team, Garcia, Stillwell, and Rosado are ready to demonstrate why they represent the future of their respective divisions. The September 6 card at the Bert Ogden Arena will serve as a launching pad for continued success and championship pursuits.', 'Eridson Garcia vs Cristian Perez Hernandez for the WBO NABO Super Featherweight title headlines BiYu''s presence on September 6 card.', '/images/biyutrio.webp', 'BiYu Promotions', 'General', 0, 1, '2025-06-25', '2025-09-05', '2025-06-25', 'published', 'biyu-trio-to-box-on-gloves-and-glory-card', 'BiYu Trio to Box on Gloves & Glory Card', 'Three BiYu fighters compete on Gloves & Glory card September 6 at Bert Ogden Arena, featuring Eridson Garcia''s WBO NABO title fight.', '"Eridson Garcia", "Chavon Stillwell", "Erick Rosado", "Gloves & Glory", "WBO NABO"'),

('68ba8e572c7f1cc6a659d8eb', '''Silent Assassin'' Chavon Stillwell Signs for BiYu Promotions', 'BiYu Promotions is thrilled to announce the signing of undefeated cruiserweight sensation Chavon "Silent Assassin" Stillwell to an exclusive promotional agreement. The signing represents a significant addition to BiYu''s growing roster of world-class fighters and reinforces the company''s commitment to developing championship-caliber talent.

Stillwell, who brings an impressive 6-0 record with 5 knockouts to BiYu Promotions, has quickly established himself as one of the most promising prospects in the cruiserweight division. His devastating power, combined with exceptional technical skills and ring intelligence, has caught the attention of boxing experts who predict a bright future ahead.

"Chavon embodies everything we look for in a BiYu fighter," said company representatives. "His dedication, work ethic, and natural ability make him a perfect fit for our organization. We''re confident that with our support and guidance, Chavon will achieve great things in the sport."

The "Silent Assassin" moniker perfectly captures Stillwell''s approach in the ring - methodical, calculated, and devastatingly effective. His ability to systematically break down opponents while maintaining composure under pressure has become his trademark. This fighting style, combined with his impressive knockout ratio, makes him a compelling force in the cruiserweight landscape.

Stillwell''s signing comes at a pivotal time in his career, as he transitions from prospect to genuine contender status. BiYu Promotions'' track record of developing fighters and securing meaningful opportunities aligns perfectly with Stillwell''s championship ambitions.

"I''m excited to join the BiYu family," Stillwell commented. "Their reputation for developing champions and creating opportunities speaks for itself. I''m ready to work hard and make the most of this partnership as I pursue my goal of becoming a world champion."

With BiYu''s extensive network of connections and commitment to fighter development, Stillwell is positioned to fast-track his path toward title contention. The cruiserweight division, known for its depth and competitive landscape, presents numerous opportunities for a fighter of Stillwell''s caliber.

Boxing fans can expect to see Stillwell in action soon, as BiYu Promotions works to secure compelling matchups that will showcase his skills and advance his career trajectory. The "Silent Assassin" has found his promotional home, and the boxing world should take notice.', 'Big-hitting cruiserweight tipped for world title contention joins BiYu''s growing roster of champions.', '/images/ChavonStillwell-news.webp', 'BiYu Promotions', 'General', 1, 1, '2025-06-01', '2025-09-05', '2025-06-01', 'published', 'silent-assassin-chavon-stillwell-signs-for-biyu-promotions', '''Silent Assassin'' Chavon Stillwell Signs for BiYu Promotions', 'Undefeated cruiserweight Chavon Stillwell joins BiYu Promotions, bringing 6-0 record with 5 KOs and world title ambitions.', '"Chavon Stillwell", "Cruiserweight", "Signing", "Silent Assassin"'),

('68ba8e572c7f1cc6a659d8ec', 'Garcia Ready to Put Down a Marker Ahead of TKO Switch', 'Dominican Republic super featherweight Eridson Garcia is set to make his highly anticipated return to the ring after a nine-month layoff, headlining the inaugural BiYu Brawl event. Garcia''s comeback represents more than just another fight; it marks a crucial stepping stone as he prepares for the next significant phase of his professional career.

The extended break from competition has allowed Garcia to refine his skills, address areas for improvement, and develop new dimensions to his already impressive fighting arsenal. Working closely with his training team, Garcia has used this time to enhance his technical abilities while maintaining the explosive power that has made him a feared competitor in the super featherweight division.

"This fight means everything to me," Garcia explained. "Nine months away from the ring gives you time to think, to improve, and to come back stronger than ever. I''m not just returning; I''m returning with a purpose."

Garcia''s preparation for this comeback has been meticulous and comprehensive. His training camp has focused on sharpening his boxing fundamentals while incorporating new strategic elements that will serve him well in future high-level competitions. The time away has also provided valuable perspective on his career goals and the steps necessary to achieve them.

The BiYu Brawl represents the perfect platform for Garcia''s return, offering him the opportunity to showcase his improvements in front of an enthusiastic crowd. The event''s significance extends beyond individual performance, as it establishes BiYu Promotions'' commitment to providing quality boxing entertainment and meaningful opportunities for their fighters.

As Garcia prepares for what he calls a "TKO switch," referring to his enhanced finishing ability, boxing fans can expect to see a more complete and dangerous version of the fighter they remember. His knockout ratio and technical skills have always been impressive, but the added seasoning from his time away promises to elevate his performance to new heights.

The super featherweight division remains one of boxing''s most competitive weight classes, filled with talented fighters all vying for championship opportunities. Garcia''s return comes at a time when the division is experiencing renewed interest, and his performance will play a crucial role in determining his position among the elite contenders.

Garcia''s team is confident that this comeback fight will demonstrate his readiness for the bigger challenges ahead. The months of preparation, combined with his natural talent and determination, have created the perfect storm for a memorable return performance.

Boxing enthusiasts should mark their calendars for the inaugural BiYu Brawl, as Garcia''s comeback promises to deliver the excitement and skill that have made him a fan favorite. The Dominican fighter is ready to remind everyone why he''s considered one of the division''s most promising talents.', 'Dominican Republic super featherweight returns after 9 months to headline inaugural BiYu Brawl, preparing for next career phase.', '/images/garciaready.webp', 'BiYu Promotions', 'General', 0, 1, '2025-04-24', '2025-09-05', '2025-04-24', 'published', 'garcia-ready-to-put-down-a-marker-ahead-of-tko-switch', 'Garcia Ready to Put Down a Marker Ahead of TKO Switch', 'Eridson Garcia returns after 9-month layoff to headline BiYu Brawl, showcasing improvements ahead of career''s next phase.', '"Eridson Garcia", "BiYu Brawl", "Comeback", "TKO Switch", "Super Featherweight"'),

('68ba8e572c7f1cc6a659d8ed', 'Treble Success for BiYu Fighters in Colombia', 'BiYu Promotions'' international fighters delivered outstanding performances on Colombian soil, with Chavon Davis, Rafael Abreu, and Eliesel Rodriguez Ledesma all extending their unbeaten records in impressive fashion. Competing in hostile territory presented unique challenges, but the trio''s professional approach and superior skills proved decisive in securing victories that further enhanced their rising profiles.

The Colombian expedition represented more than just individual fights; it demonstrated BiYu Promotions'' commitment to providing their fighters with diverse experiences and meaningful competition across different markets. Fighting away from home requires mental fortitude, adaptability, and supreme confidence in one''s abilities - qualities that all three fighters displayed in abundance.

Chavon Davis opened the successful campaign with a commanding performance that showcased his developing skills and ring maturity. Despite facing a determined local opponent backed by an enthusiastic hometown crowd, Davis remained composed and executed his game plan flawlessly. His ability to perform under pressure in unfamiliar surroundings speaks volumes about his championship potential.

Rafael Abreu continued his impressive unbeaten streak with a display that combined technical excellence with crowd-pleasing aggression. The Dominican Republic native''s performance in Colombia further established his reputation as one of the super welterweight division''s most promising prospects. His adaptability and professional approach to fighting in different environments will serve him well as he progresses toward title contention.

Completing the perfect trifecta was Eliesel Rodriguez Ledesma, whose victory extended his unbeaten record and reinforced his status as a rising force in the super featherweight division. Rodriguez Ledesma''s performance demonstrated the depth of talent within BiYu Promotions'' stable and highlighted the organization''s ability to develop fighters capable of competing successfully on any stage.

"These performances in Colombia show the quality and character of our fighters," commented BiYu Promotions representatives. "Competing away from home against motivated opponents requires special mental strength, and all three of our fighters showed they have what it takes to succeed at the highest level."

The Colombian success story reflects BiYu Promotions'' broader strategy of exposing their fighters to diverse competitive environments while building their experience and confidence. International competition provides invaluable learning opportunities and helps prepare fighters for the global nature of professional boxing at the championship level.

For Davis, Abreu, and Rodriguez Ledesma, the Colombian victories represent important stepping stones in their respective career trajectories. Each fighter gained valuable experience while maintaining their unbeaten records, positioning themselves for more significant opportunities in the future.

The successful Colombian campaign also strengthens BiYu Promotions'' international reputation and opens doors for future events and partnerships in South American markets. Building relationships across different regions creates opportunities for compelling matchmaking and broader exposure for their fighters.

As these three fighters continue their development under the BiYu Promotions banner, their Colombian success serves as proof of their ability to compete successfully regardless of location or circumstances. The boxing world should take notice of this emerging talent as they continue their ascent toward championship contention.', 'Chavon Davis, Rafael Abreu, and Eliesel Rodriguez Ledesma all extended their unbeaten records with impressive victories in hostile territory.', '/images/treblesuccess.webp', 'BiYu Promotions', 'General', 0, 1, '2025-01-10', '2025-09-05', '2025-01-10', 'published', 'treble-success-for-biyu-fighters-in-colombia', 'Treble Success for BiYu Fighters in Colombia', 'Three BiYu Promotions fighters maintain unbeaten records with impressive victories in Colombia, showcasing international capabilities.', '"Chavon Davis", "Rafael Abreu", "Eliesel Rodriguez Ledesma", "Colombia", "International"');

-- Insert Settings
INSERT INTO settings VALUES 
('68b6a997aa59fa24cf02663e', 'general', 'BiYu Boxing', 'Professional Boxing Training', '2025-09-02', 'system');