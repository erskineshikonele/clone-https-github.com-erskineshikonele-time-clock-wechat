# Time Clocking System - WeChat Mini Program

A professional, secure, and user-friendly time clocking solution built as a WeChat Mini Program. Perfect for companies looking to streamline employee attendance tracking, timesheet management, and payroll integration.

## ✨ Features

- **Real-time Clock In/Out** with geolocation tracking
- **Interactive Timesheets** with date filtering and export
- **Admin Dashboard** for managers (role-based access)
- **Mobile-first Design** optimized for WeChat
- **Secure Authentication** with WeChat login
- **Offline Support** with automatic sync
- **Data Export** (CSV/PDF) for payroll integration

## 🛠️ Tech Stack

- **Frontend**: WeChat Mini Program (WXML/WXSS/JS)
- **Backend**: Node.js/Express (included)
- **Database**: SQLite (development) / PostgreSQL (production)
- **State Management**: WeChat Storage API
- **UI Framework**: Custom components with modern CSS

## 👨‍💻 Developer

**Erskine Brister Shikonele**  
*Lead Developer & Architect*  
Erskine Brister Shikonele is the primary developer behind this project, bringing expertise in WeChat Mini Program development, backend API design, and user-centered HR tech solutions. With a background in computer systems engineering and work-based learning, Erskine has crafted this system to address real-world time tracking challenges faced by modern organizations.

## 🚀 Quick Start

### Prerequisites
- WeChat Developer Account [](https://mp.weixin.qq.com)
- Node.js 16+ (for backend)
- [WeChat Developer Tools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### Setup
```bash
# 1. Clone or download this repository
git clone https://github.com/yourusername/time-clock-wechat.git
cd time-clock-wechat

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Open Mini Program in WeChat Developer Tools
#    - File → Open Project
#    - Select 'mini-program' folder
#    - Enter your WeChat AppID
#    - Click "Import"
