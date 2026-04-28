#!/usr/bin/env python3
"""Extract the drawing area from a photographed worksheet page.

Usage:
  python3 extract_drawing_cv.py <input_image> <output_image>

The script tries to:
1) rectify page perspective;
2) detect the rectangle/square that contains the drawing;
3) save only the detected drawing crop.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


@dataclass
class Box:
    x: int
    y: int
    w: int
    h: int


def order_points(points: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = points.sum(axis=1)
    rect[0] = points[np.argmin(s)]
    rect[2] = points[np.argmax(s)]

    diff = np.diff(points, axis=1)
    rect[1] = points[np.argmin(diff)]
    rect[3] = points[np.argmax(diff)]
    return rect


def four_point_transform(image: np.ndarray, points: np.ndarray) -> np.ndarray:
    rect = order_points(points)
    (tl, tr, br, bl) = rect

    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = int(max(width_a, width_b))

    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = int(max(height_a, height_b))

    max_width = max(1, max_width)
    max_height = max(1, max_height)

    dst = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype="float32",
    )

    transform = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, transform, (max_width, max_height))


def detect_page_contour(image: np.ndarray) -> np.ndarray | None:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    image_area = image.shape[0] * image.shape[1]

    best: np.ndarray | None = None
    best_area = 0.0

    for contour in contours:
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)

        if len(approx) != 4:
            continue

        area = cv2.contourArea(approx)
        if area < image_area * 0.30:
            continue

        if area > best_area:
            best_area = area
            best = approx.reshape(4, 2)

    return best


def detect_drawing_box(page: np.ndarray) -> Box | None:
    gray = cv2.cvtColor(page, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    binary = cv2.adaptiveThreshold(
        blur,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        31,
        7,
    )

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    page_h, page_w = page.shape[:2]
    page_area = page_h * page_w

    candidates: list[tuple[float, Box]] = []

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)

        area = w * h
        if area < page_area * 0.08:
            continue

        ratio = w / float(h)
        if ratio < 0.6 or ratio > 1.7:
            continue

        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.03 * perimeter, True)
        if len(approx) < 4 or len(approx) > 8:
            continue

        # Prefer large, near-square, centered regions.
        center_x = x + w / 2
        center_y = y + h / 2
        center_score = 1.0 - (
            abs(center_x - page_w / 2) / (page_w / 2) * 0.4
            + abs(center_y - page_h / 2) / (page_h / 2) * 0.6
        )

        square_score = 1.0 - abs(1.0 - ratio)
        size_score = min(1.0, area / (page_area * 0.45))

        score = size_score * 0.55 + square_score * 0.30 + center_score * 0.15
        candidates.append((score, Box(x, y, w, h)))

    if not candidates:
        return None

    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]


def detect_box_by_qr_anchor(page: np.ndarray) -> Box | None:
    detector = cv2.QRCodeDetector()
    ok, points = detector.detect(page)

    if not ok or points is None:
        return None

    qr = points[0]
    min_x = int(np.min(qr[:, 0]))
    max_x = int(np.max(qr[:, 0]))
    min_y = int(np.min(qr[:, 1]))
    max_y = int(np.max(qr[:, 1]))

    page_h, page_w = page.shape[:2]
    qr_w = max(1, max_x - min_x)
    qr_h = max(1, max_y - min_y)

    # Heuristic: drawing box tends to be larger and away from QR.
    # We search in the opposite side from the QR center.
    qr_center_x = (min_x + max_x) / 2
    qr_center_y = (min_y + max_y) / 2

    if qr_center_x < page_w / 2:
        x = int(page_w * 0.35)
        w = int(page_w * 0.58)
    else:
        x = int(page_w * 0.07)
        w = int(page_w * 0.58)

    if qr_center_y < page_h / 2:
        y = int(page_h * 0.30)
        h = int(page_h * 0.62)
    else:
        y = int(page_h * 0.05)
        h = int(page_h * 0.62)

    # Keep a weak relation with QR size to avoid pathological crops.
    min_w = int(qr_w * 6)
    min_h = int(qr_h * 6)
    w = max(w, min_w)
    h = max(h, min_h)

    x = max(0, min(x, page_w - 1))
    y = max(0, min(y, page_h - 1))
    w = min(w, page_w - x)
    h = min(h, page_h - y)

    if w <= 0 or h <= 0:
        return None

    return Box(x, y, w, h)


def crop_with_margin(image: np.ndarray, box: Box, margin_ratio: float = 0.02) -> np.ndarray:
    h, w = image.shape[:2]
    margin = int(min(w, h) * margin_ratio)

    x1 = max(0, box.x - margin)
    y1 = max(0, box.y - margin)
    x2 = min(w, box.x + box.w + margin)
    y2 = min(h, box.y + box.h + margin)

    return image[y1:y2, x1:x2]


def extract_drawing(input_path: Path, output_path: Path) -> None:
    image = cv2.imread(str(input_path))
    if image is None:
        raise RuntimeError(f"Não foi possível abrir a imagem: {input_path}")

    page_contour = detect_page_contour(image)
    if page_contour is not None:
        page = four_point_transform(image, page_contour)
    else:
        page = image.copy()

    box = detect_drawing_box(page)
    if box is None:
        box = detect_box_by_qr_anchor(page)

    if box is None:
        raise RuntimeError(
            "Não foi possível localizar automaticamente o quadrado do desenho."
        )

    drawing = crop_with_margin(page, box)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    ok = cv2.imwrite(str(output_path), drawing)
    if not ok:
        raise RuntimeError(f"Falha ao salvar o desenho em: {output_path}")


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "Uso: python3 extract_drawing_cv.py <input_image> <output_image>",
            file=sys.stderr,
        )
        return 2

    input_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()

    try:
        extract_drawing(input_path, output_path)
        return 0
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())