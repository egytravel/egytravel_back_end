# EgyTravel Authentication Backend

🚀 **Production-ready authentication and authorization backend service for the EgyTravel tourism platform.**

## ✨ Features

- 🔐 JWT-based authentication with refresh tokens
- 👥 Role-based authorization (User/Admin)
- 🗄️ MySQL database with Sequelize ORM
- 🔄 Password reset functionality
- 🛡️ Rate limiting and security middleware
- 📝 Comprehensive logging with Winston
- 🚦 Input validation and sanitization
- 🔒 Password hashing with bcrypt

## 🛠️ Tech Stack

- **Runtime**: Node.js >= 16.0.0
- **Framework**: Express.js
- **Database**: MySQL (Railway hosted)
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: express-validator
- **Logging**: Winston

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/egytravel-auth-backend.git
cd egytravel-auth-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

### 4. Start the server
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| POST | `/api/auth/logout` | User logout | ✅ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### 👤 User Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | ✅ |
| PUT | `/api/users/profile` | Update user profile | ✅ |
| POST | `/api/users/change-password` | Change password | ✅ |

### 👑 Admin Only
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/admin/users` | List all users | ✅ Admin |
| GET | `/api/users/admin/users/:id` | Get user by ID | ✅ Admin |
| PUT | `/api/users/admin/users/:id/role` | Update user role | ✅ Admin |
| DELETE | `/api/users/admin/users/:id` | Delete user | ✅ Admin |

### 🏥 Health Check
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health status | ❌ |

## 🔧 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database Configuration
DB_HOST=your-railway-db-host
DB_PORT=your-railway-db-port
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production
```

## 🚀 Deployment to Railway

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: EgyTravel Auth Backend"
git branch -M main
git remote add origin https://github.com/yourusername/egytravel-auth-backend.git
git push -u origin main
```

### 2. Deploy on Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js and deploy
5. Add environment variables in Railway dashboard
6. Your API will be available at: `https://your-app-name.up.railway.app`

## 🧪 Testing

### Using Postman
Import the API endpoints and test with:
- Base URL: `http://localhost:3000` (development)
- Base URL: `https://your-app-name.up.railway.app` (production)

### Sample Registration Request
```json
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

## 📁 Project Structure

```
├── src/
│   ├── config/          # Database and JWT configuration
│   ├── controllers/     # Route handlers (placeholder)
│   ├── middleware/      # Authentication and validation
│   ├── migrations/      # Database migrations
│   ├── models/sql/      # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions and logging
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── railway.json        # Railway deployment config
├── README.md           # This file
└── server.js           # Application entry point
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ JWT tokens with expiration
- ✅ Rate limiting on authentication endpoints
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Security headers with Helmet
- ✅ SQL injection prevention with Sequelize
- ✅ Environment variable protection

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (when implemented)
npm run build      # No build step required
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@egytravel.com or create an issue in this repository.