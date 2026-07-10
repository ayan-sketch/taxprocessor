import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration (using Gmail as example)
// For production, use environment variables
let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter(config) {
  transporter = nodemailer.createTransport({
    service: config.service || 'gmail',
    auth: {
      user: config.email,
      pass: config.password // Use app-specific password for Gmail
    }
  });
  return transporter;
}

/**
 * Configure email settings
 */
app.post('/api/email/configure', async (req, res) => {
  try {
    const { service, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    transporter = initializeTransporter({ service, email, password });

    // Verify connection
    await transporter.verify();

    res.json({ 
      success: true, 
      message: 'Email configuration successful',
      email 
    });
  } catch (error) {
    console.error('Email configuration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Send single email
 */
app.post('/api/email/send', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email not configured. Please configure email settings first.' 
      });
    }

    const { to, subject, body, attachments } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'To, subject, and body are required' 
      });
    }

    const mailOptions = {
      from: transporter.options.auth.user,
      to,
      subject,
      html: body,
      attachments: attachments || []
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Send bulk emails
 */
app.post('/api/email/send-bulk', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email not configured. Please configure email settings first.' 
      });
    }

    const { recipients, subject, body, attachments } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipients array is required' 
      });
    }

    if (!subject || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject and body are required' 
      });
    }

    const results = [];
    const errors = [];

    // Send emails sequentially to avoid rate limiting
    for (const recipient of recipients) {
      try {
        // Replace placeholders in body
        let personalizedBody = body;
        if (recipient.name) {
          personalizedBody = body.replace(/\{name\}/g, recipient.name);
        }
        if (recipient.cnicNtn) {
          personalizedBody = personalizedBody.replace(/\{cnicNtn\}/g, recipient.cnicNtn);
        }
        if (recipient.taxYear) {
          personalizedBody = personalizedBody.replace(/\{taxYear\}/g, recipient.taxYear);
        }

        const mailOptions = {
          from: transporter.options.auth.user,
          to: recipient.email,
          subject,
          html: personalizedBody,
          attachments: attachments || []
        };

        const info = await transporter.sendMail(mailOptions);
        
        results.push({
          email: recipient.email,
          success: true,
          messageId: info.messageId
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errors.push({
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true,
      totalSent: results.length,
      totalFailed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Send deadline reminder
 */
app.post('/api/email/send-reminder', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email not configured. Please configure email settings first.' 
      });
    }

    const { to, name, taxYear, deadline, daysRemaining } = req.body;

    if (!to || !name || !taxYear || !deadline) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const subject = `Reminder: Tax Return Deadline Approaching - ${taxYear}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Tax Return Deadline Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a friendly reminder that your tax return deadline is approaching.</p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Tax Year:</strong> ${taxYear}</p>
          <p style="margin: 5px 0;"><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Days Remaining:</strong> ${daysRemaining} days</p>
        </div>
        <p>Please ensure you submit your tax return before the deadline to avoid penalties.</p>
        <p>If you have any questions or need assistance, please contact us.</p>
        <p style="margin-top: 30px;">Best regards,<br>Tax Automation Team</p>
      </div>
    `;

    const mailOptions = {
      from: transporter.options.auth.user,
      to,
      subject,
      html: body
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Reminder sent successfully' 
    });
  } catch (error) {
    console.error('Reminder send error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Send automated deadline reminders for all upcoming deadlines
 */
app.post('/api/email/send-automated-reminders', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email not configured. Please configure email settings first.' 
      });
    }

    const { returns, daysThreshold } = req.body;

    if (!returns || !Array.isArray(returns)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Returns array is required' 
      });
    }

    const threshold = daysThreshold || 7;
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + threshold * 24 * 60 * 60 * 1000);

    const results = [];
    const errors = [];

    for (const ret of returns) {
      if (!ret.deadline || !ret.email) continue;

      const deadline = new Date(ret.deadline);
      if (isNaN(deadline.getTime())) continue;

      // Check if deadline is within threshold
      if (deadline >= now && deadline <= thresholdDate) {
        const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        try {
          const subject = `Reminder: Tax Return Deadline Approaching - ${ret.taxYear}`;
          const body = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Tax Return Deadline Reminder</h2>
              <p>Dear ${ret.name},</p>
              <p>This is a friendly reminder that your tax return deadline is approaching.</p>
              <div style="background-color: ${daysRemaining <= 3 ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${daysRemaining <= 3 ? '#ef4444' : '#f59e0b'}; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Tax Year:</strong> ${ret.taxYear}</p>
                <p style="margin: 5px 0;"><strong>Deadline:</strong> ${deadline.toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Days Remaining:</strong> ${daysRemaining} days</p>
                ${daysRemaining <= 3 ? '<p style="margin: 5px 0; color: #ef4444;"><strong>⚠️ URGENT: Deadline is very close!</strong></p>' : ''}
              </div>
              <p>Please ensure you submit your tax return before the deadline to avoid penalties.</p>
              <p>If you have any questions or need assistance, please contact us.</p>
              <p style="margin-top: 30px;">Best regards,<br>Tax Automation Team</p>
            </div>
          `;

          const mailOptions = {
            from: transporter.options.auth.user,
            to: ret.email,
            subject,
            html: body
          };

          const info = await transporter.sendMail(mailOptions);
          
          results.push({
            email: ret.email,
            name: ret.name,
            taxYear: ret.taxYear,
            daysRemaining,
            success: true,
            messageId: info.messageId
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          errors.push({
            email: ret.email,
            name: ret.name,
            taxYear: ret.taxYear,
            success: false,
            error: error.message
          });
        }
      }
    }

    res.json({ 
      success: true,
      totalSent: results.length,
      totalFailed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Automated reminders error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Test email configuration
 */
app.post('/api/email/test', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email not configured. Please configure email settings first.' 
      });
    }

    const { to } = req.body;

    const mailOptions = {
      from: transporter.options.auth.user,
      to: to || transporter.options.auth.user,
      subject: 'Test Email - Tax Automation System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Configuration Test</h2>
          <p>This is a test email from your Tax Automation System.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p style="margin-top: 30px;">Best regards,<br>Tax Automation Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Test email sent successfully' 
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Email Service running on http://localhost:${PORT}`);
});
