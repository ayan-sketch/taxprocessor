/**
 * API Security Middleware for Notice Uploads
 * Includes CSRF protection, rate limiting, and file sanitization
 */

import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// CSRF Token Management
class CSRFProtection {
  constructor() {
    this.tokens = new Map();
    this.tokenExpiry = 3600000; // 1 hour
  }

  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + this.tokenExpiry;
    
    this.tokens.set(token, { sessionId, expiry });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  validateToken(token, sessionId) {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return false;
    }
    
    if (tokenData.expiry < Date.now()) {
      this.tokens.delete(token);
      return false;
    }
    
    if (tokenData.sessionId !== sessionId) {
      return false;
    }
    
    // Token is valid, remove it (one-time use)
    this.tokens.delete(token);
    return true;
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (data.expiry < now) {
        this.tokens.delete(token);
      }
    }
  }
}

const csrfProtection = new CSRFProtection();

// Rate Limiting Configuration
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: {
    error: 'Too many upload requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many upload requests. Please try again in 15 minutes.',
      retryAfter: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  }
});

// Stricter rate limit for failed uploads
export const failedUploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Max 3 failed attempts
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many failed upload attempts',
    retryAfter: '5 minutes'
  }
});

// File Sanitization
export class FileSanitizer {
  static allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  static maxFileSize = 10 * 1024 * 1024; // 10MB

  static dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
    '.vbs', '.js', '.jar', '.zip', '.rar'
  ];

  static validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (this.dangerousExtensions.includes(ext)) {
      errors.push(`File extension ${ext} is not allowed for security reasons`);
    }

    // Check for null bytes in filename (path traversal attempt)
    if (file.originalname.includes('\0')) {
      errors.push('Invalid filename detected');
    }

    // Check for path traversal attempts
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      errors.push('Invalid filename: path traversal detected');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static sanitizeFilename(filename) {
    // Remove any path components
    let sanitized = path.basename(filename);
    
    // Remove special characters except dots, dashes, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Remove multiple consecutive dots
    sanitized = sanitized.replace(/\.{2,}/g, '.');
    
    // Ensure filename doesn't start with a dot
    if (sanitized.startsWith('.')) {
      sanitized = '_' + sanitized;
    }
    
    // Limit filename length
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const maxLength = 200;
    
    if (name.length > maxLength) {
      sanitized = name.substring(0, maxLength) + ext;
    }
    
    return sanitized;
  }

  static async scanForMalware(filePath) {
    // In production, integrate with antivirus API (ClamAV, VirusTotal, etc.)
    // For now, perform basic checks
    
    try {
      const stats = fs.statSync(filePath);
      
      // Check if file is suspiciously large
      if (stats.size > this.maxFileSize * 2) {
        return {
          safe: false,
          reason: 'File size is suspiciously large'
        };
      }

      // For PDFs, check for embedded JavaScript
      if (path.extname(filePath).toLowerCase() === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
        
        if (content.includes('/JavaScript') || content.includes('/JS')) {
          return {
            safe: false,
            reason: 'PDF contains embedded JavaScript'
          };
        }
      }

      return { safe: true };
    } catch (error) {
      return {
        safe: false,
        reason: 'Error scanning file: ' + error.message
      };
    }
  }
}

// CSRF Middleware
export const csrfMiddleware = (req, res, next) => {
  if (req.method === 'GET') {
    // Generate and send CSRF token for GET requests
    const token = csrfProtection.generateToken(req.sessionID || req.ip);
    res.locals.csrfToken = token;
    return next();
  }

  // Validate CSRF token for POST/PUT/DELETE requests
  const token = req.body.csrf_token || req.headers['x-csrf-token'];
  
  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'Security token is required for this operation'
    });
  }

  const isValid = csrfProtection.validateToken(token, req.sessionID || req.ip);
  
  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'Security token is invalid or expired. Please refresh and try again.'
    });
  }

  next();
};

// File Upload Security Middleware
export const secureFileUpload = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const files = req.files || [req.file];

    for (const file of files) {
      // Validate file
      const validation = FileSanitizer.validateFile(file);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          message: validation.errors.join(', ')
        });
      }

      // Sanitize filename
      file.sanitizedName = FileSanitizer.sanitizeFilename(file.originalname);

      // Scan for malware
      const scanResult = await FileSanitizer.scanForMalware(file.path);
      
      if (!scanResult.safe) {
        // Delete the file
        fs.unlinkSync(file.path);
        
        return res.status(400).json({
          success: false,
          error: 'Security scan failed',
          message: scanResult.reason
        });
      }
    }

    next();
  } catch (error) {
    console.error('File upload security error:', error);
    res.status(500).json({
      success: false,
      error: 'Security check failed',
      message: 'An error occurred during security validation'
    });
  }
};

// Audit Log
export class AuditLogger {
  static logUpload(req, file, success, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionID || 'unknown',
      userId: req.user?.id || 'anonymous',
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      success,
      error: error?.message || null
    };

    // In production, write to database or log file
    console.log('[AUDIT]', JSON.stringify(logEntry));

    // Also write to file
    const logPath = path.join(process.cwd(), 'logs', 'upload-audit.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }

  static logSecurityEvent(req, eventType, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.sessionID || 'unknown',
      eventType,
      details
    };

    console.log('[SECURITY]', JSON.stringify(logEntry));

    const logPath = path.join(process.cwd(), 'logs', 'security.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
}

// Session Validation Middleware
export const validateSession = (req, res, next) => {
  // Check if user is authenticated
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Please log in to upload files'
    });
  }

  // Check session expiry
  const sessionAge = Date.now() - (req.session.createdAt || 0);
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  if (sessionAge > maxAge) {
    req.session.destroy();
    return res.status(401).json({
      success: false,
      error: 'Session expired',
      message: 'Your session has expired. Please log in again.'
    });
  }

  next();
};

// Export CSRF token generator for routes
export const generateCSRFToken = (sessionId) => {
  return csrfProtection.generateToken(sessionId);
};
