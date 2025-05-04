import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Icons remain the same
import { MdPerson, MdEmail, MdMessage, MdLocationOn, MdPhone, MdOutlineAccessTime } from 'react-icons/md';
import '../styles/ContactUs.css'; // Ensure CSS file is correctly named and imported
import Navbar from '../components/navbar1';
import Footer from '../components/Footer1';

// --- Configuration ---
const YOUR_COMPANY_ADDRESS_LINE1 = "123 Main Street";
const YOUR_COMPANY_ADDRESS_LINE2 = "New York, NY 10001";
const YOUR_COMPANY_PHONE = "+1 (555) 123-4567";
const YOUR_COMPANY_EMAIL = "info@yourcompany.com";
const YOUR_COMPANY_HOURS = "Mon - Fri: 9:00 AM - 5:00 PM";
// Example profile data - replace with your actual data
const teamMembers = [
  { id: 1, name: "Alex Johnson", title: "Support Lead", img: 'https://via.placeholder.com/150/cccccc/888888?text=Alex' },
  { id: 2, name: "Maria Garcia", title: "Sales Manager", img: 'https://via.placeholder.com/150/dddddd/777777?text=Maria' },
  { id: 3, name: "Kenichi Tanaka", title: "Technical Support", img: 'https://via.placeholder.com/150/bbbbbb/666666?text=Kenichi' },
  { id: 4, name: "Aisha Khan", title: "Client Relations", img: 'https://via.placeholder.com/150/eeeeee/555555?text=Aisha' },
];
// --- End Configuration ---


// Animation Variants (remain the same)
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "backOut" } }
};
const formItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
const feedbackVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};


const ContactUs = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data Submitted:', formData);
    setTimeout(() => {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
       setTimeout(() => setIsSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <>
      <Navbar/>
      <div className="ContactUsPage">
        <div className="contact-us-container">

          {/* --- Main Contact Section (Form & Map/Details) --- */}
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
                {YOUR_COMPANY_ADDRESS_LINE1 && (
                  <div className="contact-item">
                      <MdLocationOn size={24} className="contact-icon" aria-hidden="true"/>
                      <span>{YOUR_COMPANY_ADDRESS_LINE1}<br/>{YOUR_COMPANY_ADDRESS_LINE2}</span>
                  </div>
                )}
                {YOUR_COMPANY_PHONE && (
                  <div className="contact-item">
                      <MdPhone size={20} className="contact-icon" aria-hidden="true"/>
                      <a href={`tel:${YOUR_COMPANY_PHONE}`}>{YOUR_COMPANY_PHONE}</a>
                  </div>
                )}
                {YOUR_COMPANY_EMAIL && (
                  <div className="contact-item">
                      <MdEmail size={20} className="contact-icon" aria-hidden="true"/>
                      <a href={`mailto:${YOUR_COMPANY_EMAIL}`}>{YOUR_COMPANY_EMAIL}</a>
                  </div>
                )}
                {YOUR_COMPANY_HOURS && (
                  <div className="contact-item">
                      <MdOutlineAccessTime size={20} className="contact-icon" aria-hidden="true"/>
                      <span>{YOUR_COMPANY_HOURS}</span>
                  </div>
                )}
              </motion.div>

              {/* --- Contact Form --- */}
              <form onSubmit={handleSubmit} className="contact-form">
                <motion.div variants={formItemVariants} className="input-wrapper">
                  <MdPerson className="input-icon" size={20} aria-hidden="true" />
                  <input type="text" placeholder="Your Name" name="name" required className="form-input" aria-label="Your Name" value={formData.name} onChange={handleInputChange} />
                </motion.div>
                <motion.div variants={formItemVariants} className="input-wrapper">
                  <MdEmail className="input-icon" size={20} aria-hidden="true" />
                  <input type="email" placeholder="Your Email Address" name="email" required className="form-input" aria-label="Your Email Address" value={formData.email} onChange={handleInputChange} />
                </motion.div>
                <motion.div variants={formItemVariants} className="input-wrapper textarea-wrapper">
                  <MdMessage className="input-icon" size={20} aria-hidden="true" />
                  <textarea placeholder="Your Message" name="message" rows="5" required className="form-textarea" aria-label="Your Message" value={formData.message} onChange={handleInputChange}></textarea>
                </motion.div>
                <motion.button variants={formItemVariants} type="submit" className="submit-button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  Send Message
                </motion.button>
                {isSubmitted && (
                  <motion.div className="success-message" initial="hidden" animate="visible" exit="hidden" variants={feedbackVariants}>
                    Thank you for your message! We'll be in touch soon.
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* --- Right Side: Map (Using iframe) --- */}
            <motion.div className="map-container" variants={itemVariants}>
              {/* Optional: Add a heading for the map */}
              {/* <h3>Our Location</h3> */}
              <div className="contactMap">
                    {/* Replace the src with your specific Google Maps embed link */}
                    <iframe
                        title="Company Location Map" // Added title for accessibility
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.5513466615735!2d74.30043917389776!3d31.481525749063223!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391903f08ebc7e8b%3A0x47e934f4cd34790!2sFAST%20NUCES%20Lahore!5e0!3m2!1sen!2s!4v1716731606417!5m2!1sen!2s"
                        width="100%" // Make width responsive
                        height="450" // Adjust height as needed
                        style={{ border: 0 }} // Use style object for border
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade">
                    </iframe>
                </div>
            </motion.div>
          </motion.section>

          {/* --- Team/Profile Section (Reintroduced) --- */}
          {teamMembers.length > 0 && ( // Only render section if there are team members
              <motion.section
                  className="team-section"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={sectionVariants}
              >
                  <h2 className="team-title">Meet Our Key Contacts</h2>
                  <motion.div
                      className="team-grid"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ staggerChildren: 0.1 }} // Stagger animation of team members
                  >
                      {teamMembers.map((member) => (
                          <motion.div key={member.id} className="team-member-card" variants={itemVariants}>
                              <img
                                  src={member.img}
                                  alt={`${member.name}, ${member.title}`}
                                  className="team-member-image"
                              />
                              <div className="team-member-info">
                                  <h4 className="team-member-name">{member.name}</h4>
                                  <p className="team-member-title">{member.title}</p>
                              </div>
                          </motion.div>
                      ))}
                  </motion.div>
              </motion.section>
          )}

        </div>
      </div>
      <Footer />  
    </>
  );
};

export default ContactUs;