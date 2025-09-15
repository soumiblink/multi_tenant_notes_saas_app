# Multi-Tenant Notes SaaS Application

A **multi-tenant SaaS Notes application** built with **Next.js (App Router)** and **MongoDB**, supporting role-based access, subscription limits, and tenant isolation. Hosted on **Vercel**.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Multi-Tenancy Approach](#multi-tenancy-approach)
- [Test Accounts](#test-accounts)
- [API Endpoints](#api-endpoints)
- [Frontend](#frontend)
- [Deployment Links](#deployment-links)
- [Setup / Local Development](#setup--local-development)
- [Environment Variables](#environment-variables)
- [Usage Instructions](#usage-instructions)

---

## Overview

This SaaS app allows multiple companies (tenants) to manage notes securely. Each tenant can have **Admin** and **Member** users with role-based permissions. Free tenants are limited to **3 notes**, while Pro tenants have unlimited notes.

---

## Features

- Multi-Tenant architecture (shared schema with `tenantId` column)
- JWT-based authentication
- Role-based authorization:
  - Admin: can invite users, upgrade subscription
  - Member: can create/edit/delete notes
- Subscription feature gating:
  - Free: 3 notes max
  - Pro: unlimited notes
- Notes CRUD API with tenant isolation
- Frontend dashboard for notes management, user invite, and subscription upgrade
- CORS enabled for API access
- Health check endpoint (`/api/health`)

---

## Tech Stack

- **Frontend & Backend:** Next.js 15 (App Router)
- **Database:** MongoDB Atlas
- **Authentication:** JWT
- **Deployment:** Vercel

---

## Multi-Tenancy Approach

- **Shared schema approach:**  
  - All tenants share the same collections (`users`, `notes`, `tenants`)
  - Each record includes a `tenantId` field to enforce strict isolation
  - Queries always filter by `tenantId`

---

## Test Accounts

Use these accounts to log in and test functionality:

| Email | Role | Tenant | Password |
|-------|------|--------|----------|
| admin@acme.test | Admin | Acme | password |
| user@acme.test | Member | Acme | password |
| admin@globex.test | Admin | Globex | password |
| user@globex.test | Member | Globex | password |

**Notes:**
- Admin can invite users and upgrade tenant subscription.
- Member can only manage notes.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|---------|------------|
| GET | `/api/health` | Returns `{ "status": "ok" }` |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes` | List all tenant notes |
| GET | `/api/notes/:id` | Get a single note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |
| POST | `/api/tenants/:slug/upgrade` | Upgrade tenant to Pro (Admin only) |
| POST | `/api/users/invite` | Invite a new user (Admin only) |

---

## Frontend

- **Login** using the test accounts
- **Dashboard**:
  - Create, edit, delete notes
  - See all tenant notes (shared within tenant)
  - Upgrade tenant to Pro when Free limit reached
  - Invite new users (Admin only)

---

## Deployment Links

- **Base Vercel link (API + Frontend)**: [https://multi-tenant-notes-saas-app-usingme.vercel.app](https://multi-tenant-notes-saas-app-usingme.vercel.app)
- **Frontend Dashboard**: [https://multi-tenant-notes-saas-app-usingme.vercel.app/login](https://multi-tenant-notes-saas-app-usingme.vercel.app/login)

> Use the above test accounts to log in.

---

## Setup / Local Development

1. Clone repository:

```bash
git clone https://github.com/YourUsername/multi-tenant-notes-saas-app-usingmern-nextjs.git
cd multi-tenant-notes-saas-app-usingmern-nextjs
npm install
```
Create a .env file in the root directory:

MONGODB_URI="your-mongodb-atlas-connection-string"
JWT_SECRET="your-secret-key"

Run locally:
```
npm run dev
```
