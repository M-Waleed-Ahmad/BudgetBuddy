import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MdPerson, MdEmail, MdMessage, MdLocationOn, MdPhone, MdOutlineAccessTime } from 'react-icons/md';
// Correct the import path if your CSS file is named ContactUs.css
import '../styles/ContactUs.css';
import Navbar from '../components/navbar1'; // Assuming these exist
import Footer from '../components/Footer1'; // Assuming these exist

// --- Configuration (remains the same) ---
const YOUR_COMPANY_ADDRESS_LINE1 = "123 Main Street";
const YOUR_COMPANY_ADDRESS_LINE2 = "New York, NY 10001";
const YOUR_COMPANY_PHONE = "+1 (555) 123-4567";
const YOUR_COMPANY_EMAIL = "info@yourcompany.com";
const YOUR_COMPANY_HOURS = "Mon - Fri: 9:00 AM - 5:00 PM";
const teamMembers = [ /* ... team member data ... */ ];
// --- End Configuration ---

// --- Animation Variants (remain the same) ---
const sectionVariants = { /* ... */ };
const itemVariants = { /* ... */ };
const formItemVariants = { /* ... */ };
const feedbackVariants = { /* ... */ };


const ContactUs = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleInputChange = (e) => { /* ... */ };
  const handleSubmit = (e) => { /* ... */ };

  return (
    <>
      <Navbar/>
      {/* Apply the class to the main wrapper */}
      <div className="ContactUsPage ContactUsDarkFormTheme"> {/* ADD THEME CLASS */}
        <div className="contact-us-container">

          {/* --- Main Contact Section --- */}
          <motion.section
            className="connect-section"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={sectionVariants}
          >
            {/* --- Left Side: Form & Contact Details --- */}
            <motion.div
                className="form-and-details-container"
                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.1 }}
            >
              <h2>Get in Touch</h2>
              <p className="subtitle">
                Have questions or want to discuss a project? Fill out the form below or use our contact details.
              </p>

              {/* --- Direct Contact Details --- */}
              <motion.div className="contact-details" variants={itemVariants}>
                {/* Contact items remain structurally the same */}
                {YOUR_COMPANY_ADDRESS_LINE1 && ( <div className="contact-item"> <MdLocationOn size={24} className="contact-icon" /> <span>{YOUR_COMPANY_ADDRESS_LINE1}<br/>{YOUR_COMPANY_ADDRESS_LINE2}</span> </div> )}
                {YOUR_COMPANY_PHONE && ( <div className="contact-item"> <MdPhone size={20} className="contact-icon" /> <a href={`tel:${YOUR_COMPANY_PHONE}`}>{YOUR_COMPANY_PHONE}</a> </div> )}
                {YOUR_COMPANY_EMAIL && ( <div className="contact-item"> <MdEmail size={20} className="contact-icon" /> <a href={`mailto:${YOUR_COMPANY_EMAIL}`}>{YOUR_COMPANY_EMAIL}</a> </div> )}
                {YOUR_COMPANY_HOURS && ( <div className="contact-item"> <MdOutlineAccessTime size={20} className="contact-icon" /> <span>{YOUR_COMPANY_HOURS}</span> </div> )}
              </motion.div>

              {/* --- Contact Form (STRUCTURE UPDATED) --- */}
              <form onSubmit={handleSubmit} className="contact-form">

                {/* Name Field */}
                <motion.div className="form-field-row" variants={formItemVariants}>
                  <MdPerson className="form-field-icon" size={24} aria-hidden="true" />
                  <div className="input-wrapper">
                    <input type="text" placeholder="Your Name" name="name" required className="form-input" aria-label="Your Name" value={formData.name} onChange={handleInputChange} />
                  </div>
                </motion.div>

                {/* Email Field */}
                <motion.div className="form-field-row" variants={formItemVariants}>
                   <MdEmail className="form-field-icon" size={24} aria-hidden="true" />
                   <div className="input-wrapper">
                     <input type="email" placeholder="Your Email Address" name="email" required className="form-input" aria-label="Your Email Address" value={formData.email} onChange={handleInputChange} />
                   </div>
                </motion.div>

                 {/* Message Field */}
                 <motion.div className="form-field-row textarea-row" variants={formItemVariants}>
                   {/* Note: Using MdMessage icon from previous version, adjust if needed */}
                   <MdMessage className="form-field-icon" size={24} aria-hidden="true" />
                   <div className="input-wrapper textarea-wrapper">
                     <textarea placeholder="Your Message" name="message" rows="5" required className="form-textarea" aria-label="Your Message" value={formData.message} onChange={handleInputChange}></textarea>
                   </div>
                 </motion.div>

                {/* Submit Button */}
                <motion.div className="button-row" variants={formItemVariants}>
                    {/* Empty div for alignment if needed, or adjust styling */}
                    <div className="form-field-icon-placeholder"></div>
                    <motion.button type="submit" className="submit-button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                      Send Message
                    </motion.button>
                </motion.div>

                {/* Success Message */}
                {isSubmitted && (
                    <motion.div className="form-field-row" /* Use row for alignment */ >
                        <div className="form-field-icon-placeholder"></div> {/* Align with inputs */}
                        <motion.div className="success-message" initial="hidden" animate="visible" exit="hidden" variants={feedbackVariants}>
                            Thank you! We'll be in touch soon.
                        </motion.div>
                    </motion.div>
                )}
              </form>
            </motion.div>

            {/* --- Right Side: Map --- */}
            {/* Map section remains the same */}
            <motion.div className="map-container" variants={itemVariants}>
               <div className="contactMap"> <iframe /* ... */ ></iframe> </div>
            </motion.div>
          </motion.section>

          {/* --- Team Section --- */}
          {/* Team section remains the same */}
          {teamMembers.length > 0 && ( <motion.section /* ... */ > </motion.section> )}

        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactUs;