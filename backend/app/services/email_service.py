from typing import Optional, Dict, Any
from datetime import datetime
import logging
import os

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.sendgrid_api_key = os.environ.get("SENDGRID_API_KEY")
        self.from_email = os.environ.get("FROM_EMAIL", "noreply@onda.com.au")
        self.is_configured = bool(self.sendgrid_api_key)
    
    async def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        if not self.is_configured:
            logger.info(f"Email service not configured. Would send to {to_email}: {subject}")
            return True
        
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail
            
            sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )
            response = sg.send(message)
            logger.info(f"Email sent to {to_email}, status: {response.status_code}")
            return response.status_code in [200, 201, 202]
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    async def send_booking_confirmation(self, booking_data: Dict[str, Any]) -> bool:
        subject = f"Booking Confirmed - {booking_data.get('stylist_name', 'Your Stylist')}"
        
        scheduled = booking_data.get('scheduled_datetime')
        if isinstance(scheduled, datetime):
            date_str = scheduled.strftime("%A, %B %d, %Y at %I:%M %p")
        else:
            date_str = str(scheduled)
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Onda</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Your Booking is Confirmed!</h2>
                <p>Hi {booking_data.get('client_name', 'there')},</p>
                <p>Your appointment has been confirmed with the following details:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Stylist:</strong> {booking_data.get('stylist_name', 'N/A')}</p>
                    <p><strong>Date & Time:</strong> {date_str}</p>
                    <p><strong>Services:</strong> {', '.join(booking_data.get('services', []))}</p>
                    <p><strong>Location:</strong> {booking_data.get('location', 'To be confirmed')}</p>
                    <p><strong>Total:</strong> ${booking_data.get('total_price', 0):.2f}</p>
                </div>
                
                <p>Need to make changes? You can manage your booking in the app.</p>
                <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact your stylist through the app.</p>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center; color: white; font-size: 12px;">
                <p>Onda - Luxury at Your Doorstep</p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=booking_data.get('client_email', ''),
            subject=subject,
            html_content=html_content
        )
    
    async def send_booking_reminder(self, booking_data: Dict[str, Any], hours_until: int = 24) -> bool:
        subject = f"Reminder: Your appointment is in {hours_until} hours"
        
        scheduled = booking_data.get('scheduled_datetime')
        if isinstance(scheduled, datetime):
            date_str = scheduled.strftime("%A, %B %d at %I:%M %p")
        else:
            date_str = str(scheduled)
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Onda</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Your Appointment is Coming Up!</h2>
                <p>Hi {booking_data.get('client_name', 'there')},</p>
                <p>This is a friendly reminder that your beauty appointment is scheduled for:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="font-size: 24px; color: #9333ea; margin: 0;"><strong>{date_str}</strong></p>
                    <p style="color: #6b7280;">with {booking_data.get('stylist_name', 'your stylist')}</p>
                </div>
                
                <p><strong>Services:</strong> {', '.join(booking_data.get('services', []))}</p>
                <p><strong>Location:</strong> {booking_data.get('location', 'Check app for details')}</p>
                
                <p style="color: #6b7280; font-size: 14px;">Need to cancel or reschedule? Please do so at least {booking_data.get('cancellation_hours', 24)} hours in advance to avoid fees.</p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=booking_data.get('client_email', ''),
            subject=subject,
            html_content=html_content
        )
    
    async def send_cancellation_notification(self, booking_data: Dict[str, Any], cancelled_by: str, fee_amount: float = 0) -> bool:
        subject = "Booking Cancelled - Onda"
        
        fee_text = ""
        if fee_amount > 0:
            fee_text = f"<p style='color: #dc2626;'><strong>Cancellation Fee:</strong> ${fee_amount:.2f}</p>"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b7280; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Onda</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Booking Cancelled</h2>
                <p>Hi {booking_data.get('client_name', 'there')},</p>
                <p>Your booking has been cancelled by {cancelled_by}.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Original Date:</strong> {booking_data.get('scheduled_datetime', 'N/A')}</p>
                    <p><strong>Services:</strong> {', '.join(booking_data.get('services', []))}</p>
                    {fee_text}
                </div>
                
                <p>We hope to see you again soon!</p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=booking_data.get('client_email', ''),
            subject=subject,
            html_content=html_content
        )

    async def send_password_reset(self, to_email: str, user_name: str, reset_link: str) -> bool:
        subject = "Reset Your Password - Onda"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Onda</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Password Reset Request</h2>
                <p>Hi {user_name or 'there'},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security.</p>
                <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>
                
                <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="color: #9333ea; font-size: 12px; word-break: break-all; margin: 5px 0 0 0;">{reset_link}</p>
                </div>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center; color: white; font-size: 12px;">
                <p>Onda - Luxury at Your Doorstep</p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content
        )

    async def send_admin_onboarding(self, to_email: str, admin_name: str, setup_link: str) -> bool:
        subject = "Welcome to Onda — Administrator Onboarding"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #9333ea, #ec4899); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Onda</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Welcome to the Onda Team, {admin_name}</h2>
                <p>You have been granted administrator access to the Onda platform. As an administrator, you will have access to sensitive platform data, user information, and intellectual property.</p>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #856404; margin-top: 0;">Important: HR &amp; Compliance Requirements</h3>
                    <p style="color: #856404; margin-bottom: 0;">By accepting this role, you acknowledge and agree to the following:</p>
                </div>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <h4 style="color: #1f2937; margin-top: 0;">1. Confidentiality &amp; Non-Disclosure</h4>
                    <p style="color: #4b5563;">All platform data, user records, business strategies, algorithms, and internal processes are strictly confidential. You must not disclose, share, or use any information obtained through your admin access for personal gain or any purpose outside your role.</p>
                </div>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <h4 style="color: #1f2937; margin-top: 0;">2. Intellectual Property Agreement</h4>
                    <p style="color: #4b5563;">All code, designs, processes, documentation, and materials created or accessed through the Onda platform remain the exclusive property of Onda and its owners. You agree not to reproduce, distribute, or create derivative works from any platform intellectual property.</p>
                </div>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <h4 style="color: #1f2937; margin-top: 0;">3. Role Responsibilities</h4>
                    <ul style="color: #4b5563;">
                        <li>Monitor and moderate platform content, user accounts, and transactions</li>
                        <li>Handle support tickets, disputes, and complaints professionally</li>
                        <li>Manage stylist onboarding, credential verification, and approvals</li>
                        <li>Maintain data privacy standards in compliance with Australian Privacy Act 1988</li>
                        <li>Report any security incidents or data breaches immediately</li>
                    </ul>
                </div>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <h4 style="color: #1f2937; margin-top: 0;">4. Data Protection &amp; Privacy</h4>
                    <p style="color: #4b5563;">You must handle all personal data in accordance with the Australian Privacy Act 1988 and applicable New Zealand privacy legislation. Unauthorised access, export, or misuse of user data is prohibited and may result in legal action.</p>
                </div>
                
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <h4 style="color: #1f2937; margin-top: 0;">5. Termination &amp; Post-Employment</h4>
                    <p style="color: #4b5563;">Upon termination of your administrator role, all access will be revoked immediately. Confidentiality and IP obligations survive termination indefinitely. You must return or delete any platform materials in your possession.</p>
                </div>
                
                <p style="color: #4b5563; margin-top: 20px;">By continuing to use your admin account, you acknowledge acceptance of these terms. If you have questions or concerns, please contact the platform owner directly.</p>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    This email was sent by the Onda platform. If you did not expect to receive this email, please disregard it and contact support immediately.
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to_email, subject, html_content)

email_service = EmailService()
