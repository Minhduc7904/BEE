// src/infrastructure/services/resend-email.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Resend } from 'resend';
import emailConfig from '../../config/email.config';
import {
    IEmailService,
    EmailTemplate,
    EmailVerificationData,
    WelcomeEmailData,
    PasswordResetData
} from '../interfaces/email.interface';
import { EmailTemplates } from '../templates/email-templates';

@Injectable()
export class ResendEmailService implements IEmailService {
    private readonly logger = new Logger(ResendEmailService.name);
    private readonly resend: Resend;

    constructor(
        @Inject(emailConfig.KEY)
        private readonly config: ConfigType<typeof emailConfig>,
    ) {
        if (!this.config.resendApiKey) {
            throw new Error('RESEND_API_KEY is required but not provided');
        }

        this.resend = new Resend(this.config.resendApiKey);
        this.logger.log('Resend Email Service initialized');
    }

    async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
        try {
            const template = EmailTemplates.verificationEmail(data);

            await this.sendRawEmail({
                to: data.email,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });

            this.logger.log(`Verification email sent to ${data.email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${data.email}:`, error);
            throw error;
        }
    }

    async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
        try {
            const template = EmailTemplates.welcomeEmail(data);

            await this.sendRawEmail({
                to: data.email,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });

            this.logger.log(`Welcome email sent to ${data.email} (${data.role})`);
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${data.email}:`, error);
            throw error;
        }
    }

    async sendPasswordResetEmail(data: PasswordResetData): Promise<void> {
        try {
            const template = EmailTemplates.passwordResetEmail(data);

            await this.sendRawEmail({
                to: data.email,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });

            this.logger.log(`Password reset email sent to ${data.email}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${data.email}:`, error);
            throw error;
        }
    }

    async sendRawEmail(template: EmailTemplate): Promise<void> {
        try {
            this.logger.log(`Sending email to: ${template.to}`);
            this.logger.log(`From address: ${this.config.fromAddress}`);
            this.logger.log(`Subject: ${template.subject}`);

            const result = await this.resend.emails.send({
                from: this.config.fromAddress,
                to: template.to,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });

            this.logger.log(`Resend API result:`, result);

            if (result.error) {
                const errorMessage = result.error.message || result.error.name || JSON.stringify(result.error);
                this.logger.error(`Resend API error details:`, result.error);
                throw new Error(`Resend API error: ${errorMessage}`);
            }

            this.logger.log(`Email sent successfully. ID: ${result.data?.id}`);
        } catch (error) {
            this.logger.error('Failed to send email via Resend:', error);
            throw error;
        }
    }

    // Method để test email service
    async sendTestEmail(to: string): Promise<void> {
        const testTemplate: EmailTemplate = {
            to,
            subject: 'Test Email từ BeeMath 🐝',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>🐝 BeeMath</h1>
            <h2>Test Email</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Đây là email test từ BeeMath!</p>
            <p>Nếu bạn nhận được email này, có nghĩa là email service đã hoạt động tốt.</p>
            <p>Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>
      `,
            text: `
        BeeMath - Test Email
        
        Đây là email test từ BeeMath!
        Nếu bạn nhận được email này, có nghĩa là email service đã hoạt động tốt.
        
        Thời gian gửi: ${new Date().toLocaleString('vi-VN')}
      `,
        };

        await this.sendRawEmail(testTemplate);
    }
}
