export function getOriginalPageUploadBucketPath({
  eventId,
  unitId,
  enrollmentId,
  bookId,
  pageNumber,
}: {
  unitId: string;
  eventId: string;
  enrollmentId: string;
  bookId: string;
  pageNumber: number;
}) {
  return `/units/${unitId}/events/${eventId}/enrollments/${enrollmentId}/originals/${bookId}-${pageNumber}`;
}

export function getProcessedPageUploadBucketPath({
  eventId,
  unitId,
  enrollmentId,
  bookId,
  pageNumber,
}: {
  unitId: string;
  eventId: string;
  enrollmentId: string;
  bookId: string;
  pageNumber: number;
}) {
  return `/units/${unitId}/events/${eventId}/enrollments/${enrollmentId}/processed/${bookId}-${pageNumber}`;
}

export function generateMagnificCode(): string {
  const baseString = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += baseString.charAt(Math.floor(Math.random() * baseString.length));
  }
  return result;
}
