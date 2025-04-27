import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/profile.css'; // Keep using the same CSS file
import Navbar from '../../components/navbar'; // Adjust the import path as necessary
import Footer from '../../components/Footer.jsx'; // Adjust the import path as necessary

// Placeholder icons (replace with actual SVGs or icon font if available)
const EditIcon = () => <span className="icon">✏️</span>;
const DeleteIcon = () => <span className="icon">🗑️</span>;

const SettingsPage = () => {
  // Existing State
  const [fullName, setFullName] = useState('Waleed Boom');
  const [password, setPassword] = useState('Azlan :)');
  const [email, setEmail] = useState('Waleed Ahmad');
  const [currency, setCurrency] = useState('');
  const [approvalSystemEnabled, setApprovalSystemEnabled] = useState(true);

  // --- NEW State ---
  const [language, setLanguage] = useState('');
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // Default to light mode

  // Existing dummy data
  const categories = [
    { id: '001', name: 'First Name' },
    { id: '001', name: 'First Name' },
    { id: '001', name: 'First Name' },
  ];

  // --- NEW Dummy Data ---
  const pendingInvitations = [
    { id: 1, type: 'Budget Invite', from: 'Waleed', daysPending: 12 },
    { id: 2, type: 'Budget Invite', from: 'Waleed', daysPending: 12 },
    // Add more invitations as needed
  ];


  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const toggleSpring = {
     type: 'spring',
     stiffness: 700,
     damping: 30
  }

  return (
    <>
        <Navbar /> {/* Keep the Navbar as is */}
        <div className="settings-page-container">
        {/* Top Bar (Keep as is) */}
        <header className="settings-header">
            {/* ... Quick Links and Log Out Button ... */}
            <div className="quick-links">
            <strong>Quick Links:</strong>
            <a href="#profile">Profile Settings</a>
            <a href="#budget">Budget & Expense Settings</a>
            <a href="#ui">UI & Appearance Settings</a>
            <a href="#pending">Pending Invitations</a>
            </div>
            <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="button button-logout"
            >
            Log Out
            </motion.button>
        </header>

        {/* Edit Profile Section (Keep as is) */}
        <motion.section
            id="profile" // Add ID for quick link
            className="settings-section profile-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
        >
            {/* ... Profile Content ... */}
            <div className="section-header">
            <h2>Edit Profile</h2>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="button button-primary"
            >
                Save Changes
            </motion.button>
            </div>

            <div className="profile-picture-area">
            <img
                src="https://via.placeholder.com/100" // Replace with actual image URL or import
                alt="Profile"
                className="profile-img"
            />
            <div className="profile-picture-controls">
                <p>Profile Picture</p>
                <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="button button-secondary"
                >
                Change Picture
                </motion.button>
            </div>
            </div>

            <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
                type="text"
                id="fullName"
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
            />
            </div>

            <div className="form-group">
            <label htmlFor="password">Change Password</label>
            {/* Using type="text" to show placeholder like the image, use "password" normally */}
            <input
                type="text"
                id="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            </div>

            <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
                type="email"
                id="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            </div>
        </motion.section>

        {/* Budget and Expense Settings Section (Keep as is) */}
        <motion.section
            id="budget" // Add ID for quick link
            className="settings-section budget-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }} // Adjust delay if needed
        >
            {/* ... Budget Content ... */}
            <div className="section-header">
            <h2>Budget and Expense Settings</h2>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="button button-primary"
            >
                Save Changes
            </motion.button>
            </div>

            <div className="setting-row">
            <label htmlFor="currency">Change Currency</label>
            <select
                id="currency"
                className="select-field"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
            >
                <option value="" disabled>Choose Currency</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                {/* Add other currencies */}
            </select>
            </div>

            <div className="setting-row">
            <label>Expense Approval System</label>
            <div
                className={`toggle-switch ${approvalSystemEnabled ? 'active' : ''}`}
                onClick={() => setApprovalSystemEnabled(!approvalSystemEnabled)}
                data-testid="expense-approval-toggle" // Added for clarity/testing
            >
                <motion.div
                className="toggle-knob"
                layout // Animate layout changes
                transition={toggleSpring}
                />
            </div>
            </div>

            <div className="expense-categories">
            <div className="categories-header">
                <h3>Expense Categories</h3>
                <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="button button-secondary"
                >
                    Add Category
                </motion.button>
            </div>


            <div className="category-list">
                <div className="category-row header-row">
                <div className="category-cell id-cell">Category Id</div>
                <div className="category-cell name-cell">Category Name</div>
                <div className="category-cell action-cell">Action</div>
                </div>
                {categories.map((category, index) => (
                <div className="category-row" key={index}>
                    <div className="category-cell id-cell">{category.id}</div>
                    <div className="category-cell name-cell">{category.name}</div>
                    <div className="category-cell action-cell action-icons">
                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button">
                        <EditIcon />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} className="icon-button">
                        <DeleteIcon />
                        </motion.button>
                    </div>
                </div>
                ))}
            </div>
            </div>
        </motion.section>

        {/* --- NEW: UI and Appearance Settings Section --- */}
        <motion.section
            id="ui" // Add ID for quick link
            className="settings-section ui-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }} // Adjust delay
        >
            <div className="section-header">
            <h2>UI and Appearance Settings</h2>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="button button-primary"
            >
                Save Changes
            </motion.button>
            </div>

            <div className="setting-row">
            <label htmlFor="language">Change Language</label>
            <select
                id="language"
                className="select-field"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
            >
                <option value="" disabled>Choose Language</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                {/* Add other languages */}
            </select>
            </div>

            <div className="setting-row">
            <label>Dark Mode</label>
            <div
                className={`toggle-switch ${darkModeEnabled ? 'active' : ''}`}
                onClick={() => setDarkModeEnabled(!darkModeEnabled)}
                data-testid="dark-mode-toggle" // Added for clarity/testing
            >
                <motion.div
                className="toggle-knob"
                layout
                transition={toggleSpring}
                />
            </div>
            </div>
        </motion.section>

        {/* --- NEW: Pending Invitations Section --- */}
        <motion.section
            id="pending" // Add ID for quick link
            className="settings-section pending-invitations-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }} // Adjust delay
        >
            <div className="section-header no-button"> {/* Added class for styling */}
            <h2>Pending Invitations</h2>
            {/* No Save Changes button here */}
            </div>

            {pendingInvitations.length === 0 ? (
            <p>No pending invitations.</p>
            ) : (
            <div className="invitations-list">
                {pendingInvitations.map((invite) => (
                <motion.div
                    className="invitation-card"
                    key={invite.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="invitation-details">
                    <h4 className="invitation-title">{invite.type}</h4>
                    <p className="invitation-sender">Invite from {invite.from}</p>
                    <p className="invitation-status">Pending since {invite.daysPending} Days</p>
                    </div>
                    <div className="invitation-actions">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="button button-accept"
                    >
                        Accept
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="button button-reject"
                    >
                        Reject
                    </motion.button>
                    </div>
                </motion.div>
                ))}
            </div>
            )}
        </motion.section>

        </div>
        <Footer /> {/* Keep the Footer as is */}
    </>
  );
};

export default SettingsPage;