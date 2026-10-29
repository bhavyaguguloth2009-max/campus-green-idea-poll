# Campus Green Ideas Board

A beginner-friendly full-stack college project where students can submit practical sustainability ideas for their campus. Visitors can browse approved ideas, search and filter by category, sort by popularity or date, and support ideas they like.

## 1. Problem statement

Students may have useful ideas to reduce waste, save water and energy, improve green spaces, or encourage cleaner transport, but no single place exists to collect them. GreenBoard provides a simple shared board for those suggestions.

## 2. Objectives

- Collect campus sustainability ideas in one place.
- Organize ideas into five categories.
- Let visitors explore and support approved ideas.
- Hold new submissions for review before they are public.
- Store records persistently in Supabase PostgreSQL.

## 3. Features

- Responsive home page and idea submission form.
- Server-side validation and request rate limiting.
- Search, category filtering, and popularity/newest sorting.
- Support/vote counter with an atomic PostgreSQL function.
- Pending-review status for newly submitted ideas.
- Health-check API endpoint.
- HTML escaping when rendering user-provided content.

**MVP limitation:** A moderator/admin screen is not included. New submissions are saved with `pending` status, so they will not appear publicly until an administrator approves them in Supabase Table Editor. The browser remembers which ideas a visitor supported using localStorage, but this is not strong identity verification; production deployments should add authenticated users and a `votes` table with a unique constraint per user/idea. Voting is not secure against deliberate abuse in this student MVP.

## 4. Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js and Express.js
- Supabase PostgreSQL
- Git and GitHub
- npm packages: `express`, `@supabase/supabase-js`, `dotenv`, `helmet`, `express-rate-limit`

## 5. Folder structure

```text
campus-green-ideas-board/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/
│   │   └── ideas.js
│   ├── middleware/
│   │   └── validate.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 6. Prerequisites

Install these tools on Windows:

- [Node.js LTS](https://nodejs.org/) (npm is included)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/downloads)
- A free [Supabase](https://supabase.com/) account

Open a terminal in VS Code using **Terminal → New Terminal**. Commands below should be run from the project root unless a step says otherwise.

Verify installations:

```bash
node --version
npm --version
git --version
```

Node.js should be version 20 or newer.

## 7. Set up Supabase

1. Sign in to [Supabase](https://supabase.com/) and create a new project.
2. Wait for the database to finish provisioning.
3. Open **SQL Editor → New query**.
4. Open `database/schema.sql`, copy all SQL, paste it into the editor, and click **Run**.
5. Open **Table Editor** and confirm that the `ideas` table exists.
6. In the project settings/API area, copy the project URL and the server-side secret/service-role key. Supabase may label the current privileged key as a `secret` key; use the server-only key, not a publishable/anon key.

Do not put a privileged key into the frontend, a screenshot, or GitHub.

## 8. Configure environment variables

The supplied `backend/.env` is a **placeholder template**. Edit it with your own values:

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-real-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-real-server-only-secret-key
```

- `PORT`: local server port.
- `NODE_ENV`: `development` while learning; set to `production` on a production host.
- `SUPABASE_URL`: URL shown in your Supabase project API settings.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged key used only by Express on the server.

`backend/.env.example` documents the required variable names with safe placeholders. Keep your actual values in `backend/.env`. Both root and backend `.gitignore` files exclude `.env`. If you accidentally publish a secret, rotate it in Supabase immediately.

## 9. Install and run

1. Extract the ZIP file.
2. Open the `campus-green-ideas-board` folder in VS Code.
3. Open the VS Code terminal and move into the backend directory:

   ```bash
   cd backend
   ```

4. Install the npm packages:

   ```bash
   npm install
   ```

   This creates `backend/node_modules/` and `backend/package-lock.json` on your computer. They are not included in the ZIP.

5. Confirm JavaScript syntax:

   ```bash
   npm run check
   ```

6. Start the server:

   ```bash
   npm start
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser. Check [http://localhost:3000/api/health](http://localhost:3000/api/health) to see the API health response.

Keep the terminal open while using the app. For development auto-restart, use `npm run dev`.

## 10. How to use it

1. Browse the approved ideas on the home page.
2. Use the search box, category chips, or sorting menu.
3. Use **Share an idea** to submit a title, category, name, and description.
4. After submission, the app shows a review message.
5. To approve a submission for a classroom demo, open Supabase **Table Editor → ideas**, find the pending row, and change `status` to `approved`. Refresh the app to see it.
6. Support an approved idea using its Support button. The count is updated in PostgreSQL.

Do not use real personal contact information in demo submissions.

## 11. Architecture

```text
Browser (HTML/CSS/Vanilla JS)
        |
        | fetch() requests to /api/ideas
        v
Node.js + Express API
        |
        | server-only Supabase client
        v
Supabase PostgreSQL (ideas table)
```

The browser never receives the Supabase service-role key. The Express server validates submitted values and executes database operations. Row Level Security is enabled and no public direct-access policies are created; the server's service-role key bypasses RLS, so server validation and secret protection are critical.

## 12. API endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | Check server is running | Public |
| GET | `/api/ideas` | List up to 100 approved ideas | Public |
| POST | `/api/ideas` | Submit an idea for review | Public; validated and rate-limited |
| POST | `/api/ideas/:id/vote` | Increment an approved idea's vote count | Public; UUID checked and rate-limited |

`POST /api/ideas` expects JSON:

```json
{
  "title": "Add refill water stations",
  "description": "Install refill points so students can reuse bottles instead of buying single-use plastic bottles.",
  "category": "Water",
  "author_name": "A student"
}
```

Successful submission returns HTTP `201` with a review message and submission ID. Invalid fields return HTTP `400`. A database configuration issue returns HTTP `503`. Other unexpected failures return a generic HTTP `500` response.

## 13. Manual testing checklist

- [ ] Open `/api/health`: expect JSON with `"status":"ok"`.
- [ ] With correct Supabase settings, open the home page: approved ideas load.
- [ ] Submit a valid idea: expect a review message and a new pending row in Supabase.
- [ ] Submit with a missing title: browser validation should prevent submission; API validation also rejects missing fields.
- [ ] Send a description shorter than 15 characters: expect HTTP `400`.
- [ ] Use a category outside the five listed categories through an API client: expect HTTP `400`.
- [ ] Approve a pending row in Supabase and refresh the page: it should appear.
- [ ] Support an approved idea: vote count increases; button becomes Supported in that browser.
- [ ] Search by a word in a title or description: matching ideas remain.
- [ ] Choose a category: only that category is shown.
- [ ] Select Newest: latest ideas appear first.
- [ ] Resize the browser to mobile width: content should stack and remain usable.
- [ ] Temporarily use incorrect Supabase credentials: API displays a friendly load error; restore the correct credentials afterward.

The database connection has not been verified against your personal Supabase project. You must enter your own credentials and run the checks above.

## 14. Troubleshooting

- **`npm` is not recognized:** install Node.js LTS, then close and reopen VS Code.
- **Port 3000 is busy:** set `PORT=3001` in `backend/.env` and visit `http://localhost:3001`.
- **Database not configured / HTTP 503:** check the values in `backend/.env`; restart the server after changes.
- **Ideas do not load:** confirm the SQL script ran successfully, the `ideas` table exists, and the server terminal has no database error.
- **New submission is not visible:** this is expected. It is pending review. Change its status to `approved` in Supabase Table Editor.
- **Function missing error:** rerun `database/schema.sql` in Supabase SQL Editor.
- **A secret was shared:** rotate the key in Supabase immediately and update your local `.env`.

## 15. GitHub upload

1. Create a new empty repository on [GitHub](https://github.com/). Do not add a README there if you already have this project README.
2. In VS Code, open a terminal at the project root (the folder containing the root `README.md`).
3. Check what will be committed:

   ```bash
   git init
   git status
   git add .
   git status
   ```

4. Ensure `backend/.env` and all real secrets are absent from the staged list. `.env.example` should be included.
5. Commit and connect the repository:

   ```bash
   git commit -m "Build Campus Green Ideas Board"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPOSITORY_URL
   git push -u origin main
   ```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL. Confirm that the files appear on GitHub and that `backend/.env` does not.

If Git reports that a remote named `origin` already exists, use `git remote -v` to inspect it and `git remote set-url origin YOUR_GITHUB_REPOSITORY_URL` to correct it. Adding a file to `.gitignore` does not remove a secret that was already committed; rotate exposed keys and clean repository history as appropriate.

## 16. Security notes and future improvements

- Never publish the Supabase service-role key.
- The public API is rate-limited and input values are checked on the server.
- User-provided text is escaped before it is inserted into the page.
- RLS is enabled, but the server's privileged key bypasses it. Keep API code and credentials secure.
- Browser localStorage is only a convenience for remembering support clicks; it is not secure vote enforcement.
- Future improvements: secure admin moderation page, Supabase Auth, one-vote-per-user database constraints, report/flag workflow, and deployment with HTTPS.
