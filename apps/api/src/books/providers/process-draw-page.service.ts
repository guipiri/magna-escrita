import { Injectable } from '@nestjs/common';
import cvModule from '@techstark/opencv-js';
import { Jimp } from 'jimp';
import { BadRequestDrawSquareNotFoundException } from '../books.errors.js';

export interface ProcessDrawContract {
  execute(file: Express.Multer.File): Promise<File>;
}

type Point2D = { x: number; y: number };
type SquarePoints = [Point2D, Point2D, Point2D, Point2D];

@Injectable()
export class ProcessDrawOpenCV implements ProcessDrawContract {
  private static cvPromise: Promise<any> | undefined;

  async execute(file: Express.Multer.File): Promise<File> {
    const cv = await this.getOpenCv();
    const image = await Jimp.read(file.buffer);

    const source = cv.matFromArray(
      image.bitmap.height,
      image.bitmap.width,
      cv.CV_8UC4,
      image.bitmap.data,
    );

    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const thresholded = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    try {
      cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(
        gray,
        blurred,
        new cv.Size(5, 5),
        0,
        0,
        cv.BORDER_DEFAULT,
      );
      cv.adaptiveThreshold(
        blurred,
        thresholded,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV,
        31,
        11,
      );

      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));

      try {
        cv.morphologyEx(
          thresholded,
          thresholded,
          cv.MORPH_CLOSE,
          kernel,
          new cv.Point(-1, -1),
          2,
          cv.BORDER_CONSTANT,
          cv.morphologyDefaultBorderValue(),
        );

        cv.findContours(
          thresholded,
          contours,
          hierarchy,
          cv.RETR_EXTERNAL,
          cv.CHAIN_APPROX_SIMPLE,
        );

        const squarePoints = this.findBestSquareContour(
          cv,
          contours,
          image.bitmap.width,
          image.bitmap.height,
        );

        if (!squarePoints) {
          throw new BadRequestDrawSquareNotFoundException();
        }

        const orderedPoints = this.orderPoints(squarePoints);
        const sideLength = this.getSideLength(orderedPoints);
        const destinationPoints = [
          { x: 0, y: 0 },
          { x: sideLength - 1, y: 0 },
          { x: sideLength - 1, y: sideLength - 1 },
          { x: 0, y: sideLength - 1 },
        ];

        const sourcePoints = cv.matFromArray(
          4,
          1,
          cv.CV_32FC2,
          new Float32Array(
            orderedPoints.flatMap((point) => [point.x, point.y]),
          ),
        );

        const targetPoints = cv.matFromArray(
          4,
          1,
          cv.CV_32FC2,
          new Float32Array(
            destinationPoints.flatMap((point) => [point.x, point.y]),
          ),
        );

        const perspectiveTransform = cv.getPerspectiveTransform(
          sourcePoints,
          targetPoints,
        );

        const warped = new cv.Mat();

        try {
          cv.warpPerspective(
            source,
            warped,
            perspectiveTransform,
            new cv.Size(sideLength, sideLength),
            cv.INTER_LINEAR,
            cv.BORDER_CONSTANT,
            new cv.Scalar(255, 255, 255, 255),
          );

          const margin = Math.max(4, Math.round(sideLength * 0.06));
          const cropSize = Math.max(1, sideLength - margin * 2);
          const drawOnly = warped.roi(
            new cv.Rect(margin, margin, cropSize, cropSize),
          );

          try {
            const rawImage = new Uint8Array(drawOnly.data.slice());
            const outputImage = Jimp.fromBitmap({
              data: rawImage,
              width: drawOnly.cols,
              height: drawOnly.rows,
            });
            const buffer = await outputImage.getBuffer('image/png');
            const baseName =
              file.originalname.replace(/\.[^.]+$/, '') || 'draw';

            return new File([buffer], `${baseName}-draw.png`, {
              type: 'image/png',
            });
          } finally {
            drawOnly.delete();
          }
        } finally {
          warped.delete();
          perspectiveTransform.delete();
          sourcePoints.delete();
          targetPoints.delete();
        }
      } finally {
        kernel.delete();
      }
    } finally {
      source.delete();
      gray.delete();
      blurred.delete();
      thresholded.delete();
      contours.delete();
      hierarchy.delete();
    }
  }

  private async getOpenCv(): Promise<any> {
    if (!ProcessDrawOpenCV.cvPromise) {
      ProcessDrawOpenCV.cvPromise = this.initializeOpenCv();
    }

    return ProcessDrawOpenCV.cvPromise;
  }

  private async initializeOpenCv(): Promise<any> {
    const module = cvModule as any;

    if (typeof module?.then === 'function') {
      return module;
    }

    if (typeof module?.onRuntimeInitialized === 'function') {
      await new Promise<void>((resolve) => {
        module.onRuntimeInitialized = () => resolve();
      });
    }

    return module;
  }

  private findBestSquareContour(
    cv: any,
    contours: any,
    imageWidth: number,
    imageHeight: number,
  ): SquarePoints | null {
    const imageArea = imageWidth * imageHeight;
    let bestPoints: SquarePoints | null = null;
    let bestArea = 0;

    for (let index = 0; index < contours.size(); index++) {
      const contour = contours.get(index);

      try {
        const area = cv.contourArea(contour);

        if (area < imageArea * 0.01) {
          continue;
        }

        const perimeter = cv.arcLength(contour, true);
        const approximation = new cv.Mat();

        try {
          cv.approxPolyDP(contour, approximation, perimeter * 0.02, true);

          if (approximation.rows === 4 && cv.isContourConvex(approximation)) {
            const points = this.matToPoints(approximation);
            const ratio = this.getAspectRatio(points);

            if (ratio <= 1.5 && area > bestArea) {
              bestArea = area;
              bestPoints = points;
            }
          }
        } finally {
          approximation.delete();
        }

        if (!bestPoints && area > bestArea) {
          const rotatedRect = cv.minAreaRect(contour);
          const points = cv.boxPoints(rotatedRect).map((point: any) => ({
            x: point.x,
            y: point.y,
          })) as SquarePoints;
          const ratio = this.getAspectRatio(points);

          if (ratio <= 1.5) {
            bestArea = area;
            bestPoints = points;
          }
        }
      } finally {
        contour.delete();
      }
    }

    return bestPoints;
  }

  private matToPoints(mat: any): SquarePoints {
    const data = mat.data32S as Int32Array | Int8Array | Uint8Array;
    if (mat.rows !== 4) {
      throw new BadRequestDrawSquareNotFoundException();
    }

    const points = [0, 1, 2, 3].map((index) => ({
      x: data[index * 2]!,
      y: data[index * 2 + 1]!,
    }));

    return points as SquarePoints;
  }

  private orderPoints(points: SquarePoints): SquarePoints {
    const sortedBySum = [...points].sort(
      (left, right) => left.x + left.y - (right.x + right.y),
    ) as SquarePoints;
    const sortedByDiff = [...points].sort(
      (left, right) => left.x - left.y - (right.x - right.y),
    ) as SquarePoints;

    const topLeft = sortedBySum[0];
    const topRight = sortedByDiff[0];
    const bottomRight = sortedBySum[sortedBySum.length - 1];
    const bottomLeft = sortedByDiff[sortedByDiff.length - 1];

    if (!topLeft || !topRight || !bottomRight || !bottomLeft) {
      throw new BadRequestDrawSquareNotFoundException();
    }

    return [topLeft, topRight, bottomRight, bottomLeft];
  }

  private getSideLength(points: SquarePoints): number {
    const topWidth = this.distance(points[0], points[1]);
    const rightHeight = this.distance(points[1], points[2]);
    const bottomWidth = this.distance(points[2], points[3]);
    const leftHeight = this.distance(points[3], points[0]);

    return Math.max(
      1,
      Math.round(Math.max(topWidth, rightHeight, bottomWidth, leftHeight)),
    );
  }

  private getAspectRatio(points: SquarePoints): number {
    const topWidth = this.distance(points[0], points[1]);
    const rightHeight = this.distance(points[1], points[2]);
    const bottomWidth = this.distance(points[2], points[3]);
    const leftHeight = this.distance(points[3], points[0]);
    const width = Math.max(topWidth, bottomWidth);
    const height = Math.max(rightHeight, leftHeight);

    return Math.max(width, height) / Math.max(1, Math.min(width, height));
  }

  private distance(left: Point2D, right: Point2D): number {
    return Math.hypot(right.x - left.x, right.y - left.y);
  }
}
