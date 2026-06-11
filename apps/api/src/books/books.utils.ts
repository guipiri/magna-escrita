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
