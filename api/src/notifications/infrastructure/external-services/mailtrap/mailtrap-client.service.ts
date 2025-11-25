import { Injectable, Logger } from '@nestjs/common'
import { MailtrapClient } from 'mailtrap'

import { Notification, NotificationBatch } from 'src/notifications/domain'
import { EmailVendor } from 'src/notifications/domain/services/email/email-vendor.interface'
import { EmailContactInfo } from 'src/notifications/domain/value-objects/email-contact-info.vo'

@Injectable()
export class EmailClientService implements EmailVendor {
  private readonly logger = new Logger(EmailClientService.name)
  private readonly mailtrapClient: MailtrapClient
  private readonly sender = {
    email: 'coordenacao@programaincluir.org',
    name: 'Programa Incluir'
  }

  constructor() {
    // Debug: Log all environment variables that start with SMTP
    const smtpVars = Object.keys(process.env).filter((key) =>
      key.startsWith('SMTP')
    )
    this.logger.log(
      `Available SMTP environment variables: ${smtpVars.join(', ')}`
    )

    const token = process.env.SMTP_PASSWORD
    this.logger.log(
      `SMTP_PASSWORD value: ${token ? '***' + token.slice(-4) : 'undefined'}`
    )

    if (!token) {
      this.logger.error('SMTP_PASSWORD environment variable is not configured')
      throw new Error('SMTP_PASSWORD is required for email notifications')
    }

    this.mailtrapClient = new MailtrapClient({ token })
    this.logger.log('EmailClientService initialized with Mailtrap API')
  }

  async send(notification: Notification): Promise<void> {
    try {
      // Validate that this is an email notification
      if (notification.channel.value !== 'email') {
        throw new Error('Notification is not an email notification')
      }

      // Extract contact info and validate it's email contact info
      const contactInfo = notification.contactInfo
      if (!(contactInfo instanceof EmailContactInfo)) {
        throw new Error('Contact info is not email contact info')
      }

      const emailAddress = contactInfo.format()

      this.logger.log(
        `Sending email to ${emailAddress} for notification ${notification.id.value}`
      )

      const recipients = [{ email: emailAddress }]

      const result = await this.mailtrapClient.send({
        from: this.sender,
        to: recipients,
        subject: notification.content.title,
        html: this.generateEmailHTML(notification),
        category: 'Notification'
      })

      this.logger.log(
        `Email sent successfully. Message IDs: ${result.message_ids?.join(', ')}`
      )
    } catch (error) {
      this.logger.error(
        `Failed to send email for notification ${notification.id.value}: ${error.message}`,
        error.stack
      )
      throw error
    }
  }

  async sendBatch(
    batchData: NotificationBatch
  ): Promise<{ successEmails: Notification[]; failedEmails: Notification[] }> {
    try {
      this.logger.log(`Sending batch of ${batchData.notificationCount} emails`)

      // Prepare batch emails for Mailtrap batchSend
      const batchEmails = batchData.notifications.map((notification) => {
        // Validate that this is an email notification
        if (notification.channel.value !== 'email') {
          throw new Error(
            `Notification ${notification.id.value} is not an email notification`
          )
        }

        // Extract contact info and validate it's email contact info
        const contactInfo = notification.contactInfo
        if (!(contactInfo instanceof EmailContactInfo)) {
          throw new Error(
            `Contact info for notification ${notification.id.value} is not email contact info`
          )
        }

        return {
          from: this.sender,
          to: [{ email: contactInfo.format() }],
          subject: notification.content.title,
          html: this.generateEmailHTML(notification),
          category: 'Notification'
        }
      })

      // Send batch using Mailtrap's batchSend method
      const result = await this.mailtrapClient.batchSend({
        requests: batchEmails
      })

      this.logger.log(
        `Batch sent successfully. Response: ${JSON.stringify(result)}`
      )

      // All emails in the batch were sent successfully
      return {
        successEmails: [...batchData.notifications],
        failedEmails: []
      }
    } catch (error) {
      this.logger.error(`Failed to send email batch: ${error.message}`)

      // If batch send fails, consider all emails as failed
      return {
        successEmails: [],
        failedEmails: [...batchData.notifications]
      }
    }
  }

  /**
   * Generate HTML content for email notifications
   */
  private generateEmailHTML(notification: Notification): string {
    const formattedDate = notification.createdAt.toLocaleDateString('pt-BR')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #FF6B4A;
            padding: 20px;
            text-align: center;
          }
          .header img {
            width: 100%;
            height: auto;
            max-width: 400px;
            display: block;
            margin: 0 auto;
          }
          .content {
            padding: 30px;
          }
          .notification-title {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: bold;
          }
          .notification-message {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .notification-meta {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .meta-item {
            margin: 5px 0;
            color: #555;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
          </div>
          <div class="content">
            <div class="notification-title">${notification.content.title}</div>
            <div class="notification-message">${notification.content.body}</div>
            <div class="notification-meta">
              <div class="meta-item"><strong>Canal:</strong> ${notification.channel.value}</div>
              <div class="meta-item"><strong>Data:</strong> ${formattedDate}</div>
            </div>
          </div>
          <div class="footer">
            <p>Por favor, não responda a este email. Qualquer dúvida, entre em contato com o whatsapp do incluir (+55 31 7211-4892).</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
