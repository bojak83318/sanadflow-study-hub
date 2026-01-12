# SanadFlow Study Hub

**QalamColab**: A zero-pilot-cost Islamic Sciences collaborative platform for Arabic grammar (Nahw), Hadith, and Usul al-Fiqh.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- Supabase Project
- Vercel Account

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/your-repo/qalamcolab.git
cd qalamcolab

# Install dependencies
npm install

# Setup environment variables
cp .env.local.template .env.local
# Fill in your Supabase credentials in .env.local

# Start development server
npm run dev
```

---

## 📖 Documentation

- **[Deployment Guide](docs/deployment-guide.md)**: Step-by-step instructions for production setup.
- **[Monitoring & Alerts](docs/monitoring.md)**: Configuration for maintenance and availability.
- **[Troubleshooting](docs/troubleshooting.md)**: Solutions for common connectivity and RLS issues.
- **[Environment Variables](docs/environment-variables.md)**: Reference for all required configuration keys.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS (RTL support).
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Realtime).
- **ORM**: Prisma 5.x.
- **Collaboration**: Yjs CRDT, TLDraw Whiteboard.

---

## 🔒 Security

SanadFlow uses **Row Level Security (RLS)** in Supabase to ensure that users can only access data within their authorized workspaces.

---

## 📡 Health Status

Check the current system health at:
`https://sanadflow.vercel.app/api/health`

---

## 🤝 Contributing

Please refer to the `docs/` directory for detailed architecture and design documents.
