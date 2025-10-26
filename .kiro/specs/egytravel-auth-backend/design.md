# EgyTravel Authentication Backend Design

## Overview

The EgyTravel Authentication Backend is a Node.js/Express-based RESTful API service that provides secure authentication and authorization for the EgyTravel tourism platform. The system supports role-based access control for tourists and administrators, implements JWT-based session management, and integrates with a MySQL database for persistent user data storage.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web     │    │  Flutter Mobile │    │   Admin Panel   │
│   Application   │    │   Application   │    │   Application   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Optional)   │
                    └─────────┬───────┘
                              │
                    ┌─────────────────┐
                    │  Express.js API │
                    │   Auth Service  │
                    └─────────┬───────┘
                              │
                    ┌─────────────────┐
                    │  MySQL Database │
                    │   (Railway)     │
                    └─────────────────┘
```

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **SQL Database**: MySQL (Railway hosted) with Sequelize ORM
- **NoSQL Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) - stored in MySQL
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Environment Management**: dotenv
- **CORS**: cors middleware
- **Rate Limiting**: express-rate-limit

## Components and Interfaces

### 1. Project Structure
```
egytravel-backend/
├── src/
│   ├── config/
│   │   ├── database.js (MySQL Sequelize config)
│   │   ├── mongodb.js (MongoDB Mongoose config)
│   │   └── jwt.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleAuth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── sql/
│   │   │   └── User.js (Sequelize model)
│   │   └── nosql/
│   │       └── (Future MongoDB models)
│   ├── routes/
│   │   ├── auth.js
│   │   └── users.js
│   ├── services/
│   │   ├── authService.js
│   │   └── emailService.js
│   └── utils/
│       ├── logger.js
│       └── helpers.js
├── .env
├── package.json
└── server.js
```

### 2. API Endpoints

#### Authentication Routes (`/api/auth`)
- `POST /register` - Tourist registration
- `POST /login` - User login (tourist/admin)
- `POST /logout` - User logout
- `POST /refresh` - Token refresh
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation

#### User Management Routes (`/api/users`)
- `GET /profile` - Get user profile (authenticated)
- `PUT /profile` - Update user profile (authenticated)
- `GET /admin/users` - List all users (admin only)
- `PUT /admin/users/:id/role` - Update user role (admin only)

### 3. Authentication Middleware

#### JWT Authentication Middleware
```javascript
// Verifies JWT token and adds user to request object
const authenticateToken = (req, res, next) => {
  // Token verification logic
}
```

#### Role-Based Authorization Middleware
```javascript
// Checks user role for protected routes
const requireRole = (roles) => (req, res, next) => {
  // Role verification logic
}
```

## Data Models

### User Model (Sequelize - MySQL)
```javascript
// Sequelize User model definition
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name'
  },
  role: {
    type: DataTypes.ENUM('tourist', 'admin'),
    defaultValue: 'tourist'
  },
  phone: DataTypes.STRING(20),
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    field: 'date_of_birth'
  },
  nationality: DataTypes.STRING(100),
  profileImageUrl: {
    type: DataTypes.STRING(500),
    field: 'profile_image_url'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_verified'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true
});
```

### Password Reset Tokens Model (Sequelize - MySQL)
```javascript
const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'password_reset_tokens',
  underscored: true,
  timestamps: true
});
```

### JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "tourist|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Input validation failures
- `AUTHENTICATION_FAILED` - Invalid credentials
- `TOKEN_EXPIRED` - JWT token has expired
- `TOKEN_INVALID` - Malformed or invalid JWT token
- `INSUFFICIENT_PERMISSIONS` - Role-based access denied
- `USER_NOT_FOUND` - User does not exist
- `EMAIL_ALREADY_EXISTS` - Duplicate email registration
- `DATABASE_ERROR` - Database operation failures
- `RATE_LIMIT_EXCEEDED` - Too many requests

### Global Error Handler
```javascript
const errorHandler = (err, req, res, next) => {
  // Centralized error handling logic
  // Log errors, format responses, handle different error types
}
```

## Security Considerations

### Password Security
- Minimum 8 characters with letters and numbers
- bcrypt hashing with salt rounds (12)
- Password complexity validation

### JWT Security
- Short-lived access tokens (15 minutes)
- Refresh token rotation
- Secure HTTP-only cookies for token storage
- Token blacklisting on logout

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email

### Database Security
- Parameterized queries to prevent SQL injection
- Connection pooling with secure configuration
- Environment-based credential management

## Testing Strategy

### Unit Tests
- Authentication service functions
- Password hashing and validation
- JWT token generation and verification
- Input validation middleware

### Integration Tests
- API endpoint functionality
- Database operations
- Authentication flow end-to-end
- Role-based access control

### Security Tests
- SQL injection prevention
- JWT token security
- Rate limiting effectiveness
- Password security validation

### Test Environment Setup
- Separate test database
- Mock email service for testing
- Test data fixtures and cleanup
- Automated test execution in CI/CD

## Environment Configuration

### Required Environment Variables
```
# MySQL Database Configuration (Sequelize)
DB_HOST=hopper.proxy.rlwy.net
DB_PORT=26891
DB_NAME=railway
DB_USER=root
DB_PASSWORD=sDRyfpNNEsQKNiaXHyMTMBseNbsAiEaE

# MongoDB Configuration (Mongoose)
MONGODB_URI=mongodb://localhost:27017/egytravel
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/egytravel

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (for password reset)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Security Configuration
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

## Deployment Considerations

### Production Readiness
- Environment-specific configuration
- Logging and monitoring setup
- Health check endpoints
- Graceful shutdown handling
- Process management (PM2)

### Scalability
- Stateless design for horizontal scaling
- Database connection pooling
- Caching strategy for frequently accessed data
- Load balancer configuration