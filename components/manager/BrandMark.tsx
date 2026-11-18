import Logo from '../Logo'
import LangSwitch from './LangSwitch'

/**
 * The top of the manager's sidebar: the monogram and the content-language
 * switch. Colours are passed in because the manager's light/dark setting is
 * its own, independent of the site's, and Keystatic hands us the scheme.
 */
export default function BrandMark({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const dark = colorScheme === 'dark'

  return (
    <span className="kst-brand">
      <Logo
        id="manager-logo"
        weight="medium"
        label="Mohammed Almsitef"
        ink={dark ? '#f4f1e8' : '#16233a'}
        accent={dark ? '#f06e42' : '#e8582c'}
        className="h-6 w-auto shrink-0"
      />
      <LangSwitch />
    </span>
  )
}
