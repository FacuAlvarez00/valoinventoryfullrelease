const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/constants');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

module.exports = authMiddleware; 