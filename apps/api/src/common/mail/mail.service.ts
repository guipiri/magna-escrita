import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export interface ScanResultDetail {
  filename: string;
  studentId: string;
  pageNumber: number;
  status: 'success' | 'error';
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@magnaescrita.com.br',
    );

    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 1025);
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASS', '');
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);

    // Initialize transporter only if valid configuration is provided.
    // If it's a default/development environment without custom configs,
    // we can skip initialization and log to console instead.
    if (host && host !== 'localhost') {
      try {
        const auth = user && pass ? { user, pass } : undefined;
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth,
        });
        this.logger.log(`Nodemailer SMTP transporter initialized for host ${host}`);
      } catch (err) {
        this.logger.error('Failed to create nodemailer SMTP transporter:', err);
      }
    } else {
      this.logger.log('Nodemailer SMTP host is localhost or not configured; falling back to console log for email dispatch.');
    }
  }

  async sendScanSummaryEmail(
    toEmail: string,
    results: ScanResultDetail[],
  ): Promise<void> {
    const succeeded = results.filter((r) => r.status === 'success');
    const failed = results.filter((r) => r.status === 'error');

    const subject = `[Magna Escrita] Resumo de Processamento de Escaneamento - ${succeeded.length} Sucessos, ${failed.length} Erros`;

    const succeededRowsHtml = succeeded
      .map(
        (r) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 14px; color: #1e293b;">${r.filename}</td>
        <td style="padding: 10px; font-size: 14px; color: #10b981; font-weight: bold;">Sucesso</td>
        <td style="padding: 10px; font-size: 14px; color: #1e293b;">Página ${r.pageNumber}</td>
      </tr>
    `,
      )
      .join('');

    const failedRowsHtml = failed
      .map(
        (r) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: #fef2f2;">
        <td style="padding: 10px; font-size: 14px; color: #1e293b;">${r.filename}</td>
        <td style="padding: 10px; font-size: 14px; color: #ef4444; font-weight: bold;">Erro</td>
        <td style="padding: 10px; font-size: 14px; color: #7f1d1d;">${r.error ?? 'Falha desconhecida'}</td>
      </tr>
    `,
      )
      .join('');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #3b82f6; padding: 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Resumo do Escaneamento</h1>
        </div>
        
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Olá,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">
            O processamento do lote de upload em massa que você enviou foi concluído com sucesso. Aqui estão os resultados detalhados:
          </p>
          
          <div style="margin: 20px 0; padding: 15px; border-radius: 6px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0; font-size: 14px; color: #475569;">Total de Imagens Processadas: <strong>${results.length}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #10b981;">Processadas com Sucesso: <strong>${succeeded.length}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #ef4444;">Falhas: <strong>${failed.length}</strong></p>
          </div>
          
          <h2 style="font-size: 18px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">Detalhes do Processamento</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 10px; font-size: 14px; color: #475569; border-bottom: 2px solid #cbd5e1;">Nome do Arquivo</th>
                <th style="padding: 10px; font-size: 14px; color: #475569; border-bottom: 2px solid #cbd5e1;">Status</th>
                <th style="padding: 10px; font-size: 14px; color: #475569; border-bottom: 2px solid #cbd5e1;">Info / Erro</th>
              </tr>
            </thead>
            <tbody>
              ${succeededRowsHtml}
              ${failedRowsHtml}
            </tbody>
          </table>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Este é um e-mail automático enviado pelo sistema Magna Escrita. Por favor, não responda a esta mensagem.
          </p>
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: toEmail,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Email notification successfully sent to ${toEmail}`);
      } catch (err) {
        this.logger.error(`Failed to send email notification to ${toEmail}:`, err);
      }
    } else {
      this.logger.log(`
--- SIMULATED EMAIL DISPATCH ---
To: ${toEmail}
Subject: ${subject}
Content:
${htmlContent.replace(/<[^>]*>/g, ' ').trim()}
---------------------------------
      `);
    }
  }
}
