// src/infrastructure/templates/email-templates.ts
import { EmailVerificationData, WelcomeEmailData, PasswordResetData } from '../interfaces/email.interface';

export class EmailTemplates {
  static verificationEmail(data: EmailVerificationData): { subject: string; html: string; text: string } {
    const subject = `Xác nhận email - ${data.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐝 ${data.appName}</h1>
            <h2>Xác nhận địa chỉ email</h2>
          </div>
          <div class="content">
            <p>Xin chào <strong>${data.firstName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản ${data.appName}! Để hoàn tất quá trình đăng ký, vui lòng xác nhận địa chỉ email của bạn.</p>
            <p style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Xác nhận Email</a>
            </p>
            <p>Hoặc copy và paste link sau vào trình duyệt:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${data.verificationUrl}</p>
            <p><strong>Lưu ý:</strong> Link xác nhận sẽ hết hạn sau 24 giờ.</p>
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi từ ${data.appName}<br>
            Đây là email tự động, vui lòng không reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Xin chào ${data.firstName},
      
      Cảm ơn bạn đã đăng ký tài khoản ${data.appName}!
      
      Để hoàn tất quá trình đăng ký, vui lòng xác nhận địa chỉ email bằng cách truy cập:
      ${data.verificationUrl}
      
      Link xác nhận sẽ hết hạn sau 24 giờ.
      
      Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
      
      Trân trọng,
      ${data.appName} Team
    `;

    return { subject, html, text };
  }

  static welcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
    const subject = `Chào mừng đến với ${data.appName}! 🎉`;
    const roleText = data.role === 'admin' ? 'Quản trị viên' : 'Học sinh';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐝 ${data.appName}</h1>
            <h2>Chào mừng bạn!</h2>
          </div>
          <div class="content">
            <p>Xin chào <strong>${data.firstName}</strong>,</p>
            <p>🎉 Chào mừng bạn đến với ${data.appName}! Tài khoản <strong>${roleText}</strong> của bạn đã được tạo thành công.</p>
            
            <div class="feature">
              <h3>🚀 Bắt đầu ngay</h3>
              <p>Tài khoản của bạn đã sẵn sàng sử dụng. Hãy đăng nhập và khám phá các tính năng tuyệt vời!</p>
            </div>

            ${data.role === 'student' ? `
            <div class="feature">
              <h3>📚 Dành cho học sinh</h3>
              <p>• Học toán với các bài giảng interactive<br>
              • Làm bài tập và kiểm tra<br>
              • Theo dõi tiến độ học tập</p>
            </div>
            ` : `
            <div class="feature">
              <h3>⚙️ Dành cho quản trị viên</h3>
              <p>• Quản lý học sinh và nội dung<br>
              • Tạo và chỉnh sửa bài giảng<br>
              • Xem báo cáo và thống kê</p>
            </div>
            `}

            <p style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Đăng nhập ngay</a>
            </p>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi từ ${data.appName}<br>
            Đây là email tự động, vui lòng không reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Xin chào ${data.firstName},
      
      Chào mừng bạn đến với ${data.appName}! 
      Tài khoản ${roleText} của bạn đã được tạo thành công.
      
      Đăng nhập ngay tại: ${data.loginUrl}
      
      Trân trọng,
      ${data.appName} Team
    `;

    return { subject, html, text };
  }

  static passwordResetEmail(data: PasswordResetData): { subject: string; html: string; text: string } {
    const subject = `Đặt lại mật khẩu - ${data.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐝 ${data.appName}</h1>
            <h2>Đặt lại mật khẩu</h2>
          </div>
          <div class="content">
            <p>Xin chào <strong>${data.firstName}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <div class="warning">
              <strong>⚠️ Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.
            </div>

            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Đặt lại mật khẩu</a>
            </p>
            
            <p>Hoặc copy và paste link sau vào trình duyệt:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${data.resetUrl}</p>
            
            <p><strong>Lưu ý quan trọng:</strong></p>
            <ul>
              <li>Link đặt lại mật khẩu sẽ hết hạn sau 1 giờ</li>
              <li>Link chỉ có thể sử dụng một lần</li>
              <li>Sau khi đặt lại, hãy đăng nhập với mật khẩu mới</li>
            </ul>
          </div>
          <div class="footer">
            <p>Email này được gửi từ ${data.appName}<br>
            Đây là email tự động, vui lòng không reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Xin chào ${data.firstName},
      
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
      
      Để đặt lại mật khẩu, vui lòng truy cập:
      ${data.resetUrl}
      
      Lưu ý:
      - Link sẽ hết hạn sau 1 giờ
      - Link chỉ có thể sử dụng một lần
      - Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
      
      Trân trọng,
      ${data.appName} Team
    `;

    return { subject, html, text };
  }
}
