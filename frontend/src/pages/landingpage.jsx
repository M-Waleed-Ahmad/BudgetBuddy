import React from 'react';
import { motion } from 'framer-motion';
// Import desired icons from react-icons
import { FaUsers, FaHistory, FaChartBar, FaFileExport, FaLightbulb, FaLock } from 'react-icons/fa';
// Removed FiArrowRight as it's not in the reference image buttons
// import { FiArrowRight } from 'react-icons/fi';

import Navbar1 from '../components/navbar1'; // Assuming these components exist
import Footer from '../components/Footer1';  // Assuming these components exist
import vid from '../assets/vid.mp4';      // Ensure this path is correct
import '../styles/landingpage.css';       // We will update this CSS file below

const landingpage = () => {
  return (
    <>
      <Navbar1 /> {/* Assuming Navbar1 handles its own styling */}
      <div className="landing-container">
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
              {/* Updated Button Styles */}
              <motion.button
                whileHover={{ scale: 1.05, filter: 'brightness(1.1)'}}
                whileTap={{ scale: 0.95 }}
                className="primary-btn"
              >
                Join Us {/* Removed Icon */}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                whileTap={{ scale: 0.95 }}
                className="secondary-btn"
              >
                Request Demo
              </motion.button>
            </motion.div>
          </div>

          {/* Video Section - Kept as requested */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="video-container" // Style this container
          >
             {/* Video element remains */}
             <video autoPlay loop muted playsInline className="demo-video"> {/* added playsInline */}
               <source src={vid} type="video/mp4" />
               Your browser does not support the video tag.
             </video>
          </motion.div>
        </section>

        {/* Features Section - Updated with Icons */}
        <section className="features-section">
          <h2 className="section-title">Feature Highlights</h2>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }} // Triggers when card scrolls into view
                viewport={{ once: true }} // Animation runs only once
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Icon Container */}
                <div className="feature-icon-container">
                  <feature.icon className="feature-icon" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <Footer /> {/* Assuming Footer handles its own styling */}
    </>
  );
};

// Feature data - Updated with Icon Components
const features = [
  {
    icon: FaUsers, // Icon for Collaboration
    title: "Real-time Collaboration",
    description: "Work together in real-time on a shared budget, making financial planning a breeze."
  },
   {
    icon: FaChartBar, // Icon for Insights
    title: "Detailed Insights",
    description: "Get in-depth analysis of your spending habits and identify areas for improvement."
  },
   {
    icon: FaLightbulb, // Icon for Suggestions
    title: "Smart Suggestions",
    description: "Receive personalized budgeting advice tailored to your financial circumstances."
  },
  {
    icon: FaHistory, // Icon for History
    title: "View Editing History",
    description: "Never lose track of changes. Our platform offers a complete history of all budget edits."
  },
  {
    icon: FaFileExport, // Icon for Export
    title: "Export Your Data",
    description: "Take your financial data with you. Export budgets in various formats for your convenience."
  },
  {
    icon: FaLock, // Icon for Protection
    title: "Data Protection",
    description: "Your data is encrypted and secure, ensuring that your financial information is protected."
  }
];

export default landingpage;