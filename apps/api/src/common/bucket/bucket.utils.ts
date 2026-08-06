export function getOriginalPageUploadBucketPath({
  eventId,
  unitId,
  studentId,
  bookId,
  pageNumber,
  ext,
}: {
  unitId: string;
  eventId: string;
  studentId: string;
  bookId: string;
  pageNumber: number;
  ext: string;
}) {
  return `units/${unitId}/events/${eventId}/students/${studentId}/originals/${bookId}-${pageNumber}.${ext}`;
}

export function getProcessedPageUploadBucketPath({
  eventId,
  unitId,
  studentId,
  bookId,
  pageNumber,
  ext,
}: {
  unitId: string;
  eventId: string;
  studentId: string;
  bookId: string;
  pageNumber: number;
  ext: string;
}) {
  return `units/${unitId}/events/${eventId}/students/${studentId}/processed/${bookId}-${pageNumber}.${ext}`;
}

export function generateMagnificCode(): string {
  const baseString = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += baseString.charAt(Math.floor(Math.random() * baseString.length));
  }
  return result;
}

export function getUnitLogoBucketKey(unitId: string, ext: string) {
  return `units/${unitId}/logo.${ext}`;
}

export function getBookCoverBucketKey({
  eventId,
  unitId,
  studentId,
  bookId,
}: {
  unitId: string;
  eventId: string;
  studentId: string;
  bookId: string;
}) {
  return `units/${unitId}/events/${eventId}/students/${studentId}/books/${bookId}/cover.pdf`;
}

export function getBookInteriorBucketKey({
  eventId,
  unitId,
  studentId,
  bookId,
}: {
  unitId: string;
  eventId: string;
  studentId: string;
  bookId: string;
}) {
  return `units/${unitId}/events/${eventId}/students/${studentId}/books/${bookId}/interior.pdf`;
}

export function getKeyFromUrl(url: string): string {
  const urlSplitted = url.split('/');
  return urlSplitted.slice(3).join('/');
}

export function getBookTemplateThemeCoverBucketKey(themeId: string): string {
  return `cover-templates/${themeId}.pdf`;
}

export function getBookPageImageBucketKey({
  eventId,
  unitId,
  studentId,
  bookId,
  pageNumber,
  ext = 'jpg',
}: {
  unitId: string;
  eventId: string;
  studentId: string;
  bookId: string;
  pageNumber: number;
  ext?: string;
}): string {
  return `units/${unitId}/events/${eventId}/students/${studentId}/books/${bookId}/pages/${pageNumber}.${ext}`;
}

