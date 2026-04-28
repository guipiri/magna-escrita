import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('book-pages/upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadPage(
    @UploadedFile()
    image: { originalname: string; buffer: Buffer } | undefined,
  ) {
    if (!image) {
      throw new BadRequestException(
        'Envie apenas o arquivo no campo "image" (multipart/form-data).',
      );
    }

    return this.appService.processUploadedPage(image);
  }

  @Post('debug/ocr')
  @UseInterceptors(FileInterceptor('image'))
  async testOcr(
    @UploadedFile()
    image: { originalname: string; buffer: Buffer } | undefined,
  ) {
    if (!image) {
      throw new BadRequestException(
        'Envie apenas o arquivo no campo "image" (multipart/form-data).',
      );
    }

    const extension = path.extname(image.originalname) || '.png';
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-test-'));
    const tempImagePath = path.join(tempDir, `upload${extension}`);

    try {
      await fs.writeFile(tempImagePath, image.buffer);
      const text = await this.appService.extractTextFromImage(tempImagePath);
      return { text };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  @Post('debug/drawing')
  @UseInterceptors(FileInterceptor('image'))
  async testDrawingExtraction(
    @UploadedFile()
    image: { originalname: string; buffer: Buffer } | undefined,
  ) {
    if (!image) {
      throw new BadRequestException(
        'Envie apenas o arquivo no campo "image" (multipart/form-data).',
      );
    }

    const extension = path.extname(image.originalname) || '.png';
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'drawing-test-'));
    const tempImagePath = path.join(tempDir, `upload${extension}`);
    const tempDrawingPath = path.join(tempDir, `desenho${extension}`);

    try {
      await fs.writeFile(tempImagePath, image.buffer);
      await this.appService.extractDrawingFromImage(
        tempImagePath,
        tempDrawingPath,
      );

      return {
        mensagem: 'Extração de desenho executada com sucesso.',
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
