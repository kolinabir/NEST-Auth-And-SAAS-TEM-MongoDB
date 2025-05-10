import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = this.configService.get('app.email');

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Email service setup error:', error);
      } else {
        this.logger.log('Email service is ready to send messages');
      }
    });
  }

  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    firstName: string,
  ): Promise<boolean> {
    try {
      const emailFrom = this.configService.get<string>('app.email.from');

      const info = await this.transporter.sendMail({
        from: `"SaaS Platform" <${emailFrom}>`,
        to,
        subject: 'Please verify your email address',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${firstName}!</h2>
          <p>Thank you for registering. Please use the verification code below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">${verificationToken}</p>
          </div>
          <p>Enter this code in the verification page of our application to complete your registration.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <p>Thanks,<br>The SaaS Platform Team</p>
        </div>
        `,
      });

      this.logger.log(`Verification email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send verification email:', error);
      return false;
    }
  }

  async sendVerificationSuccessEmail(
    to: string,
    firstName: string,
  ): Promise<boolean> {
    try {
      const emailFrom = this.configService.get<string>('app.email.from');
      const frontendUrl = this.configService.get<string>('app.frontendUrl');

      const info = await this.transporter.sendMail({
        from: `"SaaS Platform" <${emailFrom}>`,
        to,
        subject: 'Email Verification Successful',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations, ${firstName}!</h2>
          <p>Your email has been successfully verified.</p>
          <p>You can now log in to your account and start using our services.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/login" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; border-radius: 4px;">
              Go to Login
            </a>
          </div>
          <p>Thanks for joining us!</p>
          <p>Best regards,<br>The SaaS Platform Team</p>
        </div>
        `,
      });

      this.logger.log(`Verification success email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send verification success email:', error);
      return false;
    }
  }
}
