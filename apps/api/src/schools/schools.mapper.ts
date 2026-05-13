import { $Enums } from '@prisma/client';
import { getCurrentSchoolYear, SchoolYear } from '@repo/shared';

export class SchoolsMapper {
  static schoolYearDomainToPrisma(schoolYear?: SchoolYear): $Enums.SchoolYear {
    switch (schoolYear) {
      case SchoolYear.YEAR_2026:
        return $Enums.SchoolYear.YEAR_2026;
      case SchoolYear.YEAR_2027:
        return $Enums.SchoolYear.YEAR_2027;
      default:
        return this.schoolYearDomainToPrisma(getCurrentSchoolYear());
    }
  }

  static schoolYearStringToPrisma(schoolYear?: string): $Enums.SchoolYear {
    switch (schoolYear) {
      case '2026':
        return $Enums.SchoolYear.YEAR_2026;
      case '2027':
        return $Enums.SchoolYear.YEAR_2027;
      default:
        return this.schoolYearDomainToPrisma(getCurrentSchoolYear());
    }
  }

  static schoolYearOptionLabel(schoolYear: $Enums.SchoolYear): string {
    return schoolYear.replace('YEAR_', '');
  }
}
