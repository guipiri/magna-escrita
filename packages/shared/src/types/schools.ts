export interface GetSchoolsResponse {
  id: string;
  name: string;
  units: Array<{
    id: string;
    name: string | null;
  }>;
}

export interface UpdateClassRequest {
  name: string;
  teacherName: string;
  bookTemplateId?: string;
  students?: UpdateClassStudentItem[];
}

export interface CreateClassRequest {
  name: string;
  teacherName: string;
  unitId?: string;
  bookTemplateId: string;
  students: string[];
}

export interface SchoolYearOption {
  value: SchoolYear;
  label: string;
}

export interface CreateClassResponse {
  id: string;
  name: string;
  schoolId: string;
  unitId: string;
  students: Array<{
    id: string;
    name: string;
  }>;
}

export interface GetClassesResponse {
  id: string;
  name: string;
  teacherName: string;
  bookTemplate: {
    id: string;
    name: string;
  };
  schoolYear: SchoolYear;
  school: {
    id: string;
    name: string;
  };
  unit: {
    id: string;
    name: string | null;
  };
  studentsCount: number;
  bookCount: {
    total: number;
    draft: number;
    revisedBySchool: number;
    ready: number;
    archived: number;
    completed: number; // READY for ADMIN, FOR_REVIEW for SCHOOL
  };
  createdAt: string;
}

export interface ClassStudentResponse {
  id: string;
  name: string;
  studentId: string;
  hasBook?: boolean;
}

export interface UpdateClassStudentItem {
  id?: string;
  name: string;
}

export interface UpdateClassStudentsRequest {
  students: UpdateClassStudentItem[];
}

export enum SchoolYear {
  YEAR_2026 = 'YEAR_2026',
  YEAR_2027 = 'YEAR_2027',
}

export interface GetSchoolsListResponse {
  id: string;
  name: string;
  classCount: number;
  studentCount: number;
  bookCount: number;
  status: 'active' | 'in-progress' | 'completed';
  lastActivity: string;
}

export interface CreateSchoolRequest {
  name: string;
  unitNames: string[];
}

export function getCurrentSchoolYear(): SchoolYear {
  const currentYear = new Date().getFullYear();

  if (currentYear === 2026) return SchoolYear.YEAR_2026;
  if (currentYear === 2027) return SchoolYear.YEAR_2027;

  throw new Error('Current year is out of range for defined school years');
}
