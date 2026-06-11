import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Jimp } from 'jimp';
import {
  InternalGeminiRecognitionFailedException,
  InternalGoogleCloudVisionRecognitionFailedException,
} from '../books-scan.errors.js';

export interface ExtractTextService {
  execute(file: Express.Multer.File): Promise<string>;
}

@Injectable()
export class GeminiTextExtractor implements ExtractTextService {
  gemini: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  async execute(file: Express.Multer.File): Promise<string> {
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-3.5-flash',
    });

    const imagePart: Part = {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64'),
      },
    };

    let text: string;
    try {
      const result = await model.generateContent([
        imagePart,
        {
          text: `Esta imagem é uma página de livro escrita por uma criança.
    Abaixo do cabeçalho há linhas horizontais onde a criança escreveu um texto.
    Se a página for CAPA, você deve retornar apenas o texto do TÍTULO do livro.
    Se a página não for CAPA, transcreva apenas o texto escrito nas linhas.
    Ignore o cabeçalho (QR Code, nome do aluno, turma, escola, etc.).
    Retorne apenas o texto transcrito, sem explicações adicionais e sem parágrafos.
    Se não houver texto escrito, retorne uma string vazia.`,
        },
      ]);
      text = result.response.text().trim();
    } catch (err) {
      console.error('Gemini OCR failed:', err);
      throw new InternalGeminiRecognitionFailedException(
        'reconhecimento de texto (OCR)',
      );
    }

    return text;
  }
}

@Injectable()
export class GoogleCloudVisionTextExtractor implements ExtractTextService {
  private readonly client: ImageAnnotatorClient;
  private readonly headerCropRatio = 0.28;
  private readonly rotationCandidates = [0, 90, 180, 270];

  constructor() {
    this.client = new ImageAnnotatorClient();
  }

  async execute(file: Express.Multer.File): Promise<string> {
    try {
      const image = await Jimp.read(file.buffer);
      const candidates = await Promise.all(
        this.rotationCandidates.map(async (rotation) => {
          const rotated = image.clone();
          if (rotation !== 0) {
            rotated.rotate(rotation);
          }

          const croppedBuffer = await this.cropHeader(rotated);
          const [result] = await this.client.documentTextDetection({
            image: {
              content: croppedBuffer,
            },
          });

          const text = result.fullTextAnnotation?.text?.trim() ?? '';
          return {
            rotation,
            text,
            score: this.scoreText(text),
          };
        }),
      );

      const bestCandidate = candidates.sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return right.text.length - left.text.length;
      })[0];

      if (!bestCandidate || bestCandidate.score === Number.NEGATIVE_INFINITY) {
        return '';
      }

      return bestCandidate.text;
    } catch (err) {
      console.error('Google Cloud Vision OCR failed:', err);
      throw new InternalGoogleCloudVisionRecognitionFailedException(
        'reconhecimento de texto (OCR)',
      );
    }
  }

  private cropHeader(image: any): Promise<Buffer> {
    const { width, height } = image.bitmap;
    const headerBottom = Math.min(
      height - 1,
      Math.max(1, Math.floor(height * this.headerCropRatio)),
    );

    image.crop({
      x: 0,
      y: headerBottom,
      w: width,
      h: height - headerBottom,
    });

    return image.getBuffer('image/png');
  }

  private scoreText(text: string): number {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return 0;

    if (/\b(?:Turma|Evento):/i.test(normalized)) {
      return Number.NEGATIVE_INFINITY;
    }

    const letters = (normalized.match(/[\p{L}]/gu) ?? []).length;
    const digits = (normalized.match(/[\p{N}]/gu) ?? []).length;
    const spaces = (normalized.match(/\s/g) ?? []).length;
    const punctuation = normalized.length - letters - digits - spaces;

    return letters * 3 + digits * 2 + spaces - punctuation;
  }
}
