const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const sequelize = require('../../config/database');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'password_reset_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['token']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['used']
    }
  ]
});

// Instance methods
PasswordResetToken.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

PasswordResetToken.prototype.isValid = function() {
  return !this.used && !this.isExpired();
};

PasswordResetToken.prototype.markAsUsed = async function() {
  this.used = true;
  await this.save();
};

// Class methods
PasswordResetToken.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

PasswordResetToken.createToken = async function(userId, expirationHours = 1) {
  const token = this.generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);
  
  return await this.create({
    user_id: userId,
    token: token,
    expires_at: expiresAt
  });
};

PasswordResetToken.findValidToken = async function(token) {
  const resetToken = await this.findOne({
    where: { token },
    include: [{
      model: require('./User'),
      as: 'user'
    }]
  });
  
  if (!resetToken || !resetToken.isValid()) {
    return null;
  }
  
  return resetToken;
};

PasswordResetToken.cleanupExpiredTokens = async function() {
  const now = new Date();
  return await this.destroy({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lt]: now
      }
    }
  });
};

module.exports = PasswordResetToken;