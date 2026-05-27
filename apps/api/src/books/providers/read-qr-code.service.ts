import cv from '@techstark/opencv-js';
import jsQR from 'jsqr';

import { Bitmap, Jimp } from 'jimp';
import { Injectable } from '@nestjs/common';

export interface ReadQrCodeService {
  execute(file: Express.Multer.File): Promise<string | null>;
}

@Injectable()
export class ReadQrCodeWithJsQR implements ReadQrCodeService {
  async execute(file: Express.Multer.File): Promise<string | null> {
    let image;
    try {
      image = await Jimp.read(file.buffer);
    } catch {
      return null;
    }

    // run jsQR on a Jimp bitmap safely
    const runJsQrAgainstBitmap = (bitmap: Bitmap) => {
      const { data, width, height } = bitmap;
      try {
        const arr = new Uint8ClampedArray(data);
        const code = jsQR(arr, width, height);
        return code;
      } catch {
        return null;
      }
    };

    // image.greyscale();
    const bitmap = image.bitmap;

    // 1) Try direct
    let code = runJsQrAgainstBitmap(bitmap);
    if (code?.data) return code.data;

    // 2) Try preprocessing: upscale, contrast, invert, rotations
    try {
      const resized = image.clone().resize({
        w: Math.floor(bitmap.width * 2),
        h: Math.floor(bitmap.height * 2),
      });
      code = runJsQrAgainstBitmap(resized.bitmap);
      if (code?.data) return code.data;

      const scaled = image.clone().scale(1.5);
      code = runJsQrAgainstBitmap(scaled.bitmap);
      if (code?.data) return code.data;

      const enhanced = image.clone().greyscale().contrast(0.6).normalize();
      code = runJsQrAgainstBitmap(enhanced.bitmap);
      if (code?.data) return code.data;

      const inverted = image.clone().invert().greyscale();
      code = runJsQrAgainstBitmap(inverted.bitmap);
      if (code?.data) return code.data;

      for (const angle of [90, 180, 270]) {
        const r = image.clone().rotate(angle);
        code = runJsQrAgainstBitmap(r.bitmap);
        if (code?.data) return code.data;
      }
    } catch (e) {
      console.warn('preprocessing attempts failed:', e);
    }

    // 3) Fallback: try OpenCV.js (using matFromArray; avoid ImageData which isn't available in Node)
    try {
      if (cv) {
        const rows = bitmap.height;
        const cols = bitmap.width;
        const numArray = Array.from(bitmap.data);
        const src = cv.matFromArray(rows, cols, cv.CV_8UC4, numArray);

        if (typeof cv.QRCodeDetector === 'function') {
          try {
            const detector = new cv.QRCodeDetector();
            const decoded = detector.detectAndDecode(src);
            // detector.delete?.();
            // src.delete?.();
            if (decoded) return decoded.toString();
          } catch (e) {
            console.warn('OpenCV QRCodeDetector failed:', e);
          }
        }

        try {
          const gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          cv.threshold(gray, gray, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

          const grayData = gray.data;
          const rgba = new Uint8ClampedArray(rows * cols * 4);
          for (let i = 0; i < rows * cols; i++) {
            const v = grayData[i];
            const j = i * 4;
            rgba[j] = v as number;
            rgba[j + 1] = v as number;
            rgba[j + 2] = v as number;
            rgba[j + 3] = 255;
          }

          code = jsQR(rgba, cols, rows);

          gray.delete?.();
          src.delete?.();

          if (code?.data) return code.data;
        } catch (e) {
          console.warn('OpenCV postprocessing failed:', e);
          try {
            src.delete?.();
          } catch (e) {
            console.warn('Failed to delete OpenCV Mat:', e);
          }
        }
      }
    } catch (e) {
      console.warn('OpenCV.js not available or failed to load:', e);
    }

    return null;
  }
}
