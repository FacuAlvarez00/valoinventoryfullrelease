import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TacticalButton } from './kit';
import styles from './LandingPage.module.css';

const HERO_HUES = [355, 200, 35, 280, 160, 10];

const FILTERS = ['ALL', 'RIFLE', 'SNIPER', 'SIDEARM', 'SMG', 'MELEE'];

const INVENTORY_ITEMS = [
  { id: 1, name: 'Nova Pulse', type: 'RIFLE', rarity: 'EXOTIC', status: 'featured', hue: 355 },
  { id: 2, name: 'Static Fang', type: 'SIDEARM', rarity: 'RARE', status: 'owned', hue: 200 },
  { id: 3, name: 'Crimson Vector', type: 'RIFLE', rarity: 'EXOTIC', status: 'owned', hue: 12 },
  { id: 4, name: 'Glacier Bloom', type: 'SNIPER', rarity: 'RARE', status: 'owned', hue: 190 },
  { id: 5, name: 'Voidline', type: 'MELEE', rarity: 'EXOTIC', status: 'featured', hue: 280 },
  { id: 6, name: 'Iron Ember', type: 'SMG', rarity: 'STANDARD', status: 'locked', hue: 32 },
  { id: 7, name: 'Neon Wraith', type: 'SIDEARM', rarity: 'EXOTIC', status: 'owned', hue: 320 },
  { id: 8, name: 'Titan Frame', type: 'SNIPER', rarity: 'STANDARD', status: 'locked', hue: 160 },
];

const COLLECTIONS = [
  { name: 'GHOSTLINE', locked: false },
  { name: 'VANTAGE', locked: false },
  { name: 'RECON-9', locked: true },
  { name: 'ONYX', locked: false },
  { name: 'TREMOR', locked: true },
  { name: 'BLACKOUT', locked: true },
];

const STREAKS = [
  { left: '6%', duration: '7s', delay: '0s' },
  { left: '18%', duration: '9s', delay: '2s' },
  { left: '34%', duration: '6.5s', delay: '4s' },
  { left: '48%', duration: '8s', delay: '1s' },
  { left: '62%', duration: '7.5s', delay: '3s' },
  { left: '76%', duration: '9.5s', delay: '5s' },
  { left: '88%', duration: '6s', delay: '2.5s' },
  { left: '96%', duration: '8.5s', delay: '0.5s' },
];

const fadeUp = (reduced) => ({
  hidden: { opacity: 0, y: reduced ? 0 : 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: reduced ? 0.01 : 0.5, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : i * 0.06 },
  }),
});

function MiniCard({ hue, idx }) {
  return (
    <div className={styles.miniCard}>
      <div
        className={styles.miniCardArt}
        style={{ background: `linear-gradient(135deg, hsla(${hue},70%,55%,0.4) 0%, hsla(${hue},70%,28%,0.15) 100%)` }}
      />
      <div className={styles.miniCardBar} style={{ width: `${55 + (idx % 3) * 14}%` }} />
    </div>
  );
}

function InventoryCard({ item, index, reduced }) {
  const stateClass = item.status === 'owned' ? styles.cardOwned : item.status === 'featured' ? styles.cardFeatured : '';
  const badgeClass = item.status === 'owned' ? styles.badgeOwned : item.status === 'featured' ? styles.badgeFeatured : styles.badgeLocked;
  const badgeText = item.status === 'owned' ? 'Owned' : item.status === 'featured' ? 'Featured' : 'Locked';

  return (
    <motion.div
      className={`${styles.card} ${stateClass}`}
      custom={index}
      variants={fadeUp(reduced)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div
        className={styles.cardArt}
        style={{ background: `linear-gradient(135deg, hsla(${item.hue},70%,52%,0.45) 0%, hsla(${item.hue},70%,22%,0.18) 100%)` }}
      >
        <span className={styles.cardSheen} aria-hidden="true" />
      </div>
      <span className={`${styles.badge} ${badgeClass}`}>{badgeText}</span>
      <div className={styles.cardName}>{item.name}</div>
      <div className={styles.cardMeta}>{item.type} · {item.rarity}</div>
    </motion.div>
  );
}

function IconPlayers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="1" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="1" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="23" y2="12" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCollectors() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 2 L22 8 L12 14 L2 8 Z" />
      <path d="M2 13 L12 19 L22 13" />
      <path d="M2 17.5 L12 23 L22 17.5" opacity="0.55" />
    </svg>
  );
}

function IconManagers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="12" width="4" height="9" />
      <rect x="10" y="7" width="4" height="14" />
      <rect x="17" y="3" width="4" height="18" />
    </svg>
  );
}

const AUDIENCE = [
  {
    key: 'players',
    icon: IconPlayers,
    title: 'Players',
    desc: 'Track your loadout, flex your best skins, and always know exactly what you own.',
  },
  {
    key: 'collectors',
    icon: IconCollectors,
    title: 'Collectors',
    desc: 'Organize rare pulls and full sets into one browsable, presentable showcase.',
  },
  {
    key: 'managers',
    icon: IconManagers,
    title: 'Sellers & Managers',
    desc: 'Present large, high-volume catalogs clearly — built for scale, not spreadsheets.',
  },
];

export default function LandingPage({ onLogin, onRegister }) {
  const reduced = useReducedMotion();
  const inventoryRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const scrollToPreview = () => {
    inventoryRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const filteredItems = activeFilter === 'ALL'
    ? INVENTORY_ITEMS
    : INVENTORY_ITEMS.filter((item) => item.type === activeFilter);

  return (
    <div className={styles.landing}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.backdropBase} />
        <div className={styles.backdropGlow} />
        <div className={styles.backdropGrid} />
        <div className={styles.backdropScan} />
        {!reduced && STREAKS.map((s, i) => (
          <span
            key={i}
            className={styles.streak}
            style={{ left: s.left, animationDuration: s.duration, animationDelay: s.delay }}
          />
        ))}
        <div className={styles.backdropNoise} />
        <div className={styles.backdropVignette} />
      </div>

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brand}>VALO<span className={styles.brandAccent}>INVENTORY</span></div>
          <div className={styles.navActions}>
            <button type="button" className={styles.navLogin} onClick={onLogin}>Log In</button>
            <TacticalButton size="sm" onClick={onRegister}>Open App</TacticalButton>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.eyebrow}>Inventory OS for Valorant</div>
            <h1 className={`${styles.heading} ${styles.heroHeadline}`}>
              Your collection.<br />
              <span className={styles.heroHeadlineAccent}>Finally cataloged.</span>
            </h1>
            <p className={styles.heroSub}>
              ValoInventory turns your skins, agents, and gear into one clean, shareable
              showcase — built for players who take their loadout seriously.
            </p>
            <div className={styles.heroCtas}>
              <TacticalButton size="lg" onClick={onRegister}>Open App</TacticalButton>
              <TacticalButton size="lg" variant="ghost" onClick={scrollToPreview}>View Demo</TacticalButton>
            </div>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaDot}>●</span>
              Synced in seconds&nbsp;&nbsp;·&nbsp;&nbsp;No screenshots&nbsp;&nbsp;·&nbsp;&nbsp;Shareable links
            </div>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, x: reduced ? 0 : 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.8, delay: reduced ? 0 : 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.heroPanel}>
              <div className={styles.heroPanelHeader}>
                <div className={styles.heroPanelTitle}>
                  <span className={styles.livedot} aria-hidden="true" />
                  Live Inventory
                </div>
                <div className={styles.heroPanelCount}>1,204 Items</div>
              </div>
              <div className={styles.heroGrid}>
                {HERO_HUES.map((hue, idx) => (
                  <MiniCard key={idx} hue={hue} idx={idx} />
                ))}
              </div>
            </div>
            <div className={styles.heroFloatingBadge}>
              <div className={styles.heroFloatingBadgeValue}>128</div>
              <div className={styles.heroFloatingBadgeLabel}>Skins Tracked</div>
            </div>
          </motion.div>
        </div>

        <div className={styles.scrollCue} aria-hidden="true">
          <span className={styles.scrollCueLine} />
          <span className={styles.scrollCueText}>Scroll</span>
        </div>
      </section>

      {/* PROBLEM */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.problemInner}>
            <motion.div
              variants={fadeUp(reduced)}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className={`${styles.eyebrow} ${styles.eyebrowMuted}`}>The Problem</div>
              <h2 className={`${styles.heading} ${styles.heading2}`}>
                Screenshots aren't<br />an inventory.
              </h2>
              <p className={styles.problemCopy}>
                Scattered clips, blurry screenshots, and manual spreadsheets don't do your
                loadout justice — and they're a nightmare to share. ValoInventory replaces
                the chaos with one clean, structured view.
              </p>
              <ul className={styles.problemList}>
                <li><span className={styles.problemListMark}>✕</span> No more screenshot folders</li>
                <li><span className={styles.problemListMark}>✕</span> No more outdated Discord threads</li>
                <li><span className={styles.problemListMark}>✕</span> No more manual spreadsheets</li>
              </ul>
            </motion.div>

            <motion.div
              className={styles.problemVisual}
              variants={fadeUp(reduced)}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className={styles.chaosCard} style={{ top: 0, left: 0, transform: 'rotate(-4deg)' }}>
                <div className={styles.chaosCardLabel}>IMG_2291.PNG</div>
                <div className={styles.chaosCardBody} />
              </div>
              <div className={styles.chaosCard} style={{ top: 46, left: 60, transform: 'rotate(3deg)', opacity: 0.85 }}>
                <div className={styles.chaosCardLabel}>Discord — #trades</div>
                <div className={styles.chaosCardBody} />
              </div>
              <div className={styles.cleanCard}>
                <div className={styles.cleanCardHeader}>
                  <span className={styles.cleanCardLabel}>ValoInventory</span>
                  <span className={styles.livedot} aria-hidden="true" />
                </div>
                <div className={styles.cleanCardGrid}>
                  {[190, 355, 160].map((hue, idx) => (
                    <MiniCard key={idx} hue={hue} idx={idx} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* INVENTORY PREVIEW */}
      <section
        id="inventory-preview"
        ref={inventoryRef}
        className={`${styles.section} ${styles.inventorySection}`}
      >
        <div className={styles.sectionInner}>
          <div className={styles.inventoryHeader}>
            <motion.div
              variants={fadeUp(reduced)}
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className={styles.eyebrow}>The Armory</div>
              <h2 className={`${styles.heading} ${styles.heading2}`} style={{ marginBottom: 0 }}>
                Built like your<br />in-game loadout.
              </h2>
            </motion.div>

            <div className={styles.filterTabs}>
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`${styles.filterTab} ${activeFilter === filter ? styles.filterTabActive : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            {filteredItems.map((item, idx) => (
              <InventoryCard key={item.id} item={item} index={idx} reduced={reduced} />
            ))}
          </div>

          <div className={styles.collections}>
            <span className={styles.collectionsLabel}>Collections</span>
            {COLLECTIONS.map((c) => (
              <div key={c.name} className={`${styles.hex} ${c.locked ? styles.hexLocked : styles.hexUnlocked}`}>
                <span className={styles.hexLabel}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* AUDIENCE */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.audienceHeader}
            variants={fadeUp(reduced)}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <div className={`${styles.eyebrow} ${styles.eyebrowMuted}`}>Who It's For</div>
            <h2 className={`${styles.heading} ${styles.heading2}`}>Built for the whole roster.</h2>
            <p className={styles.audienceSub}>
              Whether you're grinding ranked, curating a collection, or managing a full
              catalog — ValoInventory keeps it organized.
            </p>
          </motion.div>

          <div className={styles.audienceGrid}>
            {AUDIENCE.map((a, idx) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.key}
                  className={styles.audienceCard}
                  variants={fadeUp(reduced)}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                >
                  <div className={styles.audienceIcon}><Icon /></div>
                  <h3 className={styles.audienceTitle}>{a.title}</h3>
                  <p className={styles.audienceDesc}>{a.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaGlow} aria-hidden="true" />
        <motion.div
          variants={fadeUp(reduced)}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className={`${styles.eyebrow} ${styles.finalCtaEyebrow}`}>Ready When You Are</div>
          <h2 className={`${styles.heading} ${styles.finalCtaHeading}`}>
            Stop describing your inventory.<br />Start showing it.
          </h2>
          <p className={styles.finalCtaSub}>
            Open the app and see your full Valorant collection, organized and ready
            to share in seconds.
          </p>
          <div className={styles.finalCtaActions}>
            <TacticalButton size="lg" onClick={onRegister}>Open App</TacticalButton>
            <TacticalButton size="lg" variant="ghost" onClick={scrollToPreview}>View Demo</TacticalButton>
          </div>
          <div className={styles.finalFootnote}>Free to explore · No spreadsheets required</div>
        </motion.div>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>VALOINVENTORY</span>
        <span>Fan-made project — not affiliated with Riot Games.</span>
      </footer>
    </div>
  );
}
