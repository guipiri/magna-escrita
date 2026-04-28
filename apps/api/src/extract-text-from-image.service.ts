import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import Tesseract from 'tesseract.js';

export interface ExtractTextFromImageService {
  exec(imagePath: string): Promise<string>;
}

@Injectable()
export class TesseractExtractTextFromImageService implements ExtractTextFromImageService {
  async exec(imagePath: string): Promise<string> {
    try {
      const { data } = await Tesseract.recognize(imagePath, 'eng');
      return data.text.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Falha na extração de texto da imagem com Tesseract: ${message}`,
      );
    }
  }
}

// GoogleVision is the winner
@Injectable()
export class GoogleVisionExtractTextFromImageService implements ExtractTextFromImageService {
  private readonly visionClient = new ImageAnnotatorClient();

  async exec(imagePath: string): Promise<string> {
    try {
      const [result] = await this.visionClient.textDetection(imagePath);
      const text = result.fullTextAnnotation?.text ?? '';

      if (text.trim()) {
        return text.trim().replaceAll('\n', ' ');
      }

      return result.textAnnotations?.[0]?.description?.trim() ?? '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Falha na extração de texto da imagem com Google Vision: ${message}`,
      );
    }
  }
}

@Injectable()
export class FastApiTrocrExtractTextFromImageService implements ExtractTextFromImageService {
  async exec(imagePath: string): Promise<string> {
    const apiUrl = process.env.TROCR_API_URL;

    if (!apiUrl) {
      throw new InternalServerErrorException(
        'TROCR_API_URL não configurada. Defina a URL da API FastAPI do TrOCR.',
      );
    }

    try {
      const imageBuffer = await fs.readFile(imagePath);
      const formData = new FormData();
      formData.append(
        'image',
        new Blob([imageBuffer]),
        path.basename(imagePath),
      );

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const body = (await response.json()) as {
          text?: string;
          result?: string;
          data?: { text?: string };
        };

        const text = body.text ?? body.result ?? body.data?.text ?? '';

        if (!text.trim()) {
          throw new Error('Resposta JSON sem campo de texto reconhecido.');
        }

        return text.trim();
      }

      const text = (await response.text()).trim();

      if (!text) {
        throw new Error('Resposta vazia da API FastAPI.');
      }

      return text;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Falha na extração de texto da imagem com FastAPI TrOCR: ${message}`,
      );
    }
  }
}
