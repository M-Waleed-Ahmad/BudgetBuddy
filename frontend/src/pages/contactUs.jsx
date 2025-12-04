import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MdPerson,
  MdEmail,
  MdMessage,
  MdLocationOn,
  MdPhone,
  MdOutlineAccessTime
} from 'react-icons/md';

import '../styles/ContactUs.css';

import Navbar1 from '../components/navbar1';
import Footer1 from '../components/Footer1';

import { sendContactMessage } from '../api/api';
import { toast } from 'react-hot-toast';

// Team images
import saad from '../assets/saad.png';
import azlan from '../assets/azlan.png';
import ashar from '../assets/ashar.png';
import waleed from '../assets/waleed.png';

// --- Contact Info ---
const CONTACT_INFO = {
  address1: "FAST NUCES Lahore",
  address2: "Block B, Faisal Town, Lahore, Pakistan",
  phone: "+92 300 1234567",
  email: "info@budgetbuddy.com",
  hours: "Mon - Fri: 9:00 AM - 5:00 PM",
};

// --- Team Members ---
const teamMembers = [
  { id: 1, name: "Waleed Ahmad", title: "Team Lead / Fullstack", img: waleed },
  { id: 2, name: "Muhammad Saad", title: "Frontend Developer", img: saad },
  { id: 3, name: "Ashar Mehmood", title: "Backend Developer", img: ashar },
  { id: 4, name: "Azlan Khalid", title: "UI/UX & QA", img: azlan },
];

// --- Animations ---
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
};

const pop = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

const ContactUs = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const updateField = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Handle Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, message } = formData;

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("All fields are required.");
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }

    try {
      setLoading(true);

      await sendContactMessage(email, name, message);
      toast.success("Message sent successfully!");

      setFormData({ name: '', email: '', message: '' });
      setIsSubmitted(true);

      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar1 />

      <div className="ContactUsComponent">
        <div className="contact-us-container">

          {/* ========== CONTACT FORM + DETAILS ========== */}
          <motion.section
            className="connect-section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            {/* --- Left Card (Form + Contact Details) --- */}
            <motion.div
              className="form-and-details-container"
              variants={pop}
            >
              <h2>Get in Touch</h2>
              <p className="subtitle">
                We'd love to hear from you! Whether you have questions, feedback, or project ideas — drop us a message.
              </p>

              {/* Contact Details */}
              <div className="contact-details">
                <div className="contact-item">
                  <MdLocationOn className="contact-icon" />
                  <span>{CONTACT_INFO.address1}<br />{CONTACT_INFO.address2}</span>
                </div>

                <div className="contact-item">
                  <MdPhone className="contact-icon" />
                  <a href={`tel:${CONTACT_INFO.phone}`}>{CONTACT_INFO.phone}</a>
                </div>

                <div className="contact-item">
                  <MdEmail className="contact-icon" />
                  <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
                </div>

                <div className="contact-item">
                  <MdOutlineAccessTime className="contact-icon" />
                  <span>{CONTACT_INFO.hours}</span>
                </div>
              </div>

              {/* --- CONTACT FORM --- */}
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="input-wrapper">
                  <MdPerson className="input-icon" />
                  <input
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="input-wrapper">
                  <MdEmail className="input-icon" />
                  <input
                    name="email"
                    placeholder="Your Email"
                    type="email"
                    value={formData.email}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="input-wrapper textarea-wrapper">
                  <MdMessage className="input-icon" />
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    rows={5}
                    value={formData.message}
                    onChange={updateField}
                    required
                  ></textarea>
                </div>

                <motion.button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? "Sending..." : "Send Message"}
                </motion.button>

                {isSubmitted && (
                  <motion.div
                    className="success-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Thank you! We'll get back to you shortly.
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* --- Right Card (Google Map) --- */}
            <motion.div className="map-container" variants={pop}>
              <div className="contactMap">
                <iframe
                  title="FAST NUCES Lahore Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.5513466615735!2d74.30043917389776!3d31.481525749063223!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391903f08ebc7e8b%3A0x47e934f4cd34790!2sFAST%20NUCES%20Lahore!5e0!3m2!1sen!2s!4v1716731606417!5m2!1sen!2s"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </motion.div>
          </motion.section>

          {/* ========== TEAM SECTION ========== */}
          <motion.section
            className="team-section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="team-title">Meet Our Team</h2>

            <div className="team-grid">
              {teamMembers.map((m) => (
                <motion.div key={m.id} className="team-member-card" variants={pop}>
                  <img src={m.img} alt={m.name} className="team-member-image" />
                  <div className="team-member-info">
                    <h4 className="team-member-name">{m.name}</h4>
                    <p className="team-member-title">{m.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>

      <Footer1 />
    </>
  );
};

export default ContactUs;
