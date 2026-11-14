/**
 * The two languages the site is published in.
 *
 * English lives at `/` and Arabic at `/ar`. English keeps the bare path
 * because that is what is already indexed and linked — moving it to `/en`
 * would break every existing URL for the sake of symmetry.
 */
export type Locale = 'en' | 'ar'

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
    viewPullRequest: 'View the pull request',
    education: 'Education',
    publications: 'Publications',
    emailMe: 'Email me',
    findMeOn: 'Find me on',
    copy: 'copy',
    copied: 'copied',
    downloadResume: 'Download full résumé',
    switchLanguage: 'اقرأ بالعربية',
    languageName: 'العربية',
    commandMenu: 'Command menu',
    openCommandMenu: 'Open command menu',
    commandPlaceholder: 'Search sections, projects, actions…',
    commandEmpty: 'No matches',
    home: 'Home',
    groupGoTo: 'Go to',
    groupCaseStudies: 'Case studies',
    groupConnect: 'Connect',
    groupAppearance: 'Appearance',
    copyEmailAction: 'Copy email address',
    emailCopied: 'Email copied',
    themeToDark: 'Switch to dark theme',
    themeToLight: 'Switch to light theme',
    simTitle: 'rviz2 · slam_toolbox + nav2 · live',
    simHint: 'Click anywhere to send the robot a navigation goal',
    simAria:
      'Live simulation: a robot explores an unknown floor plan with a lidar, builds a map as it goes, and plans paths around obstacles. Click to send it a goal.',
    newMap: 'New map',
    mapLabel: 'map',
    modeExploring: 'Exploring · frontier',
    modeNavigating: 'Navigating to goal',
    modeReached: 'Goal reached',
    modeComplete: 'Map complete',
    modeUnreachable: 'No path to goal',
    currently: 'Currently',
    at: 'at',
    caseStudy: 'Read case study',
    featured: 'Featured',
    basedInShort: 'Based in',
    resume: 'Résumé (PDF)',
    quickFacts: 'At a glance',
    factRole: 'Role',
    factLocation: 'Location',
    factEducation: 'Education',
    factFocus: 'Focus',
    projectFacts: 'Project facts',
    factYear: 'Year',
    factStack: 'Stack',
    keyResults: 'Key results',
    links: 'Links',
    sitemap: 'Site',
    elsewhere: 'Elsewhere',
    footerLine: 'Robotics & AI engineer building autonomous robots with ROS 2.',
    allRights: 'All rights reserved.',
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
    viewPullRequest: 'اطّلع على الطلب',
    education: 'التعليم',
    publications: 'المنشورات',
    emailMe: 'راسلني',
    findMeOn: 'تجدني على',
    copy: 'نسخ',
    copied: 'تم النسخ',
    downloadResume: 'حمّل السيرة الذاتية كاملة',
    switchLanguage: 'Read in English',
    languageName: 'English',
    commandMenu: 'قائمة الأوامر',
    openCommandMenu: 'فتح قائمة الأوامر',
    commandPlaceholder: 'ابحث في الأقسام والمشاريع والإجراءات…',
    commandEmpty: 'لا نتائج',
    home: 'الرئيسية',
    groupGoTo: 'انتقل إلى',
    groupCaseStudies: 'دراسات الحالة',
    groupConnect: 'تواصل',
    groupAppearance: 'المظهر',
    copyEmailAction: 'نسخ عنوان البريد الإلكتروني',
    emailCopied: 'تم نسخ البريد',
    themeToDark: 'التبديل إلى المظهر الداكن',
    themeToLight: 'التبديل إلى المظهر الفاتح',
    simTitle: 'rviz2 · slam_toolbox + nav2 · live',
    simHint: 'انقر في أي مكان لإرسال هدف ملاحة إلى الروبوت',
    simAria:
      'محاكاة حية: روبوت يستكشف مخططاً مجهولاً باستخدام الليدار، ويبني الخريطة أثناء حركته، ويخطط مساره حول العوائق. انقر لإرسال هدف إليه.',
    newMap: 'خريطة جديدة',
    mapLabel: 'الخريطة',
    modeExploring: 'استكشاف · الحدود',
    modeNavigating: 'التوجه إلى الهدف',
    modeReached: 'تم الوصول',
    modeComplete: 'اكتملت الخريطة',
    modeUnreachable: 'لا يوجد مسار',
    currently: 'حالياً',
    at: 'في',
    caseStudy: 'اقرأ دراسة الحالة',
    featured: 'مميز',
    basedInShort: 'المقر',
    resume: 'السيرة الذاتية (PDF)',
    quickFacts: 'لمحة سريعة',
    factRole: 'الدور',
    factLocation: 'الموقع',
    factEducation: 'التعليم',
    factFocus: 'مجالات التركيز',
    projectFacts: 'معلومات المشروع',
    factYear: 'السنة',
    factStack: 'التقنيات',
    keyResults: 'أبرز النتائج',
    links: 'روابط',
    sitemap: 'الموقع',
    elsewhere: 'تجدني على',
    footerLine: 'مهندس روبوتات وذكاء اصطناعي، أبني روبوتات ذاتية الحركة باستخدام ROS 2.',
    allRights: 'جميع الحقوق محفوظة.',
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
