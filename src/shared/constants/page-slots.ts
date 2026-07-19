export const PAGE_SEO_MEDIA_SLOTS = {
    home: {
        hero: "home_hero",
        gallery: "home_gallery",
        featuredStudents: "home_featured_students",
        learningEnvironment: "home_learning_environment",
        studentReviews: "home_student_reviews",
        teacherTeam: "home_teacher_team",
        footerBanner: "footer_banner",
    },
    about: {
        heroBackground: "about_hero_background",
        heroCharacter: "about_hero_character",
        heroVideo: "about_hero_video",
        overviewImage: "about_overview_image",
        purposeImage: "about_purpose_image",
        storyGallery: "about_story_gallery",
    },
    offlineCourse: {
        heroBackground: "offline_course_hero_background",
        heroPreview: "offline_course_hero_preview",
    },
    onlineCourse: {
        heroBackground: "online_course_hero_background",
        heroPreview: "online_course_hero_preview",
    },
    achievements: {
        pagePoster: "achievements_page_poster",
        gallery: "achievements_gallery",
        banner: "achievements_banner",
    },
    library: {
        libraryHero: "library_hero",
        documentsHero: "library_documents_hero",
        examsHero: "library_exams_hero",
        questionsHero: "library_questions_hero",
        gallery: "library_gallery",
        banner: "library_banner",
    },
    team: {
        pagePoster: "team_page_poster",
        gallery: "team_gallery",
        banner: "team_banner",
    },
    contact: {
        pagePoster: "contact_page_poster",
        gallery: "contact_gallery",
        banner: "contact_banner",
    },
} as const;

export type PageKey = keyof typeof PAGE_SEO_MEDIA_SLOTS;
export type PageSeoMediaSlots = typeof PAGE_SEO_MEDIA_SLOTS;
