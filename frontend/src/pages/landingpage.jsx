import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUsers,
  FaHistory,
  FaChartBar,
  FaFileExport,
  FaLightbulb,
  FaLock,
} from 'react-icons/fa';

import Navbar1 from '../components/navbar1';
import Footer from '../components/Footer1';
import vid from '../assets/vid.mp4';
import '../styles/landingpage.css';

const features = [
  {
    icon: FaUsers,
    title: 'Real-time Collaboration',
    description:
      'Share budgets with family and teammates so everyone stays aligned on spending.',
  },
  {
    icon: FaChartBar,
    title: 'Detailed Insights',
    description:
      'Visualize where your money goes each month with clear charts and summaries.',
  },
  {
    icon: FaLightbulb,
    title: 'Smart Suggestions',
    description:
      'Get simple, actionable tips based on your spending patterns and budgets.',
  },
  {
    icon: FaHistory,
    title: 'Edit History',
    description:
      'See how your budget evolved over time and who changed what.',
  },
  {
    icon: FaFileExport,
    title: 'Exportable Reports',
    description:
      'Download PDFs and CSVs for your records, tax filing, or sharing with others.',
  },
  {
    icon: FaLock,
    title: 'Secure by Design',
    description:
      'Your financial data is encrypted and protected with role-based access.',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  const handleJoin = () => {
    // Change '/signup' to your real signup route if needed
    navigate('/signup');
  };

  const handleRequestDemo = () => {
    // Change email to your own if needed
    window.location.href = 'mailto:msa@budgetbuddy.com?subject=BudgetBuddy Demo Request';
  };

  return (
    <>
      <Navbar1 />
      <main className="landing-root">
        {/* HERO */}
        <section className="hero">
          <div className="hero-inner">
            {/* Text side */}
            <motion.div
              className="hero-text"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="hero-kicker">BudgetBuddy · Expense Management</p>

              <h1 className="hero-title">
                Take control of your money,
                <span className="hero-title-highlight"> without the spreadsheets.</span>
              </h1>

              <p className="hero-subtitle">
                Track expenses, set smarter budgets, and collaborate with your family on a
                shared financial plan. All in one simple dashboard.
              </p>

              <div className="hero-actions">
                <motion.button
                  whileHover={{ scale: 1.04, filter: 'brightness(1.15)' }}
                  whileTap={{ scale: 0.97 }}
                  className="hero-btn hero-btn-primary"
                  onClick={handleJoin}
                >
                  Join us
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04, filter: 'brightness(1.05)' }}
                  whileTap={{ scale: 0.97 }}
                  className="hero-btn hero-btn-secondary"
                  onClick={handleRequestDemo}
                >
                  Request demo
                </motion.button>
              </div>

              <div className="hero-meta">
                <span>AI recommendations</span>
                <span>Family budgeting</span>
                <span>PDF exports</span>
              </div>
            </motion.div>

            {/* Video side – ALFA-style card with overlay */}
            <motion.div
              className="hero-video-shell"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="hero-video-frame">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="hero-video"
                >
                  <source src={vid} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="hero-video-overlay" />
                <div className="hero-video-label">
                  <p>Live product walkthrough</p>
                  <span>See how BudgetBuddy handles real expenses and budgets.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features">
          <div className="features-header">
            <h2>Built for clear, shared finances</h2>
            <p>
              From solo tracking to family budgeting and AI-powered suggestions, BudgetBuddy
              becomes your default place to understand money.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                className="feature-card"
                whileHover={{ y: -6 }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="feature-icon-wrap">
                  <feature.icon className="feature-icon" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-text">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
