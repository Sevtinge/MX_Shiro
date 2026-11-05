'use client'

import { m, useMotionTemplate, useMotionValue } from 'motion/react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef } from 'react'

import styles from './about-card.module.css'
import { iconClass, iconForSection } from './icons'
import type {
  AboutCardData,
  AboutDevice,
  AboutLink,
  AboutSection,
} from './types'

const external = (href?: string) => Boolean(href && /^https?:/i.test(href))

function Glyph({ name, className }: { name: string; className?: string }) {
  return <i className={`${name} ${className || ''}`} aria-hidden />
}

function IdentityCard({
  identity,
}: {
  identity: NonNullable<AboutCardData['identity']>
}) {
  const initial = identity.name.trim().slice(0, 1) || '?'
  return (
    <article className={styles.identity}>
      <div className={styles.avatar}>
        {identity.avatar ? (
          <img src={identity.avatar} alt={`${identity.name}的头像`} />
        ) : (
          <span className={styles.fallback}>{initial}</span>
        )}
      </div>
      <div>
        {identity.handle ? (
          <p className={styles.handle}>
            <i />
            {identity.handle}
          </p>
        ) : null}
        <h3>{identity.name}</h3>
        {identity.bio ? <p className={styles.motto}>{identity.bio}</p> : null}
        {identity.facts.length > 0 ? (
          <dl className={styles.facts}>
            {identity.facts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  )
}

const trackLinkOrigin = (event: MouseEvent<HTMLAnchorElement>) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  event.currentTarget.style.setProperty('--origin-x', `${x}%`)
  event.currentTarget.style.setProperty('--origin-y', `${y}%`)
}

function LinkItem({ item }: { item: AboutLink }) {
  const body = (
    <>
      <span className={styles.copy}>
        <strong>{item.label}</strong>
        {item.detail ? <small>{item.detail}</small> : null}
      </span>
      {item.href ? (
        <span className={styles.arrow}>
          <Glyph name={iconClass('arrow')} />
        </span>
      ) : null}
    </>
  )
  if (!item.href) return <div className={styles.item}>{body}</div>
  return (
    <a
      className={styles.item}
      href={item.href}
      onMouseEnter={trackLinkOrigin}
      onMouseMove={trackLinkOrigin}
      {...(external(item.href)
        ? { target: '_blank', rel: 'noreferrer noopener' }
        : {})}
    >
      {body}
    </a>
  )
}

function DeviceItem({ item }: { item: AboutDevice }) {
  const body = (
    <>
      <span className={styles.deviceIcon}>
        <Glyph name={iconClass(item.icon, 'device')} />
      </span>
      <span className={styles.deviceCopy}>
        <strong>{item.label}</strong>
        {item.detail ? <small>{item.detail}</small> : null}
      </span>
      {item.href ? (
        <span className={styles.arrow}>
          <Glyph name={iconClass('arrow')} />
        </span>
      ) : null}
    </>
  )
  if (!item.href) return <div className={styles.device}>{body}</div>
  return (
    <a
      className={styles.device}
      href={item.href}
      onMouseEnter={trackLinkOrigin}
      onMouseMove={trackLinkOrigin}
      {...(external(item.href)
        ? { target: '_blank', rel: 'noreferrer noopener' }
        : {})}
    >
      {body}
    </a>
  )
}

function SectionCard({ section }: { section: AboutSection }) {
  const icon = iconForSection(section.title, section.icon, section.layout)
  const columnStyle = {
    '--about-columns': section.columns,
    '--about-stack-columns': section.stackColumns,
  } as CSSProperties
  return (
    <SpotlightCard
      className={styles.section}
      style={{ gridColumn: `span ${section.span}` }}
    >
      <div className={styles.heading}>
        <span className={styles.icon}>
          <Glyph name={icon} />
        </span>
        <div>
          <h3>{section.title}</h3>
          {section.subtitle ? <p>{section.subtitle}</p> : null}
        </div>
      </div>
      {section.layout === 'links' ? (
        <div className={styles.list} style={columnStyle}>
          {section.links.map((item) => (
            <LinkItem
              key={`${item.label}-${item.detail || ''}-${item.href || ''}`}
              item={item}
            />
          ))}
        </div>
      ) : null}
      {section.layout === 'devices' ? (
        <div className={styles.devices} style={columnStyle}>
          {section.devices.map((item) => (
            <DeviceItem key={`${item.icon || ''}-${item.label}`} item={item} />
          ))}
        </div>
      ) : null}
      {section.layout === 'skills' ? (
        <div className={styles.groups}>
          {section.groups.map((group) => (
            <section
              key={group.title || group.skills[0]?.name}
              className={styles.group}
            >
              {group.title ? <h4>{group.title}</h4> : null}
              <div className={styles.skills}>
                {group.skills.map((skill) => (
                  <div key={skill.name} className={styles.skill}>
                    <div>
                      <span>{skill.name}</span>
                      <span>{skill.value}%</span>
                    </div>
                    <span
                      className={styles.track}
                      role="progressbar"
                      aria-label={skill.name}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={skill.value}
                    >
                      <span style={{ width: `${skill.value}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {section.layout === 'goals' ? (
        <ul className={styles.goals}>
          {section.goals.map((goal) => (
            <li key={goal} className={styles.goal}>
              {goal}
            </li>
          ))}
        </ul>
      ) : null}
    </SpotlightCard>
  )
}

const CardSpotlightContext = createContext<{
  x: ReturnType<typeof useMotionValue<number>>
  y: ReturnType<typeof useMotionValue<number>>
  visible: ReturnType<typeof useMotionValue<number>>
} | null>(null)

function CardSpotlightGroup({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const x = useMotionValue(-1000)
  const y = useMotionValue(-1000)
  const visible = useMotionValue(0)

  return (
    <CardSpotlightContext.Provider
      value={useMemo(() => ({ x, y, visible }), [x, y, visible])}
    >
      <div
        className={className}
        onMouseMove={(event) => {
          x.set(event.clientX)
          y.set(event.clientY)
          visible.set(1)
        }}
        onMouseLeave={() => visible.set(0)}
      >
        {children}
      </div>
    </CardSpotlightContext.Provider>
  )
}

function SpotlightCard({
  className,
  style,
  children,
}: {
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const spot = useContext(CardSpotlightContext)
  const ref = useRef<HTMLElement>(null)
  const localX = useMotionValue(0)
  const localY = useMotionValue(0)
  const background = useMotionTemplate`radial-gradient(560px circle at ${localX}px ${localY}px, var(--spotlight-color) 0%, transparent 68%)`

  useEffect(() => {
    if (!spot) return
    const update = () => {
      const element = ref.current
      if (!element) return
      const rect = element.getBoundingClientRect()
      localX.set(spot.x.get() - rect.left)
      localY.set(spot.y.get() - rect.top)
    }
    const stopX = spot.x.on('change', update)
    const stopY = spot.y.on('change', update)
    return () => {
      stopX()
      stopY()
    }
  }, [localX, localY, spot])

  return (
    <article
      ref={ref}
      className={`${styles.card} ${styles.spotlight} ${className || ''}`}
      style={style}
    >
      <m.div
        aria-hidden
        className={styles.spotlightGlow}
        style={{ background, opacity: spot?.visible ?? 0 }}
      />
      <div className={styles.cardBody}>{children}</div>
    </article>
  )
}

export function AboutCard({ data }: { data: AboutCardData }) {
  return (
    <div className={`not-prose ${styles.root}`}>
      {data.identity ? (
        <div className={styles.overview}>
          <IdentityCard identity={data.identity} />
        </div>
      ) : null}
      {data.sections.length > 0 ? (
        <CardSpotlightGroup className={styles.bento}>
          {data.sections.map((section) => (
            <SectionCard key={section.title} section={section} />
          ))}
        </CardSpotlightGroup>
      ) : null}
    </div>
  )
}
