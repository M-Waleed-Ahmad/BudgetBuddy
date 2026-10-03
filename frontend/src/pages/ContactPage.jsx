import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { MdEmail, MdLocationOn, MdMessage, MdPerson } from 'react-icons/md';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { sendContactMessage } from '../api';
import saad from '../assets/saad.webp';
import azlan from '../assets/azlan.webp';
import ashar from '../assets/ashar.webp';
import waleed from '../assets/waleed.webp';
import '../styles/ContactPage.css';

const ADDRESS_LINES = ['FAST-NUCES', 'Lahore, Pakistan'];

const TEAM_MEMBERS = [
  { name: 'Waleed Ahmad', title: 'Team Lead', img: waleed },
  { name: 'Muhammad Saad', title: 'Sales Manager', img: saad },
  { name: 'Ashar Mehmood', title: 'Technical Support', img: ashar },
  { name: 'Azlan Khalid', title: 'Client Relations', img: azlan },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'backOut' } },
};

const emptyForm = { name: '', email: '', message: '' };

function validate({ name, email, message }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Please enter your name.';
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (message.trim().length < 10) errors.message = 'Please write at least 10 characters.';
  else if (message.length > MAX_MESSAGE_LENGTH) errors.message = `Please keep it under ${MAX_MESSAGE_LENGTH} characters.`;
  return errors;
}

const ContactPage = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      setFormData(emptyForm);
      setIsSubmitted(true);
      toast.success(result?.message || 'Message sent – we will be in touch soon!');
    } catch (error) {
      if (error.errors) setErrors(error.errors);
      toast.error(error.message || 'Could not send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldProps = (name) => ({
    id: `contact-${name}`,
    name,
    value: formData[name],
    onChange: handleInputChange,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
  });

  const fieldError = (name) =>
    errors[name] ? (
      <p id={`contact-${name}-error`} className="field-error-text">
        {errors[name]}
      </p>
    ) : null;

  return (
    <>
      <PublicNavbar />
      <main className="ContactUsComponent">
        <div className="contact-us-container">
          <motion.section
            className="connect-section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={sectionVariants}
          >
            <div className="form-and-details-container">
              <h1 className="contact-title">Get in touch</h1>
              <p className="subtitle">
                Have a question about BudgetBuddy or want a walkthrough? Send us a message and we&apos;ll get back to you.
              </p>

              <div className="contact-details">
                <div className="contact-item">
                  <MdLocationOn size={24} className="contact-icon" aria-hidden="true" />
                  <address>
                    {ADDRESS_LINES[0]}
                    <br />
                    {ADDRESS_LINES[1]}
                  </address>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                <div className="field">
                  <label htmlFor="contact-name" className="visually-hidden">
                    Your name
                  </label>
                  <div className={`input-wrapper${errors.name ? ' has-error' : ''}`}>
                    <MdPerson className="input-icon" size={20} aria-hidden="true" />
                    <input type="text" placeholder="Your name" autoComplete="name" className="form-input" {...fieldProps('name')} />
                  </div>
                  {fieldError('name')}
                </div>

                <div className="field">
                  <label htmlFor="contact-email" className="visually-hidden">
                    Your email address
                  </label>
                  <div className={`input-wrapper${errors.email ? ' has-error' : ''}`}>
                    <MdEmail className="input-icon" size={20} aria-hidden="true" />
                    <input
                      type="email"
                      placeholder="Your email address"
                      autoComplete="email"
                      className="form-input"
                      {...fieldProps('email')}
                    />
                  </div>
                  {fieldError('email')}
                </div>

                <div className="field">
                  <label htmlFor="contact-message" className="visually-hidden">
                    Your message
                  </label>
                  <div className={`input-wrapper textarea-wrapper${errors.message ? ' has-error' : ''}`}>
                    <MdMessage className="input-icon" size={20} aria-hidden="true" />
                    <textarea
                      placeholder="Your message"
                      rows="5"
                      maxLength={MAX_MESSAGE_LENGTH}
                      className="form-textarea"
                      {...fieldProps('message')}
                    />
                  </div>
                  {fieldError('message')}
                </div>

                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Send message'}
                </button>

                {isSubmitted && (
                  <p className="success-message" role="status">
                    Thank you for your message! We&apos;ll be in touch soon.
                  </p>
                )}
              </form>
            </div>

            <div className="map-container">
              <div className="contactMap">
                <iframe
                  title="Map showing FAST-NUCES, Lahore"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.5513466615735!2d74.30043917389776!3d31.481525749063223!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391903f08ebc7e8b%3A0x47e934f4cd34790!2sFAST%20NUCES%20Lahore!5e0!3m2!1sen!2s!4v1716731606417!5m2!1sen!2s"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            className="team-section"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
          >
            <h2 className="team-title">Meet the team</h2>
            <motion.div
              className="team-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {TEAM_MEMBERS.map((member) => (
                <motion.div key={member.name} className="team-member-card" variants={itemVariants}>
                  <img
                    src={member.img}
                    alt={`${member.name}, ${member.title}`}
                    className="team-member-image"
                    loading="lazy"
                    width="300"
                    height="300"
                  />
                  <div className="team-member-info">
                    <h3 className="team-member-name">{member.name}</h3>
                    <p className="team-member-title">{member.title}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
};

export default ContactPage;
