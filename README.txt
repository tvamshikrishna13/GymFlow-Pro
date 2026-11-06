GYMFLOW - GYM MEMBERSHIP MANAGEMENT SYSTEM
Built using the LabEase project you supplied as the design and structure reference.

TECH STACK
- HTML, CSS and JavaScript frontend
- Node.js + Express backend
- MySQL database (managed in MySQL Workbench)

SETUP
1. Run database/gym_management.sql in MySQL Workbench. If you already created the database tables, you can use your existing gym_management database instead; avoid running the CREATE statements again.
2. Open app.js and replace YOUR_MYSQL_PASSWORD with your MySQL root password.
3. Install Node.js if needed.
4. Open a terminal in this project folder and run:
   npm install
5. Start the server:
   npm start
6. Open:
   http://localhost:3000

PAGES
- index.html: Dashboard
- members.html: Search, view, edit and delete members
- memberForm.html: Add or edit member
- trainers.html / trainerForm.html: Trainer management
- plans.html / planForm.html: Membership plan management
- subscriptions.html / subscriptionForm.html: Subscription management
- viewRecord.html: Separate record details page
- about.html: Project information

DATABASE TABLES
members, trainers, membership_plans, subscriptions

IMPORTANT
- Add trainers before assigning trainers to members.
- Add members and plans before creating subscriptions.
- Subscription expiry dates are entered on the subscription form.
- The dashboard counts subscriptions as active when payment_status is Paid and end_date is today or later.
- This is a college-project starter, not production-ready authentication. Add login sessions, role authorization, password hashing, CSRF protection and stronger validation before public deployment.

THEME
Updated to a charcoal + electric-lime gym-inspired theme. Main background is soft neutral, navigation is charcoal, and key actions/highlights use lime green.

ADVANCED UI UPDATE
- Premium dark charcoal interface with electric-lime accents and animated hover states.
- Gym photography banner and image-led promotional section.
- Animated dashboard counters, global search shortcut (Ctrl+K), searchable data tables, toast feedback.
- Subscription expiry date can be auto-calculated from the selected plan duration and start date.
- Existing database remains unchanged; dashboard figures are computed from the four existing tables.

DASHBOARD INSIGHTS
- Paid subscription value is calculated from all subscriptions with payment_status='Paid'.
- Expiring soon shows subscriptions ending within the next 15 days.
- Expiry date is suggested automatically from the chosen plan duration when adding a new subscription; you can still edit it.
