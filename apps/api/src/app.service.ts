import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { ExtractTextFromImageService } from './extract-text-from-image.service';

const execFileAsync = promisify(execFile);

interface UploadedImage {
  originalname: string;
  buffer: Buffer;
}

interface PageIdentity {
  alunoId: string;
  pagina: number;
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl?: string;
}

interface S3Sdk {
  S3Client: new (config: {
    region: string;
    endpoint: string;
    credentials: { accessKeyId: string; secretAccessKey: string };
  }) => { send(command: unknown): Promise<unknown> };
  PutObjectCommand: new (input: {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType: string;
  }) => unknown;
}

@Injectable()
export class AppService {
  constructor(
    @Inject('ExtractTextFromImageService')
    private readonly extractTextFromImageService: ExtractTextFromImageService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  async processUploadedPage(image: UploadedImage) {
    const extension = path.extname(image.originalname) || '.png';
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'book-page-'));
    const tempImagePath = path.join(tempDir, `upload${extension}`);

    try {
      await fs.writeFile(tempImagePath, image.buffer);

      const qrPayload = await this.readQrPayload(tempImagePath);
      const identity = this.parseQrPayload(qrPayload);
      const pageFolder = path.resolve(
        process.cwd(),
        'uploads',
        identity.alunoId,
        `pagina-${String(identity.pagina).padStart(3, '0')}`,
      );

      await fs.mkdir(pageFolder, { recursive: true });

      const originalPath = path.join(pageFolder, `original${extension}`);
      const drawingPath = path.join(pageFolder, `desenho${extension}`);
      const textPath = path.join(pageFolder, 'texto.txt');
      const metadataPath = path.join(pageFolder, 'metadata.json');

      await fs.writeFile(originalPath, image.buffer);

      const text = await this.extractTextFromImageService.exec(originalPath);
      await fs.writeFile(textPath, text, 'utf8');

      await this.extractDrawingFromImage(originalPath, drawingPath);
      const r2Drawing = await this.uploadDrawingToR2(
        drawingPath,
        identity.alunoId,
        identity.pagina,
      );

      const metadata = {
        alunoId: identity.alunoId,
        pagina: identity.pagina,
        qrPayload,
        paths: {
          original: originalPath,
          texto: textPath,
          desenho: drawingPath,
        },
        r2: {
          desenho: r2Drawing,
        },
      };

      await fs.writeFile(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        'utf8',
      );

      return {
        mensagem: 'Página processada com sucesso.',
        ...metadata,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  public async extractTextFromImage(imagePath: string): Promise<string> {
    return this.extractTextFromImageService.exec(imagePath);
  }

  private async readQrPayload(imagePath: string): Promise<string> {
    const qrReaderCmd = process.env.QR_READER_CMD ?? 'zbarimg';
    const qrReaderArgs = process.env.QR_READER_ARGS
      ? process.env.QR_READER_ARGS.split(' ').filter(Boolean)
      : ['--quiet', '--raw'];

    try {
      const { stdout } = await execFileAsync(qrReaderCmd, [
        ...qrReaderArgs,
        imagePath,
      ]);
      const payload = stdout.trim();

      if (!payload) {
        throw new BadRequestException(
          'QR code não encontrado na imagem enviada.',
        );
      }

      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('ENOENT')) {
        throw new InternalServerErrorException(
          `Leitor de QR não encontrado. Configure QR_READER_CMD para um binário instalado (ex.: zbarimg).`,
        );
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Não foi possível ler o QR code da imagem. Verifique se o QR está nítido e completo.',
      );
    }
  }

  private parseQrPayload(rawPayload: string): PageIdentity {
    const payload = rawPayload.trim();

    if (payload.startsWith('{')) {
      try {
        const parsed = JSON.parse(payload) as {
          alunoId?: string;
          pagina?: number;
        };
        return this.validateIdentity(parsed.alunoId, parsed.pagina);
      } catch {
        throw new BadRequestException(
          'QR inválido. JSON precisa conter alunoId e pagina válidos.',
        );
      }
    }

    const keyValues = payload
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((pair) => pair.split(':').map((value) => value.trim()));

    const map = new Map(keyValues as [string, string][]);

    return this.validateIdentity(
      map.get('alunoId') ?? map.get('aluno') ?? map.get('studentId'),
      Number(map.get('pagina') ?? map.get('page')),
    );
  }

  private validateIdentity(
    alunoId: string | undefined,
    pagina: number | undefined,
  ): PageIdentity {
    const normalizedAlunoId = alunoId?.trim();

    if (
      !normalizedAlunoId ||
      !pagina ||
      Number.isNaN(Number(pagina)) ||
      Number(pagina) < 1
    ) {
      throw new BadRequestException(
        'QR inválido. Formatos aceitos: {"alunoId":"...","pagina":1} ou aluno:...;pagina:1',
      );
    }

    return {
      alunoId: normalizedAlunoId,
      pagina: Number(pagina),
    };
  }

  public async extractDrawingFromImage(
    imagePath: string,
    drawingPath: string,
  ): Promise<void> {
    const drawingCmd = process.env.DRAWING_EXTRACTOR_CMD;

    if (!drawingCmd) {
      await fs.copyFile(imagePath, drawingPath);
      return;
    }

    const drawingArgs = process.env.DRAWING_EXTRACTOR_ARGS
      ? process.env.DRAWING_EXTRACTOR_ARGS.split(' ').filter(Boolean)
      : [];

    try {
      await execFileAsync(drawingCmd, [...drawingArgs, imagePath, drawingPath]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('ENOENT')) {
        throw new InternalServerErrorException(
          'Comando para extração de desenho não encontrado.',
        );
      }

      throw new InternalServerErrorException(
        'Falha ao extrair o desenho da página.',
      );
    }
  }

  private getR2Config(): R2Config {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new InternalServerErrorException(
        'Cloudflare R2 não configurado. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET.',
      );
    }

    return {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucket,
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    };
  }

  private async loadS3Sdk(): Promise<S3Sdk> {
    try {
      return await import('@aws-sdk/client-s3');
    } catch {
      throw new InternalServerErrorException(
        'Pacote @aws-sdk/client-s3 não encontrado. Instale a dependência para habilitar upload no R2.',
      );
    }
  }

  private async uploadDrawingToR2(
    drawingPath: string,
    alunoId: string,
    pagina: number,
  ): Promise<{ key: string; url: string }> {
    const config = this.getR2Config();
    const { S3Client, PutObjectCommand } = await this.loadS3Sdk();

    const drawingBuffer = await fs.readFile(drawingPath);
    const extension = path.extname(drawingPath) || '.png';
    const key = `${encodeURIComponent(alunoId)}/pagina-${String(pagina).padStart(3, '0')}/desenho${extension}`;

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: drawingBuffer,
        ContentType: this.getContentTypeByExtension(extension),
      }),
    );

    const publicUrl = config.publicBaseUrl
      ? `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${this.encodeS3Key(key)}`;

    return {
      key,
      url: publicUrl,
    };
  }

  private encodeS3Key(key: string): string {
    return key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  private getContentTypeByExtension(extension: string): string {
    switch (extension.toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      default:
        return 'image/png';
    }
  }
}
