# 🧠 Real-Time User Monitoring & Admin Control System

A powerful, production-grade user tracking system that monitors user login activity, session duration, and allows admins to control user accounts in real time.

---

## 🔧 Features

✅ Real-time login/logout tracking  
✅ Session duration calculation  
✅ Admin dashboard to view all user sessions  
✅ Account deactivation/reactivation by admin  
✅ Access control for deactivated users  
✅ Backend-agnostic SQL schema (can integrate with Node.js, Flask, Django, etc.)

---

## 🧱 Database Schema

### 📁 `users` Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
