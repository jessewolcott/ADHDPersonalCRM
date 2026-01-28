# ADHD Personal CRM

A personal relationship management application for tracking contacts, relationships, and interactions.

## Features

- **Contact Management**: Store and organize contact information
- **Relationship Linking**: Connect contacts with typed relationships (spouse, child, friend, coworker, etc.)
- **Journal Entries**: Track interactions with markdown support
- **Business Information**: Record employment history and work details
- **Full-Text Search**: Search across contacts, journal entries, and business info
- **Multi-User Support**: Each user has their own private contacts
- **Flexible Authentication**: Local email/password accounts or OAuth (Google, Microsoft, GitHub)
- **Data Import/Export**: Full JSON export and CSV contacts export

## Quick Server Install

For Ubuntu/Debian servers with a domain pointing to the server:

```bash
# Download and run the installer
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

The installer will:
- Install Node.js 20, nginx, PM2, certbot, fail2ban
- Clone the repo and build the app
- Configure SSL with Let's Encrypt
- Set up hourly auto-sync from git
- Configure fail2ban for security

## Project Structure

```
/
├── README.md           # This file
├── install.sh          # Server installation script
└── app/                # Application code
    ├── package.json
    ├── .env.example
    ├── vite.config.js
    ├── server/         # Express backend
    ├── client/         # React frontend
    └── data/           # SQLite database (gitignored)
```

## Local Development

### Prerequisites

- Node.js v20 or later
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ADHDPersonalCRM/app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. **(Optional)** Configure OAuth providers in `.env`:

   Local email/password authentication works out of the box. OAuth providers are optional:
   - **Google**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **Microsoft**: [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
   - **GitHub**: [GitHub Developer Settings](https://github.com/settings/developers)

5. Initialize the database:
   ```bash
   npm run db:init
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Production Build

```bash
npm run build
NODE_ENV=production npm start
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create local account
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Google OAuth login
- `GET /auth/microsoft` - Microsoft OAuth login
- `GET /auth/github` - GitHub OAuth login
- `GET /auth/logout` - Log out
- `GET /auth/me` - Get current user

### Contacts
- `GET /api/contacts` - List contacts
- `GET /api/contacts/:id` - Get contact details
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Relationships
- `GET /api/relationships/contact/:id` - Get relationships
- `POST /api/relationships/contact/:id` - Add relationship
- `DELETE /api/relationships/:id` - Remove relationship

### Journal
- `GET /api/journal/contact/:id` - Get entries
- `POST /api/journal/contact/:id` - Create entry
- `PUT /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry

### Business Info
- `GET /api/business/contact/:id` - Get business info
- `POST /api/business/contact/:id` - Add business info
- `PUT /api/business/:id` - Update business info
- `DELETE /api/business/:id` - Delete business info

### Search
- `GET /api/search?q=...` - Full-text search

### Data Management
- `GET /api/data/stats` - Get data statistics
- `GET /api/data/export/json` - Export all data as JSON
- `GET /api/data/export/csv` - Export contacts as CSV
- `POST /api/data/import/json` - Import data

## Server Management

After installation, use these commands:

```bash
update-site                    # Manually sync from git and rebuild
pm2 status                     # Check application status
pm2 logs personal-crm          # View application logs
pm2 restart personal-crm       # Restart the application
sudo fail2ban-client status    # Check fail2ban status
```

Auto-sync runs every hour. Logs are at `/var/log/crm-update.log`.

## License

MIT
