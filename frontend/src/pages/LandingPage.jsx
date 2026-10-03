import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaChartBar, FaFileExport, FaHistory, FaLightbulb, FaLock, FaUsers } from 'react-icons/fa';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import demoVideo from '../assets/vid.mp4';
import videoPoster from '../assets/video-poster.webp';
import '../styles/LandingPage.css';

const FEATURES = [
  {
    icon: FaUsers,
    title: 'Shared family budgets',
    description: 'Invite family members to a shared plan with admin, editor and viewer roles.',
  },
  {
    icon: FaChartBar,
    title: 'Detailed insights',
    description: 'See spending trends by category and month to spot where your money goes.',
  },
  {
    icon: FaLightbulb,
    title: 'Budget alerts',
    description: 'Get notified when a category approaches or exceeds the limit you set.',
  },
  {
    icon: FaHistory,
    title: 'Approval workflow',
    description: 'Optionally require an admin to approve expenses added to a family plan.',
  },
  {
    icon: FaFileExport,
    title: 'Export your data',
    description: 'Download your budgets and expenses as CSV whenever you need them.',
  },
  {
    icon: FaLock,
    title: 'Private by default',
    description: 'Your personal data is only visible to you and the plans you choose to join.',
  },
];

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const onChange = () => setPrefersReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}

const LandingPage = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReducedMotion) {
      video.pause();
    } else {
      video.play().catch(() => {
        /* autoplay can be blocked by the browser; the poster stays visible */
      });
    }
  }, [prefersReducedMotion]);

  const fadeUp = prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="landing-page">
      <PublicNavbar />
      <main className="landing-page__content">
        <section className="landing-hero">
          <div className="landing-hero__content">
            <motion.h1 className="landing-hero__title" {...fadeUp} transition={{ duration: 0.5 }}>
              Master your finances
            </motion.h1>
            <motion.p className="landing-hero__subtitle" {...fadeUp} transition={{ duration: 0.5, delay: 0.15 }}>
              Track expenses, budget smartly, and share insights with the people you plan with.
            </motion.p>
            <motion.div className="landing-hero__actions" {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }}>
              <Link to="/signup" className="landing-btn landing-btn--primary">
                Join us
              </Link>
              <Link to="/contact-us" className="landing-btn landing-btn--secondary">
                Request a demo
              </Link>
            </motion.div>
          </div>

          <div className="landing-hero__video">
            <video
              ref={videoRef}
              className="landing-hero__video-el"
              poster={videoPoster}
              preload="metadata"
              muted
              loop
              playsInline
              autoPlay={!prefersReducedMotion}
              controls={prefersReducedMotion}
              aria-label="Product demo of the BudgetBuddy dashboard"
            >
              <source src={demoVideo} type="video/mp4" />
            </video>
          </div>
        </section>

        <section className="landing-features" aria-labelledby="landing-features-title">
          <h2 id="landing-features-title" className="landing-features__title">
            Feature highlights
          </h2>
          <div className="landing-features__grid">
            {FEATURES.map((feature, index) => (
              <motion.article
                key={feature.title}
                className="landing-feature"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="landing-feature__icon" aria-hidden="true">
                  <feature.icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default LandingPage;
