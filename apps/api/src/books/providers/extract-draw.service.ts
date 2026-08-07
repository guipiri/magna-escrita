import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import cvModule from '@techstark/opencv-js';
import { Jimp } from 'jimp';
import { BadRequestDrawSquareNotFoundException } from '../books.errors.js';
import { InternalGeminiRecognitionFailedException } from '../books-scan.errors.js';

export interface ExtractDrawService {
  execute(file: Express.Multer.File): Promise<File>;
}

@Injectable()
export class OpenCVDrawExtractor implements ExtractDrawService {
  private readonly logger = new Logger(OpenCVDrawExtractor.name);
  private static cv: any;
  private static cvReadyPromise: Promise<void> | undefined;

  async execute(file: Express.Multer.File): Promise<File> {
    await this.waitForCv();
    const cv = OpenCVDrawExtractor.cv;
    const image = await Jimp.read(file.buffer);
    const { width, height } = image.bitmap;

    // Converte para BGRA (formato nativo do OpenCV)
    const rgbaMat = cv.matFromArray(
      height,
      width,
      cv.CV_8UC4,
      image.bitmap.data,
    );
    const source = new cv.Mat();
    cv.cvtColor(rgbaMat, source, cv.COLOR_RGBA2BGRA);
    rgbaMat.delete();

    const gray = new cv.Mat();
    const edges = new cv.Mat();
    const lines = new cv.Mat();

    try {
      // Pré-processamento: escala de cinza → desfoque → Canny
      cv.cvtColor(source, gray, cv.COLOR_BGRA2GRAY);
      cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
      cv.Canny(gray, edges, 50, 150, 3, false);

      // Transformada de Hough probabilística para detectar segmentos de linha
      // minLineLength = 60 % da largura → ignora riscos curtos
      // maxLineGap   = 2 % da largura → tolera pequenas interrupções
      const minLineLength = Math.round(width * 0.6);
      const maxLineGap = Math.round(width * 0.02);
      cv.HoughLinesP(
        edges,
        lines,
        1, // resolução de ρ em pixels
        Math.PI / 180, // resolução de θ em radianos
        80, // acumulador mínimo de votos
        minLineLength,
        maxLineGap,
      );

      const lineY = this.findHorizontalLineY(lines, width, height);

      if (lineY === null) {
        throw new BadRequestDrawSquareNotFoundException();
      }

      this.logger.log(
        `[ProcessDrawOpenCV] linha horizontal detectada em y=${lineY}`,
      );

      // Crop: tudo abaixo da linha detectada até o final da imagem
      const cropY = lineY + 1;
      const cropHeight = Math.max(1, height - cropY);

      const drawRgba = new cv.Mat();
      try {
        cv.cvtColor(source, drawRgba, cv.COLOR_BGRA2RGBA);
        const cropRoi = drawRgba.roi(new cv.Rect(0, cropY, width, cropHeight));
        const rawImage = new Uint8Array(cropRoi.data.slice());
        const outputImage = Jimp.fromBitmap({
          data: rawImage,
          width: cropRoi.cols,
          height: cropRoi.rows,
        });
        cropRoi.delete();

        const buffer = await outputImage.getBuffer('image/png');
        const baseName = file.originalname.replace(/\.[^.]+$/, '') || 'draw';
        return new File([buffer], `${baseName}-draw.png`, {
          type: 'image/png',
        });
      } finally {
        drawRgba.delete();
      }
    } finally {
      source.delete();
      gray.delete();
      edges.delete();
      lines.delete();
    }
  }

  /**
   * Percorre os segmentos retornados pelo HoughLinesP e elege o y médio
   * da linha horizontal mais representativa da imagem.
   *
   * Critérios de seleção:
   *  - Ângulo próximo de 0° (|Δy| < 2 % da altura)   → verdadeiramente horizontal
   *  - y médio entre 5 % e 80 % da altura             → exclui bordas e área de desenho
   *  - Comprimento horizontal máximo                  → linha que cruza toda a folha
   *
   * Retorna o y arredondado da melhor linha, ou null se não encontrar.
   */
  private findHorizontalLineY(
    lines: any,
    imageWidth: number,
    imageHeight: number,
  ): number | null {
    let bestY: number | null = null;
    let bestLength = 0;

    const maxDeltaY = imageHeight * 0.02; // tolerância de inclinação

    for (let i = 0; i < lines.rows; i++) {
      // Cada linha é [x1, y1, x2, y2]
      const x1 = lines.data32S[i * 4]!;
      const y1 = lines.data32S[i * 4 + 1]!;
      const x2 = lines.data32S[i * 4 + 2]!;
      const y2 = lines.data32S[i * 4 + 3]!;

      const deltaY = Math.abs(y2 - y1);
      const midY = (y1 + y2) / 2;
      const segmentLength = Math.abs(x2 - x1);

      // Filtra: deve ser horizontal e fora das bordas superior/inferior
      if (deltaY > maxDeltaY) continue;
      if (midY < imageHeight * 0.05 || midY > imageHeight * 0.8) continue;

      this.logger.debug(
        `[ProcessDrawOpenCV] candidata: y=${midY.toFixed(0)} len=${segmentLength} deltaY=${deltaY.toFixed(1)}`,
      );

      if (segmentLength > bestLength) {
        bestLength = segmentLength;
        bestY = Math.round(midY);
      }
    }

    return bestY;
  }

  private waitForCv(): Promise<void> {
    if (!OpenCVDrawExtractor.cvReadyPromise) {
      OpenCVDrawExtractor.cvReadyPromise = new Promise<void>((resolve) => {
        (cvModule as any).then((cv: any) => {
          OpenCVDrawExtractor.cv = cv;
          resolve();
        });
      });
    }

    return OpenCVDrawExtractor.cvReadyPromise;
  }
}

@Injectable()
export class GeminiDrawExtractor implements ExtractDrawService {
  private readonly logger = new Logger(GeminiDrawExtractor.name);
  private readonly gemini: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  async execute(file: Express.Multer.File): Promise<File> {
    const baseName = file.originalname.replace(/\.[^.]+$/, '') || 'draw';

    const imageBuffer = await this.extractDrawImageWithGemini(file);

    return new File([new Uint8Array(imageBuffer)], `${baseName}-draw.png`, {
      type: 'image/png',
    });
  }

  /**
   * Asks Gemini (image generation model) to crop and perspective-correct
   * the draw square directly, returning the image as a Buffer.
   * Falls back to coordinate-based Jimp crop if the model doesn't return an image.
   */
  private async extractDrawImageWithGemini(
    file: Express.Multer.File,
  ): Promise<Buffer> {
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-preview-image-generation',
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      } as any,
    });

    const imagePart: Part = {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64'),
      },
    };

    const prompt = `Esta imagem é uma página de um livro de autógrafos escolar.
Ela contém um cabeçalho com QR code e informações do aluno (nome, escola, turma) e abaixo um quadrado delimitado por uma borda onde o aluno fez um desenho.

Sua tarefa:
1. Localize o quadrado do desenho (ignore completamente o cabeçalho).
2. Recorte exatamente o interior do quadrado, corrigindo qualquer distorção de perspectiva ou inclinação.
3. Retorne apenas a imagem recortada e corrigida do desenho, sem bordas, sem o cabeçalho, sem texto ao redor.

Retorne a imagem em PNG.`;

    try {
      this.logger.log(
        'Sending image to Gemini image-generation for draw extraction...',
      );

      const result = await model.generateContent([imagePart, { text: prompt }]);
      const parts = result.response.candidates?.[0]?.content?.parts ?? [];

      for (const part of parts) {
        if ((part as any).inlineData?.data) {
          const inlineData = (part as any).inlineData as {
            data: string;
            mimeType: string;
          };

          this.logger.log(
            `Gemini returned image directly, mimeType: ${inlineData.mimeType}`,
          );

          return Buffer.from(inlineData.data, 'base64');
        }
      }

      this.logger.warn(
        'Gemini image-generation did not return an image part — falling back to coordinate detection.',
      );
    } catch (error) {
      this.logger.warn(
        'Gemini image-generation failed, falling back to coordinate detection:',
        error,
      );
    }

    return this.extractByCoordinates(file);
  }

  /**
   * Fallback: asks a text model for the normalised corner coordinates of the
   * draw square, then uses Jimp to crop the bounding-box from the original image.
   */
  private async extractByCoordinates(
    file: Express.Multer.File,
  ): Promise<Buffer> {
    const model = this.gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const imagePart: Part = {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64'),
      },
    };

    const prompt = `Analise a imagem e encontre o quadrado que contém o desenho do aluno.
Ignore o cabeçalho com QR code e informações do aluno, escola e turma.

Retorne apenas JSON válido, sem markdown, no formato:
{"found":true,"points":[{"x":0.12,"y":0.34},{"x":0.45,"y":0.33},{"x":0.46,"y":0.71},{"x":0.11,"y":0.72}]}

As coordenadas devem ser relativas à imagem inteira (0 = topo/esquerda, 1 = fundo/direita).
Use exatamente 4 pontos nos cantos do quadrado (sentido horário a partir do canto superior-esquerdo).
Se não houver quadrado visível, retorne apenas: {"found":false}`;

    try {
      this.logger.log(
        'Sending image to Gemini for draw square coordinate detection...',
      );

      const result = await model.generateContent([imagePart, { text: prompt }]);
      const detection = this.parseSquareDetection(result.response.text());

      if (
        !detection?.found ||
        !detection.points ||
        detection.points.length !== 4
      ) {
        throw new BadRequestDrawSquareNotFoundException();
      }

      const image = await Jimp.read(file.buffer);
      const { width, height } = image.bitmap;

      const xs = detection.points.map((p) =>
        this.clamp(Math.round(p.x * width), 0, width - 1),
      );
      const ys = detection.points.map((p) =>
        this.clamp(Math.round(p.y * height), 0, height - 1),
      );

      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const w = Math.max(1, Math.max(...xs) - x);
      const h = Math.max(1, Math.max(...ys) - y);

      image.crop({ x, y, w, h });

      return image.getBuffer('image/png');
    } catch (error) {
      if (error instanceof BadRequestDrawSquareNotFoundException) {
        throw error;
      }

      if (error instanceof InternalGeminiRecognitionFailedException) {
        throw error;
      }

      this.logger.error('Gemini coordinate fallback failed:', error);
      throw new InternalGeminiRecognitionFailedException(
        'identificação do quadrado do desenho',
      );
    }
  }

  private parseSquareDetection(text: string): {
    found: boolean;
    points?: Array<{ x: number; y: number }>;
  } | null {
    const trimmed = text.trim();
    const jsonText = trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;

    try {
      return JSON.parse(jsonText) as {
        found: boolean;
        points?: Array<{ x: number; y: number }>;
      };
    } catch {
      throw new InternalGeminiRecognitionFailedException(
        'não foi possível interpretar a resposta do Gemini',
      );
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
