import Image from 'next/image'

/** The About portrait: a plain framed photograph. */
export default function AboutPhoto({
  src,
  alt,
  onPhones = true,
}: {
  src: string
  alt: string
  /** Set in the manager. False keeps the portrait off screens under 640px. */
  onPhones?: boolean
}) {
  return (
    <figure className={`w-52 shrink-0 sm:w-60 lg:w-64 ${onPhones ? '' : 'hidden sm:block'}`}>
      <div className="glass relative aspect-[4/5] overflow-hidden rounded-2xl">
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 208px, 256px" className="object-cover object-top" />
      </div>
    </figure>
  )
}
