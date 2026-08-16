/**
 * The two languages the site is published in.
 *
 * English lives at `/` and Arabic at `/ar`. English keeps the bare path
 * because that is what is already indexed and linked — moving it to `/en`
 * would break every existing URL for the sake of symmetry.
 */
export type Locale = 'en' | 'ar'

export const LOCALES: Locale[] = ['en', 'ar']

/** Where a locale's copy of a page lives. */
export function localePath(locale: Locale, path = '') {
  return locale === 'ar' ? `/ar${path}` : path || '/'
}

/**
 * Interface text that isn't part of the editable content.
 *
 * Section headings, project titles and prose all come from the manager. What's
 * here is the chrome around them — labels a visitor reads but the owner never
 * edits, which would only be noise in the CMS.
 */
const STRINGS = {
  en: {
    skipToContent: 'Skip to content',
    allProjects: 'All projects',
    source: 'Source',
    video: 'Video',
    liveDemo: 'Live demo',
    next: 'Next',
    technologiesUsed: 'Technologies used',
    backToTop: 'Back to top',
    theProblem: 'The problem',
    whatIBuilt: 'What I built',
    howItWorks: 'How it works',
    howItWasTested: 'How it was tested',
    results: 'Results',
    whatILearned: 'What I learned',
    myRole: 'My role',
    projectNavigation: 'Project navigation',
    viewMyWork: 'View my work',
    getInTouch: 'Get in touch',
    availableForWork: 'Available for work',
    basedIn: 'Based in',
    responseTime: 'Response time',
    downloadResume: 'Download full résumé',
    switchLanguage: 'اقرأ بالعربية',
    languageName: 'العربية',
  },
  ar: {
    skipToContent: 'تخطَّ إلى المحتوى',
    allProjects: 'كل المشاريع',
    source: 'الشيفرة',
    video: 'فيديو',
    liveDemo: 'تجربة مباشرة',
    next: 'التالي',
    technologiesUsed: 'التقنيات المستخدمة',
    backToTop: 'العودة إلى الأعلى',
    theProblem: 'المشكلة',
    whatIBuilt: 'ما الذي بنيته',
    howItWorks: 'كيف يعمل',
    howItWasTested: 'كيف تم اختباره',
    results: 'النتائج',
    whatILearned: 'ما تعلمته',
    myRole: 'دوري',
    projectNavigation: 'التنقل بين المشاريع',
    viewMyWork: 'شاهد أعمالي',
    getInTouch: 'تواصل معي',
    availableForWork: 'متاح للعمل',
    basedIn: 'المقر',
    responseTime: 'زمن الرد',
    downloadResume: 'حمّل السيرة الذاتية كاملة',
    switchLanguage: 'Read in English',
    languageName: 'English',
  },
} as const

export type UIKey = keyof (typeof STRINGS)['en']

export function t(locale: Locale, key: UIKey): string {
  return STRINGS[locale][key]
}

/** `rtl` only for Arabic; everything else reads left to right. */
export function dir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
