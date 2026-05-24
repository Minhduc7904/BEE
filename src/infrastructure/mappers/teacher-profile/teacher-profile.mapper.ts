import { TeacherProfileEntity } from 'src/domain/entities'
import { Visibility } from 'src/shared/enums'

export class TeacherProfileMapper {
  static toDomain(prismaTeacherProfile: any): TeacherProfileEntity {
    return new TeacherProfileEntity({
      teacherProfileId: prismaTeacherProfile.teacherProfileId,
      displayName: prismaTeacherProfile.displayName,
      slug: prismaTeacherProfile.slug,
      headline: prismaTeacherProfile.headline ?? null,
      shortDescription: prismaTeacherProfile.shortDescription ?? null,
      bio: prismaTeacherProfile.bio ?? null,
      expertise: prismaTeacherProfile.expertise ?? null,
      teachingSubjects: prismaTeacherProfile.teachingSubjects ?? null,
      gradeLevels: prismaTeacherProfile.gradeLevels ?? null,
      teachingFormats: prismaTeacherProfile.teachingFormats ?? null,
      teachingMethods: prismaTeacherProfile.teachingMethods ?? null,
      yearsExperience: prismaTeacherProfile.yearsExperience ?? null,
      education: prismaTeacherProfile.education ?? null,
      certifications: prismaTeacherProfile.certifications ?? null,
      achievements: prismaTeacherProfile.achievements ?? null,
      teachingArea: prismaTeacherProfile.teachingArea ?? null,
      workplace: prismaTeacherProfile.workplace ?? null,
      contactEmail: prismaTeacherProfile.contactEmail ?? null,
      contactPhone: prismaTeacherProfile.contactPhone ?? null,
      contactZalo: prismaTeacherProfile.contactZalo ?? null,
      contactFacebook: prismaTeacherProfile.contactFacebook ?? null,
      contactWebsite: prismaTeacherProfile.contactWebsite ?? null,
      contactAddress: prismaTeacherProfile.contactAddress ?? null,
      bookingUrl: prismaTeacherProfile.bookingUrl ?? null,
      ctaLabel: prismaTeacherProfile.ctaLabel ?? null,
      ctaUrl: prismaTeacherProfile.ctaUrl ?? null,
      targetKeyword: prismaTeacherProfile.targetKeyword ?? null,
      keywordText: prismaTeacherProfile.keywordText ?? null,
      metaTitle: prismaTeacherProfile.metaTitle ?? null,
      metaDescription: prismaTeacherProfile.metaDescription ?? null,
      ogTitle: prismaTeacherProfile.ogTitle ?? null,
      ogDescription: prismaTeacherProfile.ogDescription ?? null,
      searchIntent: prismaTeacherProfile.searchIntent ?? null,
      seoScore: prismaTeacherProfile.seoScore ?? null,
      visibility: prismaTeacherProfile.visibility as Visibility,
      isFeatured: prismaTeacherProfile.isFeatured ?? false,
      viewCount: prismaTeacherProfile.viewCount ?? 0,
      sortOrder: prismaTeacherProfile.sortOrder ?? 0,
      createdBy: prismaTeacherProfile.createdBy ?? null,
      updatedBy: prismaTeacherProfile.updatedBy ?? null,
      createdAt: prismaTeacherProfile.createdAt,
      updatedAt: prismaTeacherProfile.updatedAt,
    })
  }

  static toDomainList(prismaTeacherProfiles: any[]): TeacherProfileEntity[] {
    return prismaTeacherProfiles.map((teacherProfile) => this.toDomain(teacherProfile))
  }
}
