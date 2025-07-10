# 🎵 TuneFlow – Music Submission & Admin Review Platform

TuneFlow is a feature-rich music publishing platform built with **Next.js**, **Tailwind CSS**, and **TypeScript**, designed for artists and labels to submit songs for review, payment, earnings tracking, and admin control.

## 🌟 Key Features

### 🔐 Authentication
- Mock authentication system with login & register
- Role-based access: **User**, **Admin**, and **Master Admin**
- Secure access control — users can't see each other's data

### 🎧 Song Upload System
- Artists upload MP3 files with:
  - Title, Description, Singer, Author
  - 3000x3000 PNG Banner (image upload only)
- Razorpay payment integration:
  - ₹999 for Artists
  - ₹1999 for Labels
  - Manual override to make free for any duration (1M, 2M, 3M, 6M, 1Y)

### 🛠 Admin Dashboard
- View & review songs from all users
- Approve or Decline with processing note
- Play and Download submitted songs
- Shows which admin processed which song
- Add earnings for songs & assign admin-specific share ratios
- Add wallet funds to users with reason

### 👑 Master Admin Panel
- Only accessible by: `admin@gmail.com`
- View all users with roles and emails
- Change user roles: User, Admin, Super Admin
- See financial dashboard:
  - Total earnings
  - Total paid to users
  - Remaining payouts
  - Platform's cut
- Grant/revoke free subscriptions manually

### 💼 Earnings & Wallet
- Automatic 80% share (editable per user/song)
- User wallet tracks:
  - Total earnings
  - Withdrawn amount
  - Balance
- Withdrawal requests include UPI ID, name, and amount
- Admin processes withdrawals and marks status: **Pending**, **Completed**, **Failed**

### 🛠 Ticket System (Support)
- Users can raise tickets with message + image
- Admins can respond, close, or track tickets

## 💻 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Styling**: Tailwind CSS, modern minimal layout
- **Icons**: Lucide
- **Auth**: Mock localStorage-based
- **Payments**: Razorpay
- **AI (Optional)**: Gemini/Genkit (for admin use only)
- **Database**: Mock JSON store (replaceable with Firebase, MongoDB, etc.)

## ⚙️ Setup

```bash
git clone https://github.com/NARKHEDE-VAIBHAV/TuneFlow.git
cd TuneFlow
npm install
npm run dev


Runs at: http://localhost:9002
🔐 Default Admin
Email	Password
admin@gmail.com	12345678
