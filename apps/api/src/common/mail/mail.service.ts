import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { ScanPageResult, ScanPageStatusEnum, UserRole } from '@repo/shared';

export type ScanResultDetail = ScanPageResult;

export interface BookPdfResultDetail {
  bookTitle: string;
  magnificCode: string;
  status: 'success' | 'error';
  interiorPdfUrl?: string;
  coverPdfUrl?: string;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.getOrThrow<string>('SMTP_FROM');
    this.appUrl = this.configService.getOrThrow<string>('APP_URL');

    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = this.configService.getOrThrow<number>('SMTP_PORT');
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');
    const secure = this.configService.getOrThrow<boolean>('SMTP_SECURE');

    try {
      const auth = user && pass ? { user, pass } : undefined;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth,
      });
      this.logger.log(
        `Nodemailer SMTP transporter initialized for host ${host}`,
      );
    } catch (err) {
      this.logger.error('Failed to create nodemailer SMTP transporter:', err);
    }
  }

  async sendScanSummaryEmail(
    toEmail: string,
    results: ScanPageResult[],
  ): Promise<void> {
    const succeeded = results.filter(
      (r) => r.status === ScanPageStatusEnum.SUCCESS,
    );
    const failed = results.filter((r) => r.status === ScanPageStatusEnum.ERROR);

    const subject = `[Magna Escrita] Resumo de Processamento de Escaneamento - ${succeeded.length} Sucessos, ${failed.length} Falhas`;

    const rowsHtml =
      results.length > 0
        ? results
            .map((r) => {
              const isSuccess = r.status === ScanPageStatusEnum.SUCCESS;
              return `
          <tr style="border-bottom: 1px solid #e2e8f0; ${isSuccess ? '' : 'background-color: #fef2f2;'}">
            <td style="padding: 10px; font-size: 14px; color: #1e293b;">${r.filename}</td>
            <td style="padding: 10px; font-size: 14px; color: ${isSuccess ? '#10b981' : '#ef4444'}; font-weight: bold;">
              ${isSuccess ? 'Sucesso' : 'Erro'}
            </td>
            <td style="padding: 10px; font-size: 14px; color: ${isSuccess ? '#1e293b' : '#7f1d1d'};">
              ${isSuccess ? `Página ${r.pageNumber}` : (r.error ?? 'Falha desconhecida')}
            </td>
          </tr>
        `;
            })
            .join('')
        : `
          <tr>
            <td colspan="3" style="padding: 15px; text-align: center; font-size: 14px; color: #64748b;">
              Nenhum detalhe de processamento disponível.
            </td>
          </tr>
        `;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #3b82f6; padding: 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Resumo do Escaneamento</h1>
        </div>
        
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Olá,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">
            ${
              failed.length === 0
                ? 'O processamento do lote de upload em massa que você enviou foi concluído com sucesso. Aqui estão os resultados detalhados:'
                : 'O processamento do lote de upload em massa que você enviou foi concluído. Aqui estão os resultados detalhados:'
            }
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
              ${rowsHtml}
            </tbody>
          </table>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Este é um e-mail automático enviado pelo sistema Magna Escrita. Por favor, não responda a esta mensagem.
          </p>
        </div>
      </div>
    `;

    try {
      await this?.transporter?.sendMail({
        from: this.from,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Email notification successfully sent to ${toEmail}`);
    } catch (err) {
      this.logger.error(
        `Failed to send email notification to ${toEmail}:`,
        err,
      );
    }
  }

  async sendBookPdfResultEmail(
    toEmail: string,
    detail: BookPdfResultDetail,
  ): Promise<void> {
    const isSuccess = detail.status === 'success';
    const subject = isSuccess
      ? `[Magna Escrita] PDF do livro "${detail.bookTitle}" gerado com sucesso`
      : `[Magna Escrita] Falha na geração do PDF do livro "${detail.bookTitle}"`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: ${isSuccess ? '#10b981' : '#ef4444'}; padding: 20px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${isSuccess ? 'Geração de PDF Concluída' : 'Erro na Geração de PDF'}</h1>
        </div>
        
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Olá,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">
            ${
              isSuccess
                ? `O PDF do livro <strong>"${detail.bookTitle}"</strong> (Código: <code>${detail.magnificCode}</code>) foi gerado e processado com sucesso.`
                : `Ocorreu uma falha ao gerar o PDF do livro <strong>"${detail.bookTitle}"</strong> (Código: <code>${detail.magnificCode}</code>).`
            }
          </p>

          ${
            isSuccess
              ? `
          <div style="margin: 20px 0; padding: 15px; border-radius: 6px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0; font-size: 14px; color: #475569;">Arquivos gerados:</p>
            ${detail.interiorPdfUrl ? `<p style="margin: 5px 0; font-size: 14px;"><a href="${detail.interiorPdfUrl}" style="color: #7b0093; text-decoration: underline;">Baixar PDF do Miolo</a></p>` : ''}
            ${detail.coverPdfUrl ? `<p style="margin: 5px 0; font-size: 14px;"><a href="${detail.coverPdfUrl}" style="color: #7b0093; text-decoration: underline;">Baixar PDF da Capa</a></p>` : ''}
          </div>
          `
              : `
          <div style="margin: 20px 0; padding: 15px; border-radius: 6px; background-color: #fef2f2; border: 1px solid #fee2e2;">
            <p style="margin: 5px 0; font-size: 14px; color: #991b1b;"><strong>Detalhes do erro:</strong> ${detail.error ?? 'Falha desconhecida no processamento'}</p>
          </div>
          `
          }

          <p style="font-size: 14px; color: #64748b; margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Este é um e-mail automático enviado pelo sistema Magna Escrita. Por favor, não responda a esta mensagem.
          </p>
        </div>
      </div>
    `;

    try {
      await this?.transporter?.sendMail({
        from: this.from,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      this.logger.log(
        `Email notification for book PDF result sent to ${toEmail}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send book PDF result email to ${toEmail}:`,
        err,
      );
    }
  }

  async sendNewUserWelcomeEmail(
    toEmail: string,
    role?: UserRole,
    customAppUrl?: string,
  ): Promise<void> {
    const appUrl = customAppUrl || this.appUrl;
    const subject = 'Seu acesso à plataforma Magna Escrita está liberado!';

    let roleLabel = '';
    if (role === UserRole.ADMIN) {
      roleLabel = 'Administrador';
    } else if (role === UserRole.SCHOOL) {
      roleLabel = 'Gestão Escolar';
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #7b0093; padding: 24px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Boas-vindas!</h1>
        </div>
        
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-top: 0;">Olá,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            Você foi adicionado(a) com sucesso à plataforma do <strong>Magna Escrita</strong>.
          </p>

          <div style="margin: 24px 0; padding: 18px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            <p style="margin: 6px 0; font-size: 14px; color: #475569;">
              E-mail autorizado: <strong style="color: #1e293b;">${toEmail}</strong>
            </p>
            <p style="margin: 6px 0; font-size: 14px; color: #475569;">
              Perfil de acesso: <strong style="color: #1e293b;">${roleLabel}</strong>
            </p>
            <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
              Para acessar, faça login utilizando sua conta Google vinculada a este endereço de e-mail.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${appUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #7b0093; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; display: inline-block;">
              Acessar a Plataforma
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; text-align: center; word-break: break-all; margin: 16px 0;">
            Ou copie e cole o link no seu navegador:<br />
            <a href="${appUrl}" style="color: #7b0093;">${appUrl}</a>
          </p>

          <p style="font-size: 13px; color: #94a3b8; margin-top: 36px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Este é um e-mail automático gerado pelo sistema Magna Escrita. Por favor, não responda a esta mensagem.
          </p>
        </div>
      </div>
    `;

    const isSchoolOrAdmin = role === UserRole.SCHOOL || role === UserRole.ADMIN;

    if (this.transporter && isSchoolOrAdmin) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: toEmail,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Welcome email successfully sent to ${toEmail}`);
      } catch (err) {
        this.logger.error(`Failed to send welcome email to ${toEmail}:`, err);
      }
    }
  }
}
