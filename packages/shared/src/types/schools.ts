export interface GetSchoolsResponse {
  id: string;
  name: string;
  units: Array<{
    id: string;
    name: string | null;
  }>;
}

export interface CreateGradeRequest {
  name: string;
  unitId?: string;
  students: string[];
}

export interface CreateGradeResponse {
  id: string;
  name: string;
  schoolId: string;
  unitId: string;
  students: Array<{
    id: string;
    name: string;
  }>;
}

export enum SchoolYear {
  YEAR_2026 = 'YEAR_2026',
  YEAR_2027 = 'YEAR_2027',
}

export function getCurrentSchoolYear(): SchoolYear {
  const currentYear = new Date().getFullYear();

  if (currentYear === 2026) return SchoolYear.YEAR_2026;
  if (currentYear === 2027) return SchoolYear.YEAR_2027;

  throw new Error('Current year is out of range for defined school years');
}
