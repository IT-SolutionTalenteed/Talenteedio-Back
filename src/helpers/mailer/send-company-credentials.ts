import transporter from './index';

interface CompanyCredentialsData {
  companyName: string;
  email: string;
  password: string;
  adminUrl: string;
}

export async function sendCompanyCredentials(data: CompanyCredentialsData) {
  const { companyName, email, password, adminUrl } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0d6efd;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .credentials-box {
          background-color: white;
          border: 2px solid #0d6efd;
          border-radius: 5px;
          padding: 20px;
          margin: 20px 0;
        }
        .credential-item {
          margin: 10px 0;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 3px;
        }
        .credential-label {
          font-weight: bold;
          color: #0d6efd;
        }
        .credential-value {
          font-family: 'Courier New', monospace;
          font-size: 16px;
          color: #333;
          margin-top: 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #0d6efd;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #6c757d;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Talenteed.io!</h1>
        </div>
        <div class="content">
          <h2>Hello ${companyName},</h2>
          <p>Your company account has been successfully created on Talenteed.io!</p>
          
          <p>You can now access your admin dashboard to manage your job postings, view applications, and connect with talented candidates.</p>
          
          <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>
            <div class="credential-item">
              <div class="credential-label">Email:</div>
              <div class="credential-value">${email}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Password:</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong>
            <ul>
              <li>Please change your password after your first login</li>
              <li>Keep these credentials secure and confidential</li>
              <li>Never share your password with anyone</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${adminUrl}" class="button">Access Your Dashboard</a>
          </div>
          
          <h3>📋 Next Steps:</h3>
          <ol>
            <li>Log in to your dashboard using the credentials above</li>
            <li>Complete your company profile</li>
            <li>Post your first job opening</li>
            <li>Start receiving applications from qualified candidates</li>
          </ol>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The Talenteed.io Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Talenteed.io - All rights reserved</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: 'Talenteed.io ' + process.env.MAILUSER,
    to: email,
    subject: `Welcome to Talenteed.io - Your Account Credentials`,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Company credentials email sent to ${email}:`, info.messageId);
  return info;
}
