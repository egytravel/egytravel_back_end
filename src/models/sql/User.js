const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../../config/database');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: 'user_id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [2, 100],
        msg: 'Name must be between 2 and 100 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: true,
    defaultValue: 'user'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_verified'   // maps to is_verified column (added via migration)
  },
  phone: { type: DataTypes.STRING(30), allowNull: true },
  nationality: { type: DataTypes.STRING(100), allowNull: true },
  date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
  profile_photo_url: { type: DataTypes.STRING(500), allowNull: true },
  notification_preferences: { type: DataTypes.JSON, allowNull: true, defaultValue: null }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        user.password_hash = await bcrypt.hash(user.password_hash, saltRounds);
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  if (!values.notification_preferences) {
    values.notification_preferences = { push_enabled: true, email_enabled: true };
  }
  return values;
};

User.prototype.setPassword = async function(plainPassword) {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(plainPassword, saltRounds);
};

// Class methods
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email: email.toLowerCase() } });
};

User.createUser = async function(userData) {
  // Ensure email is lowercase
  if (userData.email) {
    userData.email = userData.email.toLowerCase();
  }
  
  // Hash password before creating user
  if (userData.password) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    userData.password = await bcrypt.hash(userData.password, saltRounds);
  }
  
  return await this.create(userData);
};

module.exports = User;