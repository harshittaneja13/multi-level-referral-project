
## 🚀 Project Overview
This project is a **multi-level referral and earning system** built using **Node.js, Express.js, MongoDB, and React.js**. It allows users to sign up with a referral system, make purchases, and earn referral commissions in real-time.

## 🛠 Tech Stack
### **Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose

### **Frontend:**
- React.js
- Tailwind CSS

### **Real-time Updates:**
- Socket.IO for live notifications

---

## 🗄 Database Design
The system consists of three main models:

### **Users Model:**
| Field    | Type    | Description |
|----------|---------|-------------|
| `name`  | String | Unique username |
| `email` | String | Unique email address |
| `parent` | ObjectId | Refers to the referrer |
| `referrals` | Array | List of direct referral ObjectIds |
| `earnings` | Number | Total accumulated earnings |

### **Earnings Model:**
| Field    | Type    | Description |
|----------|---------|-------------|
| `user`  | ObjectId | Beneficiary of the earnings |
| `amount` | Number | Earnings amount |
| `referralLevel` | Number | Level (1 for direct, 2 for indirect) |
| `transaction` | ObjectId | Reference to the related transaction |

### **Transaction Model:**
| Field    | Type    | Description |
|----------|---------|-------------|
| `user`  | ObjectId | Buyer ID |
| `purchaseAmount` | Number | Amount spent |
| `profit` | Number | Computed profit |
| `date` | Date | Purchase date |

---

## 🔗 API Endpoints
### **User Management**
- **`POST /api/users`** → Create/Login User
  - Checks if the email exists, otherwise creates a new user.
  - Assigns a referrer if provided (verifies referral limit).
  
### **Purchase Processing**
- **`POST /api/purchase`** → Process a purchase
  - Verifies purchase amount exceeds a threshold (e.g., 1000 Rs).
  - Saves transaction, calculates referral profit (5% for Level 1, 1% for Level 2).
  - Updates referrer earnings and emits Socket.IO events (`earningUpdate`).
  
### **Earnings and Referrals**
- **`GET /api/earnings?userId=...`** → Fetch earnings for a user.
- **`GET /api/user?name=...`** → Retrieve user details by name.
- **`GET /api/referrals?name=...`** → Get Level 1 and Level 2 referrals.

---

## ⚡ Real-Time Notifications (Socket.IO)
- When a purchase is made, **earning updates** are emitted to referrers.
- Clients subscribe to updates via their **user ID rooms**.
- Frontend listens for `earningUpdate` events and updates the UI in real-time.

---

## 🎯 Frontend User Flow
1. **User Signup/Login:**
   - Users sign up with an optional referral.
   - The system assigns a unique user ID (`referrerId`).

2. **Making a Purchase:**
   - Purchase amount is validated.
   - Referrers receive earnings automatically (5% direct, 1% indirect).
   - Real-time notifications update referrer earnings.

3. **Viewing Earnings & Referrals:**
   - Users can search for **total earnings** and **referral details** (Level 1 & Level 2).

---

## 📜 Setup & Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/harshittaneja13/multi-level-referral.git
   cd multi-level-referral

2. Install backend dependencies:
    ```sh
    cd backend
    npm install

3. Start the backend server:
    ```sh
    npm run start
4. Install frontend dependencies:
    ```sh
    cd ../frontend
    npm install
5. Start the frontend server:
    ```sh
    npm run dev

## 🎉 Conclusion
This project implements a multi-level referral system with real-time earnings tracking. It efficiently manages user referrals, purchase processing, and earnings distribution using MongoDB, Node.js, and React.js.

🔥 Feel free to contribute and improve the system!

📧 Contact: harshittaneja.ht4@gmail.com
