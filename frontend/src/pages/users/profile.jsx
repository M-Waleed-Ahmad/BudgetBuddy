import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import Navbar from '../../components/navbar';        // Adjust path if needed
import Footer from '../../components/Footer.jsx';    // Adjust path if needed
import Modal from '../../components/Modal';          // Adjust path if needed
import '../../styles/profile.css';              // Adjust path if needed (or use a SettingsPage specific CSS)
import { logoutUser } from '../../api/api.js'; // Adjust path if needed
// --- Icons ---
const EditIcon = ({ size = 16 }) => <span className="icon" style={{fontSize: `${size}px`}} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span className="icon" style={{fontSize: `${size}px`}} title="Delete">🗑️</span>;

// --- Initial Dummy Data Generation ---
const generateInitialCategories = (count = 3) =>
    Array(count).fill(null).map((_, index) => ({
        id: `cat-${index + 1}-${Date.now()}`.slice(-10),
        name: `Category ${index + 1}`
    }));

const generateInitialInvitations = (count = 2) =>
    Array(count).fill(null).map((_, index) => ({
        id: `inv-${index + 1}-${Date.now()}`.slice(-10),
        type: 'Budget Invite',
        from: 'Waleed',
        daysPending: 12 + index
    }));

// --- Available options ---
const availableCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY']; // Example
const availableLanguages = [ { code: 'en', name: 'English'}, { code: 'es', name: 'Español'}, { code: 'fr', name: 'Français'} ];


const SettingsPage = () => {
    // --- Component State ---
    // Form States
    const navigate = useNavigate(); // For navigation
    const [profileData, setProfileData] = useState({ fullName: 'Waleed Boom', password: '', email: 'waleed.ahmad@example.com' });
    const [budgetSettings, setBudgetSettings] = useState({ currency: '', approvalSystemEnabled: true });
    const [uiSettings, setUiSettings] = useState({ language: '', darkModeEnabled: false });
    const [categoryFormData, setCategoryFormData] = useState({ name: '' }); // For Add/Edit category form

    // List States (Manageable)
    const [categories, setCategories] = useState(generateInitialCategories());
    const [pendingInvitations, setPendingInvitations] = useState(generateInitialInvitations());

    // Modal States
    const [modalState, setModalState] = useState({
        isCategoryModalOpen: false,
        isDeleteCategoryModalOpen: false,
        isRejectInviteModalOpen: false,
    });
    const [editingCategory, setEditingCategory] = useState(null); // null for Add, object for Edit
    const [deletingItemId, setDeletingItemId] = useState(null);   // For category or invitation ID
    const [deletingItemType, setDeletingItemType] = useState(''); // 'category' or 'invitation'


    // --- Derived/Calculated Values ---
    // Example: Format email for display if needed (though not strictly necessary here)
    const displayEmail = profileData.email;

    // --- Animation Variants ---
    const sectionVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
    const toggleSpring = { type: 'spring', stiffness: 700, damping: 30 };


    // --- Modal Control ---
    const openModal = (modalName, item = null, itemType = '') => {
        setModalState(prev => ({ ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}), [modalName]: true }));
        if (itemType === 'category' && item) setEditingCategory(item); else setEditingCategory(null);
        if (itemType && item) { setDeletingItemId(item.id); setDeletingItemType(itemType); }
        else { setDeletingItemId(null); setDeletingItemType(''); }

        // Pre-fill forms
        if (modalName === 'isCategoryModalOpen' && item) {
            setCategoryFormData({ name: item.name || '' });
        } else if (modalName === 'isCategoryModalOpen' && !item) {
            setCategoryFormData({ name: '' }); // Reset for add
        }
    };

    const closeModal = () => {
        setModalState(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
        setTimeout(() => { setEditingCategory(null); setDeletingItemId(null); setDeletingItemType(''); }, 300);
    };


    // --- Handlers ---
    const handleProfileChange = (e) => { const { name, value } = e.target; setProfileData(prev => ({ ...prev, [name]: value })); };
    const handleBudgetSettingChange = (e) => { const { name, value } = e.target; setBudgetSettings(prev => ({ ...prev, [name]: value })); };
    const handleUiSettingChange = (e) => { const { name, value } = e.target; setUiSettings(prev => ({ ...prev, [name]: value })); };
    const handleCategoryFormChange = (e) => { const { name, value } = e.target; setCategoryFormData(prev => ({ ...prev, [name]: value })); };

    const handleProfileSave = () => { console.log("Saving Profile:", profileData); alert("Profile changes saved! (Simulated)"); /* TODO: API Call */ };
    const handleChangePicture = () => { alert("Change Picture clicked! (Implement file upload logic)"); };
    const handleBudgetSettingsSave = () => { console.log("Saving Budget Settings:", budgetSettings); alert("Budget settings saved! (Simulated)"); /* TODO: API Call */ };
    const handleUiSettingsSave = () => { console.log("Saving UI Settings:", uiSettings); alert("UI settings saved! (Simulated)"); /* TODO: API Call */ };
    const handleLogout = async () => {
        try {
            // Optional: Call the backend logout endpoint
            // Useful for invalidating refresh tokens or logging, though not strictly
            // required for basic stateless JWT client-side logout.
            await logoutUser();
            console.log('Backend logout acknowledged.');

        } catch (error) {
            // Log the error but proceed with client logout anyway
            console.error('Backend logout failed:', error);
            alert('Logout failed on server, but logging out locally.'); // Optional user feedback
        } finally {
            // --- ALWAYS perform client-side logout ---
            localStorage.removeItem('token'); // Remove the token from storage
            alert("Logged out successfully!"); // Or use a more subtle notification
            navigate('/login', { replace: true }); // Redirect to login page
        }
    };


    const handleCategorySubmit = (e) => {
        e.preventDefault();
        if (!categoryFormData.name.trim()) { alert("Category name cannot be empty."); return; }

        if (editingCategory) {
            // Edit Category
            console.log("Updating Category:", editingCategory.id, categoryFormData);
            // TODO: API Call
            setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? { ...cat, name: categoryFormData.name } : cat));
            alert(`Category ${editingCategory.name} updated! (Simulated)`);
        } else {
            // Add Category
            const newCategory = { id: `cat-${Date.now()}`.slice(-10), name: categoryFormData.name };
            console.log("Adding Category:", newCategory);
            // TODO: API Call
            setCategories(prev => [newCategory, ...prev]);
            alert(`Category ${newCategory.name} added! (Simulated)`);
        }
        closeModal();
    };

    const confirmDelete = () => {
        if (!deletingItemId || !deletingItemType) return;

        if (deletingItemType === 'category') {
            console.log("Deleting Category:", deletingItemId);
            // TODO: API Call
            setCategories(prev => prev.filter(cat => cat.id !== deletingItemId));
             alert(`Category deleted! (Simulated)`);
        } else if (deletingItemType === 'invitation') {
            console.log("Rejecting Invitation:", deletingItemId);
             // TODO: API Call
            setPendingInvitations(prev => prev.filter(inv => inv.id !== deletingItemId));
             alert(`Invitation rejected! (Simulated)`);
        }
        closeModal();
    };

     const handleAcceptInvite = (inviteId) => {
        console.log("Accepting Invitation:", inviteId);
        // TODO: API Call to accept
        setPendingInvitations(prev => prev.filter(inv => inv.id !== inviteId)); // Remove locally on success
        alert(`Invitation accepted! (Simulated)`);
    };

    // Pre-fill category edit form
     useEffect(() => {
        if (editingCategory && modalState.isCategoryModalOpen) {
            setCategoryFormData({ name: editingCategory.name });
        } else if (!editingCategory && modalState.isCategoryModalOpen) {
            setCategoryFormData({ name: '' }); // Reset if adding
        }
     }, [editingCategory, modalState.isCategoryModalOpen]);

    return (
    <>
        <Navbar />
        <div className="settings-page-container">
        {/* --- Header --- */}
        <header className="settings-header">
            <div className="quick-links">
                <strong>Quick Links:</strong>
                <a href="#profile">Profile</a>
                <a href="#budget">Budget/Expense</a>
                <a href="#ui">Appearance</a>
                <a href="#pending">Invitations</a>
            </div>
            <motion.button onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-logout">Log Out</motion.button>
        </header>

        {/* --- Edit Profile Section --- */}
        <motion.section id="profile" className="settings-section profile-section" initial="hidden" animate="visible" variants={sectionVariants}>
            <div className="section-header">
                <h2>Edit Profile</h2>
                <motion.button onClick={handleProfileSave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-primary">Save Profile</motion.button>
            </div>
            <div className="profile-picture-area">
                <img src="https://via.placeholder.com/100" alt="Profile" className="profile-img"/>
                <div className="profile-picture-controls">
                    <p>Profile Picture</p>
                    <motion.button onClick={handleChangePicture} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-secondary">Change Picture</motion.button>
                </div>
            </div>
            <div className="form-group"><label htmlFor="fullName">Full Name</label><input type="text" id="fullName" name="fullName" className="input-field" value={profileData.fullName} onChange={handleProfileChange}/></div>
            <div className="form-group"><label htmlFor="password">New Password</label><input type="password" id="password" name="password" className="input-field" value={profileData.password} onChange={handleProfileChange} placeholder="Leave blank to keep current"/></div>
            <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" className="input-field" value={displayEmail} readOnly disabled/></div> {/* Email usually not editable */}
        </motion.section>

        {/* --- Budget and Expense Settings Section --- */}
        <motion.section id="budget" className="settings-section budget-section" initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.1 }}>
            <div className="section-header">
                <h2>Budget & Expense Settings</h2>
                <motion.button onClick={handleBudgetSettingsSave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-primary">Save Budget Settings</motion.button>
            </div>
            <div className="setting-row">
                <label htmlFor="currency">Currency</label>
                <select id="currency" name="currency" className="select-field" value={budgetSettings.currency} onChange={handleBudgetSettingChange}>
                    <option value="" disabled>-- Select Currency --</option>
                    {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="setting-row">
                <label>Expense Approval System</label>
                <div className={`toggle-switch ${budgetSettings.approvalSystemEnabled ? 'active' : ''}`} onClick={() => setBudgetSettings(p=>({...p, approvalSystemEnabled: !p.approvalSystemEnabled}))} data-testid="expense-approval-toggle">
                    <motion.div className="toggle-knob" layout transition={toggleSpring} />
                </div>
            </div>
            <div className="expense-categories">
                <div className="categories-header">
                    <h3>Expense Categories</h3>
                    {/* Button to open Add Category modal */}
                    <motion.button onClick={() => openModal('isCategoryModalOpen')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-secondary">Add Category</motion.button>
                </div>
                <div className="category-list">
                    <div className="category-row header-row"><div className="category-cell id-cell">ID</div><div className="category-cell name-cell">Name</div><div className="category-cell action-cell">Action</div></div>
                    <AnimatePresence>
                        {categories.map((category) => (
                            <motion.div layout key={category.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="category-row">
                                <div className="category-cell id-cell">{category.id.slice(-6)}</div> {/* Show shorter ID */}
                                <div className="category-cell name-cell">{category.name}</div>
                                <div className="category-cell action-cell action-icons">
                                    {/* Button to open Edit Category modal */}
                                    <motion.button onClick={() => openModal('isCategoryModalOpen', category, 'category')} whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                    {/* Button to open Delete Category modal */}
                                    <motion.button onClick={() => openModal('isDeleteCategoryModalOpen', category, 'category')} whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {categories.length === 0 && <div className="no-data-message">No categories defined.</div>}
                </div>
            </div>
        </motion.section>

        {/* --- UI and Appearance Settings Section --- */}
        <motion.section id="ui" className="settings-section ui-section" initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.2 }}>
             <div className="section-header">
                <h2>Appearance Settings</h2>
                <motion.button onClick={handleUiSettingsSave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-primary">Save Appearance</motion.button>
            </div>
            <div className="setting-row">
                <label htmlFor="language">Language</label>
                <select id="language" name="language" className="select-field" value={uiSettings.language} onChange={handleUiSettingChange}>
                    <option value="" disabled>-- Select Language --</option>
                     {availableLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
            </div>
            <div className="setting-row">
                <label>Dark Mode</label>
                <div className={`toggle-switch ${uiSettings.darkModeEnabled ? 'active' : ''}`} onClick={() => setUiSettings(p=>({...p, darkModeEnabled: !p.darkModeEnabled}))} data-testid="dark-mode-toggle">
                    <motion.div className="toggle-knob" layout transition={toggleSpring} />
                </div>
            </div>
        </motion.section>

        {/* --- Pending Invitations Section --- */}
        <motion.section id="pending" className="settings-section pending-invitations-section" initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.3 }}>
            <div className="section-header no-button"><h2>Pending Invitations</h2></div>
             <div className="invitations-list">
                <AnimatePresence>
                    {pendingInvitations.length === 0 ? (
                        <motion.p variants={itemVariants} className="no-data-message">No pending invitations.</motion.p>
                    ) : (
                        pendingInvitations.map((invite) => (
                            <motion.div layout key={invite.id} className="invitation-card" initial="hidden" animate="visible" exit={{ opacity: 0, x: -50 }} variants={itemVariants}>
                                <div className="invitation-details">
                                    <h4 className="invitation-title">{invite.type}</h4>
                                    <p className="invitation-sender">Invite from {invite.from}</p>
                                    <p className="invitation-status">Pending since {invite.daysPending} Days</p>
                                </div>
                                <div className="invitation-actions">
                                    <motion.button onClick={() => handleAcceptInvite(invite.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-accept">Accept</motion.button>
                                    {/* Button to open Reject Invite modal */}
                                    <motion.button onClick={() => openModal('isRejectInviteModalOpen', invite, 'invitation')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-reject">Reject</motion.button>
                                </div>
                            </motion.div>
                        ))
                    )}
                 </AnimatePresence>
            </div>
        </motion.section>

        </div> {/* End settings-page-container */}

        {/* --- MODALS --- */}
        {/* Add/Edit Category Modal */}
         <Modal isOpen={modalState.isCategoryModalOpen} onClose={closeModal} title={editingCategory ? "Edit Category" : "Add New Category"}>
            <form onSubmit={handleCategorySubmit} className="modal-form">
                 {editingCategory && (<div className="form-group"><label>Category ID</label><input type="text" value={editingCategory.id} className="input-field" readOnly disabled/></div>)}
                 <div className="form-group"><label htmlFor="cat-name">Category Name</label><input type="text" id="cat-name" name="name" required className="input-field" value={categoryFormData.name} onChange={handleCategoryFormChange} placeholder="e.g., Groceries"/></div>
                 <div className="form-actions">
                    <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                    <motion.button type="submit" className="primary-button" whileTap={{ scale: 0.95 }}>{editingCategory ? "Save Changes" : "Add Category"}</motion.button>
                </div>
            </form>
        </Modal>

         {/* Delete Category Confirmation */}
         <Modal isOpen={modalState.isDeleteCategoryModalOpen} onClose={closeModal} title="Confirm Delete Category">
            <div className="confirmation-text">Are you sure you want to delete the category: <strong>{categories.find(c=>c.id === deletingItemId)?.name || deletingItemId}</strong>? Associated expenses might need recategorization.</div>
            <div className="confirmation-actions">
                <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDelete} whileTap={{ scale: 0.95 }}>Delete Category</motion.button>
            </div>
        </Modal>

         {/* Reject Invitation Confirmation */}
         <Modal isOpen={modalState.isRejectInviteModalOpen} onClose={closeModal} title="Confirm Reject Invitation">
             <div className="confirmation-text">Are you sure you want to reject the invitation from <strong>{pendingInvitations.find(inv => inv.id === deletingItemId)?.from || 'this user'}</strong>?</div>
             <div className="confirmation-actions">
                <motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                <motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDelete} whileTap={{ scale: 0.95 }}>Reject Invitation</motion.button>
            </div>
        </Modal>

        <Footer />
    </>
  );
};

export default SettingsPage;