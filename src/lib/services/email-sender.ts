// lib/services/email-sender.ts
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

import { db } from "@/db";
import { emailSettings } from "@/db/schema";
import type { EmailOptions, EmailResult } from "@/modules/mailing/types";

// import formData from 'form-data';
// import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
// import sgMail from '@sendgrid/mail';
// import Mailgun from 'mailgun.js';

/**
 * Envía un email utilizando el proveedor configurado
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Obtener la configuración activa del email
    const [emailConfig] = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.isActive, true))
      .limit(1);

    if (!emailConfig) {
      throw new Error("No active email configuration found");
    }

    const providerType = emailConfig.providerType;
    // eslint-disable-next-line
    const providerConfig = emailConfig.providerConfig as Record<string, any>;

    // Validar los parámetros básicos requeridos
    if (!options.to || !options.subject || !options.html) {
      throw new Error("Missing required email parameters: to, subject, or html");
    }

    // Preparar opciones con valores por defecto
    const emailOptions = {
      ...options,
      from: {
        name: options.from?.name || emailConfig.defaultFromName,
        email: options.from?.email || emailConfig.defaultFromEmail,
      },
      replyTo: options.replyTo || emailConfig.defaultReplyTo || emailConfig.defaultFromEmail,
      trackOpens: options.trackOpens !== undefined ? options.trackOpens : true,
      trackClicks: options.trackClicks !== undefined ? options.trackClicks : true,
    };

    // Enviar email según el proveedor configurado
    let result: EmailResult;

    switch (providerType) {
      case "smtp":
        result = await sendViaSmtp(emailOptions, providerConfig);
        break;

      // case 'sendgrid':
      //   result = await sendViaSendgrid(emailOptions, providerConfig);
      //   break;

      // case 'ses':
      //   result = await sendViaSes(emailOptions, providerConfig);
      //   break;

      // case 'mailgun':
      //   result = await sendViaMailgun(emailOptions, providerConfig);
      //   break;

      default:
        throw new Error(`Unsupported email provider: ${providerType}`);
    }

    if (result.success) {
      console.info("Email sent successfully", {
        provider: providerType,
        to: typeof emailOptions.to === "string" ? emailOptions.to : emailOptions.to.join(", "),
        subject: emailOptions.subject,
        messageId: result.messageId,
      });
    } else {
      console.error("Failed to send email", {
        provider: providerType,
        error: result.error,
        to: typeof emailOptions.to === "string" ? emailOptions.to : emailOptions.to.join(", "),
        subject: emailOptions.subject,
      });
    }

    return result;
  } catch (error) {
    console.error("Error in email sender service", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email sender error",
    };
  }
}

/**
 * Envía email a través de Mailgun
 */
// async function sendViaMailgun(options: EmailOptions, config: Record<string, any>): Promise<EmailResult> {
//   try {
//     // Validar configuración de Mailgun
//     if (!config.apiKey || !config.domain) {
//       throw new Error('Missing Mailgun configuration: apiKey or domain');
//     }

//     // Inicializar cliente de Mailgun
//     const mailgun = new Mailgun(formData);
//     const mg = mailgun.client({
//       username: 'api',
//       key: config.apiKey,
//       url: config.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
//     });

//     // Configurar opciones de seguimiento
//     const tracking = {
//       opens: options.trackOpens,
//       clicks: options.trackClicks
//     };

//     // Preparar destinatarios
//     const recipients = Array.isArray(options.to) ? options.to.join(',') : options.to;

//     // Construir el mensaje
//     const message = {
//       from: `${options.from.name} <${options.from.email}>`,
//       to: recipients,
//       subject: options.subject,
//       html: options.html,
//       text: options.text || '',
//       'h:Reply-To': options.replyTo || options.from.email,
//       'o:tracking': tracking.opens || tracking.clicks,
//       'o:tracking-opens': tracking.opens,
//       'o:tracking-clicks': tracking.clicks ? 'htmlonly' : false,
//       'v:X-Metadata': options.metadata ? JSON.stringify(options.metadata) : '{}'
//     };

//     // Añadir attachments si existen
//     if (options.attachments && options.attachments.length > 0) {
//       const attachments: any[] = [];

//       options.attachments.forEach(attachment => {
//         attachments.push({
//           filename: attachment.filename,
//           data: attachment.content,
//           contentType: attachment.contentType
//         });
//       });

//       // @ts-ignore - Mailgun tiene tipos incompletos
//       message.attachment = attachments;
//     }

//     // Enviar email
//     const response = await mg.messages.create(config.domain, message);

//     return {
//       success: true,
//       messageId: response.id,
//       providerResponse: response
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown Mailgun error'
//     };
//   }
// }

/**
 * Envía email a través de SMTP (nodemailer)
 */
async function sendViaSmtp(
  options: EmailOptions,
  // eslint-disable-next-line
  config: Record<string, any>
): Promise<EmailResult> {
  try {
    // Validar configuración SMTP
    const requiredFields = ["host", "port", "username", "password"];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing SMTP configuration: ${field}`);
      }
    }

    console.log("sendViaSmtp config:", config);

    // Crear transporter con retry
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: 465,
      secure: true,
      auth: {
        user: config.username,
        pass: config.password,
      },
      // Reintentar envíos fallidos
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10,
    });

    // Verificar conexión
    await transporter.verify();

    // Preparar opciones de email
    const mailOptions = {
      from: `"${options.from.name}" <${options.from.email}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || "",
      replyTo: options.replyTo || options.from.email,
      attachments: options.attachments || [],
      // Añadir cabeceras de seguimiento si es necesario
      headers: {
        "X-Entity-Ref-ID": options.metadata?.messageId || Date.now().toString(),
        ...(options.metadata
          ? Object.entries(options.metadata).reduce(
              (acc, [key, value]) => {
                acc[`X-Metadata-${key}`] = typeof value === "string" ? value : JSON.stringify(value);
                return acc;
              },
              {} as Record<string, string>
            )
          : {}),
      },
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      providerResponse: info,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown SMTP error",
    };
  }
}

/**
 * Envía email a través de SendGrid
 */
// async function sendViaSendgrid(options: EmailOptions, config: Record<string, any>): Promise<EmailResult> {
//   try {
//     if (!config.apiKey) {
//       throw new Error('Missing SendGrid API key');
//     }

//     // Configurar API key
//     sgMail.setApiKey(config.apiKey);

//     // Preparar mensaje
//     const msg = {
//       to: options.to,
//       from: {
//         email: options.from.email,
//         name: options.from.name
//       },
//       subject: options.subject,
//       html: options.html,
//       text: options.text || '',
//       replyTo: options.replyTo || options.from.email,
//       trackingSettings: {
//         clickTracking: {
//           enable: !!options.trackClicks
//         },
//         openTracking: {
//           enable: !!options.trackOpens
//         }
//       },
//       attachments: options.attachments ? options.attachments.map(att => ({
//         filename: att.filename,
//         content: Buffer.isBuffer(att.content)
//           ? att.content.toString('base64')
//           : Buffer.from(att.content).toString('base64'),
//         type: att.contentType,
//         disposition: 'attachment'
//       })) : [],
//       customArgs: options.metadata ? options.metadata : {}
//     };

//     // Enviar email
//     const response = await sgMail.send(msg);

//     return {
//       success: true,
//       messageId: response[0]?.headers['x-message-id'] || 'unknown',
//       providerResponse: response[0]
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: error instanceof Error
//         ? error.message
//         : (
//           typeof error === 'object' && error !== null && 'response' in error
//             ? (error as any).response?.body
//             : 'Unknown SendGrid error'
//         )
//     };
//   }
// }

/**
 * Envía email a través de Amazon SES
//  */
// async function sendViaSes(options: EmailOptions, config: Record<string, any>): Promise<EmailResult> {
//   try {
//     // Validar configuración SES
//     if (!config.region || !config.accessKeyId || !config.secretAccessKey) {
//       throw new Error('Missing SES configuration: region, accessKeyId, or secretAccessKey');
//     }

//     // Crear cliente SES
//     const sesClient = new SESClient({
//       region: config.region,
//       credentials: {
//         accessKeyId: config.accessKeyId,
//         secretAccessKey: config.secretAccessKey
//       }
//     });

//     // Configurar el contenido del email
//     const params = {
//       Source: `"${options.from.name}" <${options.from.email}>`,
//       Destination: {
//         ToAddresses: Array.isArray(options.to) ? options.to : [options.to]
//       },
//       Message: {
//         Subject: {
//           Data: options.subject,
//           Charset: 'UTF-8'
//         },
//         Body: {
//           Html: {
//             Data: options.html,
//             Charset: 'UTF-8'
//           },
//           ...(options.text ? {
//             Text: {
//               Data: options.text,
//               Charset: 'UTF-8'
//             }
//           } : {})
//         }
//       },
//       ReplyToAddresses: [options.replyTo || options.from.email],
//       // Configuraciones opcionales
//       ConfigurationSetName: config.configurationSet,
//       Tags: options.metadata ? Object.entries(options.metadata).map(([Name, Value]) => ({
//         Name,
//         Value: typeof Value === 'string' ? Value : JSON.stringify(Value)
//       })) : []
//     };

//     // Enviar email
//     const command = new SendEmailCommand(params);
//     const response = await sesClient.send(command);

//     return {
//       success: true,
//       messageId: response.MessageId,
//       providerResponse: response
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown SES error'
//     };
//   }
// }
