import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import Navbar from '../components/navbar1';
import Footer from '../components/footer1';
import '../styles/landingpage.css';  

const landingpage = () => {
  return (
    <>
    <Navbar />
    {  <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-title"
          >
            Master Your Finances
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hero-subtitle"
          >
            Track expenses, budget smartly, and share insights with ease
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hero-actions"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="primary-btn"
            >
              Join Us <FiArrowRight />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="secondary-btn"
            >
              Request Demo
            </motion.button>
          </motion.div>
        </div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="video-container"
        >
          <div className="video-placeholder">
            {/* Replace with your actual video */}
            <video autoPlay loop muted className="demo-video">
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Feature Highlights</h2>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>}
    <Footer />
    </>
  );
};

// Feature data
const features = [
  {
    title: "Real-time Collaboration",
    description: "Work together in real-time on a shared budget, making financial planning a breeze."
  },
  {
    title: "View Editing History",
    description: "Never lose track of changes. Our platform offers a complete history of all budget edits."
  },
  {
    title: "Detailed Insights",
    description: "Get in-depth analysis of your spending habits and identify areas for improvement."
  },
  {
    title: "Export Your Data",
    description: "Take your financial data with you. Export budgets in various formats for your convenience."
  },
  {
    title: "Smart Suggestions",
    description: "Receive personalized budgeting advice tailored to your financial circumstances."
  },
  {
    title: "Data Protection",
    description: "Your data is encrypted and secure, ensuring that your financial information is protected."
  }
];

export default landingpage;
