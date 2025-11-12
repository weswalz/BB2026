# BiYu Boxing Website - Implementation Tasks

**Created:** 2025-10-03
**Status:** Ready for Implementation
**Estimated Total Effort:** ~10-12 hours

---

## ⚠️ IMPORTANT: Pre-Task Requirements

**BEFORE starting ANY task:**

1. ✅ Read `/var/www/biyuboxing/ARCHITECTURE.md` (complete system documentation)
2. ✅ Read `/var/www/biyuboxing/ADMIN_PANEL_AUDIT.md` (findings and current state)
3. ✅ Backup the database:
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db ".backup /var/www/biyuboxing/database/backups/pre-tasks-$(date +%Y%m%d_%H%M%S).db"
   ```
4. ✅ Test on staging environment first (if available)
5. ✅ Verify each change immediately after implementation

---

## Phase 1: Database Schema Corrections (Critical)

**Priority:** 🔴 CRITICAL - Must complete before other tasks
**Estimated Time:** 30 minutes
**Dependencies:** None

### Task 1.1: Add Missing Columns to Events Table

**Research Completed:** ✅
- Verified current schema lacks `featured`, `createdAt`, `updatedAt`
- Confirmed `src/lib/events.js` expects these columns (lines 52, 54-55, 74, 108)
- Confirmed admin form will fail when saving featured status

**Implementation Steps:**

1. **Verify current schema:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "PRAGMA table_info(events);"
   ```
   Expected: NO columns named `featured`, `createdAt`, `updatedAt`

2. **Add columns:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   ALTER TABLE events ADD COLUMN featured INTEGER DEFAULT 0;
   ALTER TABLE events ADD COLUMN createdAt TEXT;
   ALTER TABLE events ADD COLUMN updatedAt TEXT;
   EOF
   ```

3. **Populate timestamps for existing records:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "UPDATE events SET createdAt = datetime('now'), updatedAt = datetime('now') WHERE createdAt IS NULL;"
   ```

4. **Verify columns added:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "PRAGMA table_info(events);" | grep -E "(featured|createdAt|updatedAt)"
   ```
   Expected output: 3 lines showing the new columns

5. **Test with sample query:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "SELECT id, title, featured, createdAt, updatedAt FROM events LIMIT 1;"
   ```
   Expected: Should return data without errors

**Verification Checklist:**
- [ ] Schema shows 3 new columns
- [ ] Existing events have timestamps populated
- [ ] Featured defaults to 0
- [ ] No SQL errors when querying

**Rollback Plan (if needed):**
```bash
# SQLite doesn't support DROP COLUMN easily - restore from backup
sqlite3 /var/www/biyuboxing/database/biyuboxing.db ".restore /var/www/biyuboxing/database/backups/[backup-file]"
```

---

### Task 1.2: Add Missing Columns to News Table

**Research Completed:** ✅
- Verified current schema lacks `category`, `seoTitle`, `seoDescription`, `tags`
- Confirmed `src/lib/news.js` expects these columns (lines 44, 52-53, 54, 87-89)
- Confirmed SEO fields won't save without these columns

**Implementation Steps:**

1. **Verify current schema:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "PRAGMA table_info(news);"
   ```
   Expected: NO columns named `category`, `seoTitle`, `seoDescription`, `tags`

2. **Add columns:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   ALTER TABLE news ADD COLUMN category TEXT DEFAULT 'General';
   ALTER TABLE news ADD COLUMN seoTitle TEXT;
   ALTER TABLE news ADD COLUMN seoDescription TEXT;
   ALTER TABLE news ADD COLUMN tags TEXT;
   EOF
   ```

3. **Populate SEO fields from existing data:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   UPDATE news SET
     seoTitle = title,
     seoDescription = excerpt,
     category = 'General'
   WHERE seoTitle IS NULL;
   EOF
   ```

4. **Verify columns added:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "PRAGMA table_info(news);" | grep -E "(category|seoTitle|seoDescription|tags)"
   ```
   Expected output: 4 lines showing the new columns

5. **Test with sample query:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "SELECT id, title, category, seoTitle, tags FROM news LIMIT 1;"
   ```
   Expected: Should return data without errors

**Verification Checklist:**
- [ ] Schema shows 4 new columns
- [ ] Existing news articles have SEO fields populated
- [ ] Category defaults to 'General'
- [ ] No SQL errors when querying

---

### Task 1.3: Create Globals Table

**Research Completed:** ✅
- Verified globals table does NOT exist (`.tables` command shows only: events, fighters, news, pages)
- Confirmed `src/lib/globals.js` has placeholder functions only (lines 2-21)
- Confirmed admin route exists: `src/pages/admin/globals/vip-signup.astro`

**Implementation Steps:**

1. **Verify table doesn't exist:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db ".tables" | grep globals
   ```
   Expected: No output (table doesn't exist)

2. **Create globals table:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   CREATE TABLE IF NOT EXISTS globals (
     key TEXT PRIMARY KEY,
     value TEXT,
     type TEXT DEFAULT 'text',
     label TEXT,
     description TEXT,
     updatedAt TEXT NOT NULL
   );
   EOF
   ```

3. **Seed initial global settings:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   INSERT INTO globals (key, value, type, label, description, updatedAt) VALUES
     ('site_name', 'BiYu Promotions', 'text', 'Site Name', 'The name of the website', datetime('now')),
     ('site_tagline', 'Fighting For Legacy, Driven by Culture', 'text', 'Site Tagline', 'Main tagline displayed on homepage', datetime('now')),
     ('contact_email', 'info@biyuboxing.com', 'text', 'Contact Email', 'Primary contact email address', datetime('now')),
     ('contact_phone', '+1-346-268-1590', 'text', 'Contact Phone', 'Primary contact phone number', datetime('now')),
     ('contact_address', 'Houston, TX', 'text', 'Contact Address', 'Business address', datetime('now')),
     ('vip_signup_enabled', '1', 'boolean', 'VIP Signup Enabled', 'Enable/disable VIP signup form', datetime('now')),
     ('vip_signup_title', 'Join Our VIP List', 'text', 'VIP Signup Title', 'Title shown on VIP signup form', datetime('now')),
     ('vip_signup_text', 'Get exclusive updates on upcoming events', 'text', 'VIP Signup Text', 'Description text for VIP signup', datetime('now')),
     ('footer_copyright', '© 2025 BiYu Promotions. All rights reserved.', 'text', 'Footer Copyright', 'Copyright text in footer', datetime('now')),
     ('social_facebook', '', 'text', 'Facebook URL', 'Facebook page URL', datetime('now')),
     ('social_instagram', 'https://instagram.com/biyuboxing', 'text', 'Instagram URL', 'Instagram profile URL', datetime('now')),
     ('social_twitter', 'https://twitter.com/biyuboxing', 'text', 'Twitter URL', 'Twitter profile URL', datetime('now')),
     ('social_youtube', '', 'text', 'YouTube URL', 'YouTube channel URL', datetime('now'));
   EOF
   ```

4. **Verify table created and data inserted:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "SELECT COUNT(*) FROM globals;"
   ```
   Expected output: 13

5. **View sample data:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "SELECT key, value, type FROM globals LIMIT 5;"
   ```
   Expected: Shows 5 rows of settings

**Verification Checklist:**
- [ ] Globals table exists
- [ ] 13 initial settings inserted
- [ ] All required fields populated
- [ ] No SQL errors

---

## Phase 2: Implement Globals CRUD Functions

**Priority:** 🔴 CRITICAL
**Estimated Time:** 1.5 hours
**Dependencies:** Task 1.3 (globals table must exist)

### Task 2.1: Implement Globals Functions in src/lib/globals.js

**Research Completed:** ✅
- Read current file: All functions are placeholders
- Verified pattern from `src/lib/pages.js` (lines 6-53) for similar key-value storage
- Confirmed admin panel needs: `getGlobal()`, `getAllGlobals()`, `updateGlobal()`

**Current File Location:** `src/lib/globals.js`

**Implementation Steps:**

1. **Read current file to preserve any imports:**
   ```bash
   cat /var/www/biyuboxing/src/lib/globals.js
   ```

2. **Replace entire file with functional implementation:**

   ```javascript
   // src/lib/globals.js
   import { connectToDatabase } from './database.js';

   /**
    * Get a single global setting by key
    * @param {string} key - Setting key
    * @returns {Object|null} - Setting object or null
    */
   export function getGlobal(key) {
     const db = connectToDatabase();
     try {
       const stmt = db.prepare('SELECT * FROM globals WHERE key = ?');
       const setting = stmt.get(key);
       return setting || null;
     } catch (error) {
       console.error(`❌ Error fetching global setting ${key}:`, error.message);
       return null;
     }
   }

   /**
    * Get all global settings
    * @returns {Array} - Array of all settings
    */
   export function getAllGlobals() {
     const db = connectToDatabase();
     try {
       const stmt = db.prepare('SELECT * FROM globals ORDER BY key');
       const settings = stmt.all();
       console.log(`✅ Retrieved ${settings.length} global settings`);
       return settings;
     } catch (error) {
       console.error('❌ Error fetching global settings:', error.message);
       return [];
     }
   }

   /**
    * Get all globals as a key-value object
    * @returns {Object} - Object with key-value pairs
    */
   export function getGlobalsObject() {
     const settings = getAllGlobals();
     const obj = {};
     for (const setting of settings) {
       // Convert boolean strings to actual booleans
       if (setting.type === 'boolean') {
         obj[setting.key] = setting.value === '1' || setting.value === 'true';
       } else {
         obj[setting.key] = setting.value;
       }
     }
     return obj;
   }

   /**
    * Update a global setting
    * @param {string} key - Setting key
    * @param {string} value - New value
    * @returns {boolean} - Success status
    */
   export function updateGlobal(key, value) {
     const db = connectToDatabase();
     const now = new Date().toISOString();

     try {
       // Check if setting exists
       const existing = getGlobal(key);

       if (existing) {
         // Update existing
         const stmt = db.prepare('UPDATE globals SET value = ?, updatedAt = ? WHERE key = ?');
         stmt.run(value, now, key);
         console.log(`✅ Updated global setting: ${key}`);
         return true;
       } else {
         // Create new
         const stmt = db.prepare(
           'INSERT INTO globals (key, value, type, label, updatedAt) VALUES (?, ?, ?, ?, ?)'
         );
         stmt.run(key, value, 'text', key, now);
         console.log(`✅ Created global setting: ${key}`);
         return true;
       }
     } catch (error) {
       console.error(`❌ Error updating global setting ${key}:`, error.message);
       return false;
     }
   }

   /**
    * Update multiple globals at once
    * @param {Object} settings - Object with key-value pairs to update
    * @returns {boolean} - Success status
    */
   export function updateGlobals(settings) {
     const db = connectToDatabase();
     const now = new Date().toISOString();

     try {
       const transaction = db.transaction(() => {
         for (const [key, value] of Object.entries(settings)) {
           const existing = getGlobal(key);
           if (existing) {
             const stmt = db.prepare('UPDATE globals SET value = ?, updatedAt = ? WHERE key = ?');
             stmt.run(value, now, key);
           }
         }
       });

       transaction();
       console.log(`✅ Updated ${Object.keys(settings).length} global settings`);
       return true;
     } catch (error) {
       console.error('❌ Error updating global settings:', error.message);
       return false;
     }
   }

   /**
    * Delete a global setting
    * @param {string} key - Setting key to delete
    * @returns {boolean} - Success status
    */
   export function deleteGlobal(key) {
     const db = connectToDatabase();
     try {
       const stmt = db.prepare('DELETE FROM globals WHERE key = ?');
       const result = stmt.run(key);
       if (result.changes > 0) {
         console.log(`✅ Deleted global setting: ${key}`);
         return true;
       }
       console.log(`⚠️ Global setting not found: ${key}`);
       return false;
     } catch (error) {
       console.error(`❌ Error deleting global setting ${key}:`, error.message);
       return false;
     }
   }

   /**
    * Legacy function for compatibility
    */
   export function getSiteSettings() {
     return getGlobalsObject();
   }

   /**
    * Legacy function for compatibility
    */
   export function getGlobalSettings() {
     return getGlobalsObject();
   }
   ```

3. **Save the file:**
   ```bash
   # File will be written via Write tool
   ```

4. **Test functions via Node REPL:**
   ```bash
   cd /var/www/biyuboxing
   node <<EOF
   import { getGlobal, getAllGlobals, updateGlobal } from './src/lib/globals.js';

   // Test getGlobal
   const siteName = getGlobal('site_name');
   console.log('Site Name:', siteName);

   // Test getAllGlobals
   const all = getAllGlobals();
   console.log('Total settings:', all.length);

   // Test updateGlobal
   const success = updateGlobal('site_name', 'BiYu Promotions - Updated');
   console.log('Update success:', success);

   // Verify update
   const updated = getGlobal('site_name');
   console.log('Updated value:', updated.value);
   EOF
   ```

**Verification Checklist:**
- [ ] File saved successfully
- [ ] No syntax errors when importing
- [ ] `getGlobal()` returns correct data
- [ ] `getAllGlobals()` returns 13 settings
- [ ] `updateGlobal()` successfully updates values
- [ ] Database is updated (check with `SELECT * FROM globals WHERE key='site_name'`)

---

## Phase 3: Seed Pages Table with Initial Data

**Priority:** 🔴 CRITICAL
**Estimated Time:** 1 hour
**Dependencies:** None (pages table already exists)

### Task 3.1: Seed Pages Table with CMS Content

**Research Completed:** ✅
- Verified pages table exists but is EMPTY (confirmed via `SELECT * FROM pages`)
- Reviewed `src/pages/index.astro` - uses `getField()` which returns defaults when pages table is empty
- Identified all admin page editors:
  - `/admin/pages/home.astro` (lines 66-143)
  - `/admin/pages/about-us.astro`
  - `/admin/pages/box-for-us.astro`
  - `/admin/pages/contact-us.astro`
  - `/admin/pages/upcoming-events.astro`
  - `/admin/pages/previous-events.astro`
  - `/admin/pages/news-listing.astro`
  - `/admin/pages/404.astro`

**Implementation Steps:**

1. **Verify pages table is empty:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "SELECT COUNT(*) FROM pages;"
   ```
   Expected output: 0

2. **Read admin page editor to understand field structure:**
   ```bash
   grep -A 50 "fieldset" /var/www/biyuboxing/src/pages/admin/pages/home.astro
   ```
   This shows all fields that need to be in JSON content

3. **Insert home page data:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   INSERT INTO pages (id, content, createdAt, updatedAt) VALUES (
     'home',
     '{
       "seoTitle": "BiYu Promotions - Boxing Promotions in Houston, Texas",
       "seoDescription": "Fighting For Legacy, Driven by Culture. Professional boxing promotion company based in Houston with operations in Tampa and Santo Domingo.",
       "heroImage": "/images/biyoubrawl3banner.jpg",
       "heroTitle": "BIYU PROMOTIONS",
       "heroSubtitle": "Fighting For Legacy, Driven by Culture",
       "latestNewsTitle": "<span class=\"biyu-title-yellow text-gradient\">latest</span> <span class=\"biyu-title-white\">News</span>",
       "upcomingEventsTitle": "UPCOMING EVENTS",
       "noEventsTitle": "Stay Tuned for Upcoming Events",
       "noEventsText": "Check back soon for our next exciting boxing event!",
       "boxForUsTitle": "BOX FOR US",
       "boxForUsText": "If you are a talented boxer seeking to carve out a career in the professional ranks then we want to hear from you.",
       "boxForUsImage": "/images/home/fighter-training.jpg",
       "companyInfoImage": "/images/home/gloves-hero.png",
       "companyInfoLogo": "/images/logos/logo-white.png",
       "companyInfoParagraph1": "BiYu Promotions is a professional boxing promotion company dedicated to developing world-class fighters.",
       "companyInfoParagraph2": "Founded by Bobby Harrison, a licensed promoter with over 15 years of experience in the sport.",
       "companyInfoParagraph3": "We operate in Houston, Tampa, and Santo Domingo, providing comprehensive support to our fighters."
     }',
     datetime('now'),
     datetime('now')
   );
   EOF
   ```

4. **Insert about-us page data:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   INSERT INTO pages (id, content, createdAt, updatedAt) VALUES (
     'about-us',
     '{
       "pageTitle": "About BiYu Promotions",
       "heroImage": "/images/about/about-hero.jpg",
       "aboutContent": "BiYu Promotions is dedicated to developing elite boxing talent...",
       "missionStatement": "Fighting For Legacy, Driven by Culture",
       "founderName": "Bobby Harrison",
       "founderTitle": "CEO & Licensed Boxing Promoter",
       "founderBio": "With over 15 years of experience in professional boxing..."
     }',
     datetime('now'),
     datetime('now')
   );
   EOF
   ```

5. **Insert box-for-us page data:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   INSERT INTO pages (id, content, createdAt, updatedAt) VALUES (
     'box-for-us',
     '{
       "pageTitle": "Box For Us - Join BiYu Promotions",
       "heroTitle": "BOX FOR US",
       "heroSubtitle": "Take Your Boxing Career to the Next Level",
       "heroImage": "/images/box-for-us/hero.jpg",
       "introText": "If you are a talented boxer seeking to carve out a career in the professional ranks, we want to hear from you.",
       "requirementsTitle": "What We Look For",
       "requirementsText": "We seek dedicated fighters with professional potential, strong work ethic, and championship aspirations.",
       "processTitle": "Application Process",
       "processText": "Submit your application below with your boxing record, videos, and contact information. Our team will review and respond within 48 hours.",
       "benefitsTitle": "What We Offer",
       "benefitsText": "Professional management, training support, fight opportunities, and career development."
     }',
     datetime('now'),
     datetime('now')
   );
   EOF
   ```

6. **Insert contact-us page data:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   INSERT INTO pages (id, content, createdAt, updatedAt) VALUES (
     'contact-us',
     '{
       "pageTitle": "Contact BiYu Promotions",
       "heroTitle": "Get In Touch",
       "contactEmail": "info@biyuboxing.com",
       "contactPhone": "+1-346-268-1590",
       "officeHours": "Monday - Friday, 9AM - 5PM CST",
       "addressHouston": "Houston, Texas",
       "addressTampa": "Tampa, Florida",
       "addressDR": "Santo Domingo, Dominican Republic"
     }',
     datetime('now'),
     datetime('now')
   );
   EOF
   ```

7. **Insert remaining page stubs:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db <<EOF
   INSERT INTO pages (id, content, createdAt, updatedAt) VALUES
     ('upcoming-events', '{"pageTitle":"Upcoming Events"}', datetime('now'), datetime('now')),
     ('previous-events', '{"pageTitle":"Previous Events"}', datetime('now'), datetime('now')),
     ('news-listing', '{"pageTitle":"News & Updates"}', datetime('now'), datetime('now')),
     ('404', '{"pageTitle":"Page Not Found","errorMessage":"The page you are looking for does not exist."}', datetime('now'), datetime('now'));
   EOF
   ```

8. **Verify all pages inserted:**
   ```bash
   sqlite3 /var/www/biyuboxing/database/biyuboxing.db "SELECT id, substr(content, 1, 50) as preview FROM pages;"
   ```
   Expected output: 8 rows

9. **Test that getPage() returns data:**
   ```bash
   cd /var/www/biyuboxing
   node <<EOF
   import { getPage } from './src/lib/pages.js';
   const home = getPage('home');
   console.log('Home page fields:', Object.keys(home.fields));
   console.log('Hero title:', home.fields.heroTitle);
   EOF
   ```

**Verification Checklist:**
- [ ] 8 pages inserted successfully
- [ ] JSON content is valid (no syntax errors)
- [ ] `getPage('home')` returns data with fields
- [ ] All field keys match what admin forms expect

---

## Phase 4: Add DELETE Functionality to Admin Panels

**Priority:** 🟡 HIGH
**Estimated Time:** 2 hours
**Dependencies:** None

### Task 4.1: Add DELETE API Routes

**Research Completed:** ✅
- Confirmed API routes exist: `src/pages/api/fighters.js`, `src/pages/api/events.js`
- Current routes only handle GET (read)
- Backend delete functions exist: `deleteFighter()`, `deleteEvent()`, `deleteNews()` in respective lib files
- Need to add POST handler with `_method=DELETE` pattern

**Implementation Steps:**

**For Fighters API (`src/pages/api/fighters.js`):**

1. **Read current file:**
   ```bash
   cat /var/www/biyuboxing/src/pages/api/fighters.js
   ```

2. **Add DELETE handler:**
   ```javascript
   // Add to src/pages/api/fighters.js
   import { getAllFighters, deleteFighter } from '../../lib/fighters.js';

   export async function GET() {
     // ... existing GET code ...
   }

   export async function POST({ request }) {
     try {
       const formData = await request.formData();
       const method = formData.get('_method');
       const id = formData.get('id');

       if (method === 'DELETE' && id) {
         const success = deleteFighter(id);
         if (success) {
           return new Response(JSON.stringify({ success: true, message: 'Fighter deleted' }), {
             status: 200,
             headers: { 'Content-Type': 'application/json' }
           });
         } else {
           return new Response(JSON.stringify({ success: false, message: 'Fighter not found' }), {
             status: 404,
             headers: { 'Content-Type': 'application/json' }
           });
         }
       }

       return new Response(JSON.stringify({ success: false, message: 'Invalid request' }), {
         status: 400,
         headers: { 'Content-Type': 'application/json' }
       });
     } catch (error) {
       console.error('Error in fighters API:', error);
       return new Response(JSON.stringify({ success: false, message: 'Server error' }), {
         status: 500,
         headers: { 'Content-Type': 'application/json' }
       });
     }
   }
   ```

3. **Test DELETE API:**
   ```bash
   # Create test fighter first
   curl -X POST http://localhost:4321/api/fighters \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Fighter","record":"0-0-0"}'

   # Delete (use actual ID from create response)
   curl -X POST http://localhost:4321/api/fighters \
     -d "_method=DELETE&id=[fighter-id]"
   ```

**Repeat for Events API (`src/pages/api/events.js`):**
- Import `deleteEvent` from `../../lib/events.js`
- Add same POST handler pattern
- Test with curl

**Repeat for News API (create if doesn't exist: `src/pages/api/news.js`):**
- Import `deleteNews` from `../../lib/news.js`
- Add GET and POST handlers
- Test with curl

**Verification Checklist:**
- [ ] DELETE works for fighters (returns 200 success)
- [ ] DELETE works for events
- [ ] DELETE works for news
- [ ] Invalid ID returns 404
- [ ] Missing parameters return 400
- [ ] Database records actually deleted (verify with `SELECT * FROM fighters WHERE id='[deleted-id]'`)

---

### Task 4.2: Add DELETE Buttons to Admin List Pages

**Research Completed:** ✅
- Reviewed `src/pages/admin/fighters.astro` - list page exists
- Confirmed no delete buttons currently present
- Need to add form with confirmation

**Implementation Steps:**

**For Fighters List (`src/pages/admin/fighters.astro`):**

1. **Locate the table row where edit button is:**
   ```bash
   grep -n "Edit" /var/www/biyuboxing/src/pages/admin/fighters.astro
   ```

2. **Add delete button next to edit button:**
   ```astro
   <td class="actions">
     <a href={`/admin/fighters/edit/${fighter.id}`} class="btn-edit">Edit</a>
     <form method="POST" action="/api/fighters" style="display:inline" onsubmit="return confirm('Are you sure you want to delete this fighter? This cannot be undone.');">
       <input type="hidden" name="_method" value="DELETE" />
       <input type="hidden" name="id" value={fighter.id} />
       <button type="submit" class="btn-delete">Delete</button>
     </form>
   </td>
   ```

3. **Add CSS styles for delete button:**
   ```css
   .btn-delete {
     background: #dc2626;
     color: white;
     padding: 0.5rem 1rem;
     border: none;
     border-radius: 4px;
     cursor: pointer;
     margin-left: 0.5rem;
   }
   .btn-delete:hover {
     background: #b91c1c;
   }
   .actions form {
     display: inline-block;
   }
   ```

4. **Handle POST response to show message:**
   ```astro
   ---
   let message = null;

   if (Astro.request.method === 'POST') {
     const formData = await Astro.request.formData();
     const method = formData.get('_method');
     const id = formData.get('id');

     if (method === 'DELETE') {
       const response = await fetch(`${Astro.url.origin}/api/fighters`, {
         method: 'POST',
         body: formData
       });
       const result = await response.json();

       if (result.success) {
         message = { type: 'success', text: 'Fighter deleted successfully' };
       } else {
         message = { type: 'error', text: result.message || 'Failed to delete fighter' };
       }
     }
   }

   const fighters = await getAllFighters();
   ---

   {message && (
     <div class={`alert alert-${message.type}`}>
       {message.text}
     </div>
   )}
   ```

**Repeat for Events List (`src/pages/admin/events.astro`):**
- Add delete button with same pattern
- Use `/api/events` endpoint
- Add confirmation dialog

**Repeat for News List (`src/pages/admin/news.astro`):**
- Add delete button with same pattern
- Use `/api/news` endpoint
- Add confirmation dialog

**Verification Checklist:**
- [ ] Delete buttons appear on all list pages
- [ ] Clicking delete shows confirmation dialog
- [ ] Confirming delete removes item from database
- [ ] Page refreshes and shows success message
- [ ] Item no longer appears in list
- [ ] Canceling confirmation does nothing

---

## Phase 5: Form Validation & User Feedback

**Priority:** 🟡 HIGH
**Estimated Time:** 2 hours
**Dependencies:** None

### Task 5.1: Add Client-Side Validation to Admin Forms

**Research Completed:** ✅
- Reviewed `src/pages/admin/fighters/new.astro` (lines 74-130)
- Some fields have `required` attribute but no pattern validation
- No length limits
- No type validation

**Implementation Steps:**

**For Fighter Form (`src/pages/admin/fighters/new.astro` and `edit/[id].astro`):**

1. **Add validation attributes:**
   ```html
   <!-- Name field -->
   <input
     type="text"
     id="name"
     name="name"
     required
     minlength="2"
     maxlength="100"
     pattern="[A-Za-z\s\-']+"
     title="Name can only contain letters, spaces, hyphens, and apostrophes"
   />

   <!-- Record field -->
   <input
     type="text"
     id="record"
     name="record"
     required
     pattern="\d+-\d+-\d+"
     placeholder="e.g., 10-0-0"
     title="Record must be in format: wins-losses-draws (e.g., 10-0-0)"
   />

   <!-- Height field -->
   <input
     type="text"
     id="height"
     name="height"
     pattern="[0-9]'[0-9]{1,2}\"?"
     placeholder="e.g., 6'2&quot;"
     title="Height must be in format: feet'inches (e.g., 6'2)"
   />

   <!-- Weight field -->
   <input
     type="text"
     id="weight"
     name="weight"
     pattern="\d+\s?(lbs?|kg)"
     placeholder="e.g., 205 lbs"
     title="Weight must include unit (lbs or kg)"
   />
   ```

2. **Add CSS for validation feedback:**
   ```css
   input:invalid {
     border-color: #dc2626;
   }
   input:valid {
     border-color: #10b981;
   }
   input:invalid:focus {
     outline-color: #dc2626;
   }
   .help-text.error {
     color: #dc2626;
     font-weight: 500;
   }
   ```

**Repeat for Event Form (`src/pages/admin/events/new.astro`):**
- Title: required, minlength=3, maxlength=200
- Date: type="datetime-local", required
- Venue: maxlength=200
- Ticket URL: type="url" (if provided)

**Repeat for News Form (`src/pages/admin/news/new.astro`):**
- Title: required, minlength=3, maxlength=200
- Excerpt: maxlength=300
- Content: required, minlength=10

**Verification Checklist:**
- [ ] Invalid input shows red border
- [ ] Valid input shows green border
- [ ] Form cannot be submitted with invalid data
- [ ] Browser shows helpful error messages
- [ ] All required fields enforced

---

### Task 5.2: Add Server-Side Validation

**Research Completed:** ✅
- Reviewed POST handlers in admin pages
- Currently no validation before calling create/update functions
- Need to sanitize and validate all user input

**Implementation Steps:**

**Create Validation Helper (`src/lib/validation.js`):**

```javascript
// src/lib/validation.js

export function validateFighterData(data) {
  const errors = [];

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (data.name && data.name.length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }
  if (data.name && !/^[A-Za-z\s\-']+$/.test(data.name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  // Record validation
  if (!data.record || !/^\d+-\d+-\d+$/.test(data.record)) {
    errors.push('Record must be in format: wins-losses-draws (e.g., 10-0-0)');
  }

  // Weight class validation
  if (!data.weightClass || data.weightClass.trim().length < 2) {
    errors.push('Weight class is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEventData(data) {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (!data.date) {
    errors.push('Event date is required');
  }
  if (data.date && isNaN(new Date(data.date).getTime())) {
    errors.push('Invalid date format');
  }
  if (data.ticketUrl && !isValidUrl(data.ticketUrl)) {
    errors.push('Invalid ticket URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateNewsData(data) {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (!data.content || data.content.trim().length < 10) {
    errors.push('Content must be at least 10 characters');
  }
  if (data.excerpt && data.excerpt.length > 300) {
    errors.push('Excerpt cannot exceed 300 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function sanitizeString(str, maxLength = 1000) {
  if (!str) return '';
  return str.trim().substring(0, maxLength);
}
```

**Update Fighter Create Page (`src/pages/admin/fighters/new.astro`):**

```astro
---
import { createFighter } from '../../../lib/fighters.js';
import { validateFighterData, sanitizeString } from '../../../lib/validation.js';

let message = null;

if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData();

  const fighterData = {
    name: sanitizeString(formData.get('name'), 100),
    nickname: sanitizeString(formData.get('nickname'), 50),
    record: sanitizeString(formData.get('record'), 20),
    weightClass: sanitizeString(formData.get('weightClass'), 50),
    // ... other fields ...
  };

  // Validate
  const validation = validateFighterData(fighterData);

  if (!validation.isValid) {
    message = {
      type: 'error',
      text: 'Validation errors: ' + validation.errors.join(', ')
    };
  } else {
    // Save
    const result = await createFighter(fighterData);

    if (result) {
      message = { type: 'success', text: 'Fighter created successfully!' };
      // Optionally redirect after 2 seconds
      // return Astro.redirect('/admin/fighters');
    } else {
      message = { type: 'error', text: 'Failed to create fighter. Please try again.' };
    }
  }
}
---
```

**Repeat pattern for:**
- Event create/edit pages
- News create/edit pages
- Page editor forms

**Verification Checklist:**
- [ ] Invalid data rejected with helpful error message
- [ ] XSS attempts sanitized (test with `<script>alert('xss')</script>`)
- [ ] SQL injection attempts blocked (prepared statements already handle this)
- [ ] Max length limits enforced
- [ ] Valid data saves successfully

---

## Phase 6: Testing & Verification

**Priority:** 🟢 MEDIUM
**Estimated Time:** 2 hours
**Dependencies:** All previous tasks

### Task 6.1: End-to-End CRUD Testing

**Test Matrix:**

| Entity | Create | Read | Update | Delete | Publish to Public |
|--------|--------|------|--------|--------|-------------------|
| Fighter | [ ] | [ ] | [ ] | [ ] | [ ] |
| Event | [ ] | [ ] | [ ] | [ ] | [ ] |
| News | [ ] | [ ] | [ ] | [ ] | [ ] |
| Page (Home) | N/A | [ ] | [ ] | N/A | [ ] |
| Globals | N/A | [ ] | [ ] | N/A | [ ] |

**Testing Procedure for Each Entity:**

1. **Create Test:**
   - Navigate to `/admin/[entity]/new`
   - Fill form with test data
   - Submit
   - Verify success message appears
   - Check database: `SELECT * FROM [entity] WHERE id='[new-id]'`
   - Verify appears in `/admin/[entity]` list

2. **Read Test:**
   - Navigate to `/admin/[entity]`
   - Verify all records appear
   - Check data is correct
   - Navigate to public page
   - Verify data displays correctly

3. **Update Test:**
   - Navigate to `/admin/[entity]/edit/[id]`
   - Verify form pre-populated with existing data
   - Change one field
   - Submit
   - Verify success message
   - Check database for updated value
   - Verify change appears on public page immediately

4. **Delete Test:**
   - Navigate to `/admin/[entity]` list
   - Click delete button
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify success message
   - Check database: record should be gone
   - Verify removed from public page

5. **SSR Update Test:**
   - Edit record via admin
   - Open public page in new browser tab
   - Verify change visible immediately (no cache)
   - Hard refresh (Ctrl+F5)
   - Verify change persists

**Verification Checklist:**
- [ ] All CRUD operations work for fighters
- [ ] All CRUD operations work for events
- [ ] All CRUD operations work for news
- [ ] Page edits update public pages immediately
- [ ] Globals edits update site-wide immediately
- [ ] No stale cache issues
- [ ] No database errors in logs

---

## Phase 7: Documentation Updates

**Priority:** 🔵 LOW
**Estimated Time:** 30 minutes
**Dependencies:** All tasks complete

### Task 7.1: Update ARCHITECTURE.md

**Steps:**

1. Mark completed TODOs in section 16 (Roadmap & TODOs)
2. Update section 6 (Admin Panel Architecture) with new functionality
3. Add database schema updates to section 7
4. Update "Unknown in Context" items with confirmed info

### Task 7.2: Update ADMIN_PANEL_AUDIT.md

**Steps:**

1. Change status from "INCOMPLETE" to "COMPLETE"
2. Update findings sections with ✅ for completed items
3. Add final test results

### Task 7.3: Create DEPLOYMENT_CHECKLIST.md

**Create quick reference for deploying admin changes:**

```markdown
# Admin Panel Deployment Checklist

## Pre-Deployment
- [ ] All tests pass (see TASKS.md Phase 6)
- [ ] Database backup created
- [ ] Changes tested on staging (if available)

## Deployment Steps
1. Backup database
2. Apply schema changes (if any)
3. Run `npm run build`
4. Run `pm2 restart biyuboxing`
5. Verify health: `curl http://localhost:4321/api/health`
6. Smoke test admin panel
7. Verify public pages update

## Rollback Plan
- Restore database from backup
- Revert code changes
- Rebuild and restart
```

---

## Final Checklist - Mark When ALL Tasks Complete

- [ ] **Phase 1:** Database schema corrections (Tasks 1.1-1.3)
- [ ] **Phase 2:** Globals CRUD implementation (Task 2.1)
- [ ] **Phase 3:** Pages table seeding (Task 3.1)
- [ ] **Phase 4:** DELETE functionality (Tasks 4.1-4.2)
- [ ] **Phase 5:** Validation & feedback (Tasks 5.1-5.2)
- [ ] **Phase 6:** End-to-end testing (Task 6.1)
- [ ] **Phase 7:** Documentation updates (Tasks 7.1-7.3)

**When all boxes checked:**
- Admin panel is 100% functional
- All CMS content is editable
- Database is complete
- Public pages update live via SSR
- Users can safely manage all content

---

## Notes & Warnings

⚠️ **CRITICAL SECURITY NOTE:**
This task list does NOT include implementing authentication. The admin panel will still be **publicly accessible** after these tasks. Authentication must be implemented separately before production use.

⚠️ **DATABASE BACKUP:**
Always backup before schema changes:
```bash
sqlite3 /var/www/biyuboxing/database/biyuboxing.db ".backup /var/www/biyuboxing/database/backups/backup-$(date +%Y%m%d_%H%M%S).db"
```

⚠️ **TESTING:**
Test each phase on staging before production. If no staging environment, test locally first.

⚠️ **PM2 RESTART:**
After any code changes:
```bash
npm run build
pm2 restart biyuboxing
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-03
**Estimated Completion:** 10-12 hours total
**Prerequisites:** ARCHITECTURE.md and ADMIN_PANEL_AUDIT.md must be read first
