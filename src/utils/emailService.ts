import nodemailer from 'nodemailer';
import crypto from 'crypto';
import appSettings from '@config/settings';
import { EmailResult, EmailOptions } from '@interfaces/index';

/**
 * Email Service - Handles all email-related functionality
 *
 * This service is responsible for:
 * 1. Configuring email settings (Gmail, Outlook, etc.)
 * 2. Generating secure OTP codes for password reset
 * 3. Sending beautifully formatted emails to users
 * 4. Verifying that email configuration is working properly
 */

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(appSettings.email);
  }

  /**
   * Generates a cryptographically secure 6-digit OTP
   */
  public generateOTP(): string {
    // Generate a random 6-digit number using crypto for security
    // crypto.randomInt() is cryptographically secure (unpredictable)
    // Math.random() is predictable and not safe for security purposes
    const randomNumber = crypto.randomInt(100000, 999999);
    return randomNumber.toString();
  }

  /**
   * Sends an OTP email to the user for password reset
   */
  public async sendOTPEmail(email: string, name: string): Promise<EmailResult> {
    try {
      // Generate a fresh 6-digit OTP for this password reset request
      const otp = this.generateOTP();

      // Create the email content
      const mailOptions: EmailOptions = {
        from: {
          name: 'Basic Auth System',
          address: appSettings.email.auth.user || 'noreply@basicauth.com',
        },
        to: email,
        subject: 'Password Reset - OTP Verification',
        text: this.generatePlainTextEmail(name, otp),
        html: this.generateHTMLEmail(name, otp),
      };

      // Send the email
      const info = await this.transporter.sendMail(mailOptions);

      console.log('OTP email sent successfully:', info.messageId);

      return {
        success: true,
        otp: otp,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Error sending OTP email:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generates plain text version of the OTP email
   */
  private generatePlainTextEmail(name: string, otp: string): string {
    return `
Hello ${name},

You have requested to reset your password for your Basic Auth System account.

Your OTP (One-Time Password) is: ${otp}

This OTP will expire in 10 minutes for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
Basic Auth System Team
    `.trim();
  }

  /**
   * Generates HTML version of the OTP email
   */
  private generateHTMLEmail(name: string, otp: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">Password Reset Request</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            You have requested to reset your password for your Basic Auth System account.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #667eea;">
            <p style="color: #333; margin: 0 0 10px 0; font-size: 14px;">Your OTP (One-Time Password) is:</p>
            <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">
              ${otp}
            </h1>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⚠️ <strong>Important:</strong> This OTP will expire in <strong>10 minutes</strong> for security reasons.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            If you did not request this password reset, please ignore this email. Your account remains secure.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email from Basic Auth System. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Verifies email configuration and tests connection
   */
  public async verifyEmailConfig(): Promise<boolean> {
    try {
      // Check if email credentials are provided
      if (!appSettings.email.auth.user || !appSettings.email.auth.pass) {
        console.log(
          '⚠️  Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file'
        );
        console.log('📧 See EMAIL_SETUP_GUIDE.md for detailed setup instructions');
        console.log('🔍 Debug info:');
        console.log('   EMAIL_USER:', appSettings.email.auth.user ? 'SET' : 'NOT SET');
        console.log('   EMAIL_PASS:', appSettings.email.auth.pass ? 'SET' : 'NOT SET');
        return false;
      }

      console.log('🔍 Email configuration found:');
      console.log('   EMAIL_USER:', appSettings.email.auth.user);
      console.log('   EMAIL_PASS:', appSettings.email.auth.pass ? '***configured***' : 'NOT SET');

      // Test the connection to the email server
      await this.transporter.verify();
      console.log('✅ Email service is ready to send emails');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Email service configuration error:', errorMessage);
      console.log('Please check your email credentials in .env file');
      console.log('📧 See EMAIL_SETUP_GUIDE.md for setup instructions');
      return false;
    }
  }

  /**
   * Sends a custom email with provided options
   */
  public async sendCustomEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail(options);

      console.log('Custom email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Error sending custom email:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets the transporter instance for advanced usage
   */
  public getTransporter(): nodemailer.Transporter {
    return this.transporter;
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
export { EmailService };
