import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';      
import Footer from '../../components/Footer';       
import Modal from '../../components/Modal';          
import {
    logoutUser,
    getUserProfile,
    updateUserProfile, 
    uploadToCloudinary,
    getCategories,   
    addCategory,       
    updateCategory,    
    deleteCategory,     
    updateCurrencyPreference, 
    updateUI,
    getPendingInvitations, acceptInvitation, rejectInvitation
} from '../../api/api.js';                     
import '../../styles/profile.css'; 
import { toast } from 'react-hot-toast'; // Import toast for notifications

// --- Icons ---
const EditIcon = ({ size = 16 }) => <span className="icon" style={{fontSize: `${size}px`}} title="Edit">✏️</span>;
const DeleteIcon = ({ size = 16 }) => <span className="icon" style={{fontSize: `${size}px`}} title="Delete">🗑️</span>;

// --- Constants ---
const availableCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY'];
const availableLanguages = [ { code: 'en', name: 'English'}, { code: 'es', name: 'Español'}, { code: 'fr', name: 'Français'} ];
const CLOUDINARY_CLOUD_NAME = 'dtawvcpwi'; // MOVE TO .env
const CLOUDINARY_UPLOAD_PRESET = 'Testing'; // MOVE TO .env


const SettingsPage = () => {
    const navigate = useNavigate();

    // --- State ---
    const [profileData, setProfileData] = useState({ fullName: '', email: '', recovery_email: '', profileImage: '', password: '' });
    const [budgetSettings, setBudgetSettings] = useState({ currency: '', expenseApproval: false }); // Default boolean
    const [uiSettings, setUiSettings] = useState({ language: '', darkMode: false }); // Ensure consistency (darkMode)
    const [categoryFormData, setCategoryFormData] = useState({ name: '' });
    const [categories, setCategories] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState({ profile: false, budget: false, ui: false, category: false });
    const [error, setError] = useState(null); // Global error
    const [sectionErrors, setSectionErrors] = useState({}); // Section-specific errors

    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');

    const [modalState, setModalState] = useState({ isCategoryModalOpen: false, isDeleteCategoryModalOpen: false, isRejectInviteModalOpen: false });
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [deletingItemType, setDeletingItemType] = useState('');

    // --- Animation Variants ---
    const sectionVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };
    const toggleSpring = { type: 'spring', stiffness: 700, damping: 30 };

    // --- Fetch Initial Data ---
    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSectionErrors({});
        try {
            // Fetch profile and other settings concurrently
            const [profile, fetchedCategories, fetchedInvites] = await Promise.all([
                getUserProfile(),
                getCategories(),
                getPendingInvitations() // Assuming this API exists
                 // TODO: Fetch UI Settings if stored separately
            ]);

            setProfileData(prev => ({ ...prev, fullName: profile.name || '', email: profile.email || '', recovery_email: profile.recovery_email || '', profileImage: profile.profileImage || '' }));
            setBudgetSettings(prev => ({ ...prev, currency: profile.currency_preference || '', expenseApproval: profile.expenseApproval || false }));
            setUiSettings(prev => ({ ...prev, language: profile.language || '', darkMode: profile.darkMode || false })); // Assuming language/darkMode are on user profile
            setImagePreviewUrl(profile.profileImage || '');
            setCategories(fetchedCategories || []); // Ensure it's an array
            setPendingInvitations(fetchedInvites || []); // Ensure it's an array

        } catch (err) {
            console.error("Failed to load settings data:", err);
            setError(err.message || 'Could not load settings.');
            // Optional: Redirect on severe auth errors
            // if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            //    localStorage.removeItem('token');
            //    navigate('/login', { replace: true });
            // }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]); // navigate is stable, so this effectively runs once

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // --- Modal Control ---
    const openModal = (modalName, item = null, itemType = '') => {
        setModalState(prev => ({ ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}), [modalName]: true }));
        setEditingCategory(itemType === 'category' ? item : null);
        // Use _id from MongoDB objects for deletion ID if available, otherwise fallback to id
        setDeletingItemId((itemType && item) ? (item._id || item.id) : null);
        setDeletingItemType(itemType || '');
        if (modalName === 'isCategoryModalOpen') { setCategoryFormData({ name: item?.name || '' }); }
    };    const closeModal = () => {
        setModalState(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
        setTimeout(() => { setEditingCategory(null); setDeletingItemId(null); setDeletingItemType(''); }, 300);
    };

    // --- Input Handlers ---
    const handleProfileChange = (e) => { const { name, value } = e.target; setProfileData(prev => ({ ...prev, [name]: value })); };
    const handleBudgetSettingChange = (e) => { const { name, value } = e.target; setBudgetSettings(prev => ({ ...prev, [name]: value })); }; // Select only
    const handleUiSettingChange = (e) => { const { name, value } = e.target; setUiSettings(prev => ({ ...prev, [name]: value })); }; // Select only
    const handleCategoryFormChange = (e) => { const { name, value } = e.target; setCategoryFormData(prev => ({ ...prev, [name]: value })); };
   const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImageFile(file);
            const reader = new FileReader(); reader.onloadend = () => { setImagePreviewUrl(reader.result); }; reader.readAsDataURL(file);
        } else { setSelectedImageFile(null); setImagePreviewUrl(profileData.profileImage || ''); if(file)  toast.success("Please select a valid image file."); }
    };

    // --- Action Handlers ---
  
    // --- Action Handlers ---
    // Generic save helper
    const handleGenericSave = async (sectionKey, apiCall, dataToSend, successMessage) => {
        setSectionErrors(prev => ({ ...prev, [sectionKey]: null })); // Clear previous error
        setIsSubmitting(prev => ({ ...prev, [sectionKey]: true }));
        try {
            await apiCall(dataToSend);
             toast.success(successMessage || "Settings saved!");
            // Optionally re-fetch profile if settings were part of it
            // await loadInitialData(); // Consider if needed, might cause flicker
        } catch (err) {
            console.error(`Failed to save ${sectionKey} settings:`, err);
            const errorMsg = err.message || `Could not save ${sectionKey} settings.`;
            setSectionErrors(prev => ({ ...prev, [sectionKey]: errorMsg }));
             toast.success(errorMsg);
        } finally {
            setIsSubmitting(prev => ({ ...prev, [sectionKey]: false }));
        }
    };

    const handleProfileSave = async () => {
        setSectionErrors(prev => ({ ...prev, profile: null }));
        setIsSubmitting(prev => ({ ...prev, profile: true }));
        let finalImageUrl = profileData.profileImage;

        try {
            if (selectedImageFile) {
                if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) throw new Error("Cloudinary config missing.");
                finalImageUrl = await uploadToCloudinary(selectedImageFile, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
            }
            const dataToSave = { name: profileData.fullName, recovery_email: profileData.recovery_email, profileImage: finalImageUrl, ...(profileData.password && { password: profileData.password }) };
            if (!dataToSave.name) throw new Error("Full Name cannot be empty.");

            const updatedProfile = await updateUserProfile(dataToSave);
            // Update local state fully from response
            setProfileData(prev => ({ ...prev, fullName: updatedProfile.name, recovery_email: updatedProfile.recovery_email, profileImage: updatedProfile.profileImage, password: '' }));
            setImagePreviewUrl(updatedProfile.profileImage || '');
            setSelectedImageFile(null);
             toast.success("Profile updated successfully!");
        } catch (err) {
             console.error("Failed to save profile:", err);
             const errorMsg = err.message || 'Could not save profile.';
             setSectionErrors(prev => ({ ...prev, profile: errorMsg }));
              toast.success(errorMsg);
        } finally {
            setIsSubmitting(prev => ({ ...prev, profile: false }));
        }
    };

    const handleBudgetSettingsSave = () => {
        handleGenericSave( 'budget', updateCurrencyPreference, { currency_preference: budgetSettings.currency, expenseApproval: budgetSettings.expenseApproval }, "Budget settings saved!");
    };

    const handleUiSettingsSave = (e) => {
        console.log("Saving UI Settings:", uiSettings); // Debugging line
        handleGenericSave('ui', updateUI, { darkMode: uiSettings.darkMode, language: uiSettings.language }, "UI settings saved!");

    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        const categoryName = categoryFormData.name.trim();
        if (!categoryName) {  toast.success("Category name cannot be empty."); return; }
        setSectionErrors(prev => ({...prev, category: null}));
        setIsSubmitting(prev => ({...prev, category: true}));
        const categoryId = editingCategory?._id; // Use _id from MongoDB object
        const apiCall = editingCategory ? updateCategory(categoryId, { name: categoryName }) : addCategory({ name: categoryName });
        try {
            const savedCategory = await apiCall;
            if (editingCategory) { setCategories(prev => prev.map(cat => cat._id === categoryId ? savedCategory : cat)); }
            else { setCategories(prev => [savedCategory, ...prev]); }
             toast.success(`Category ${editingCategory ? 'updated' : 'added'}!`);
            closeModal();
        } catch (err) {
             console.error(`Failed to ${editingCategory ? 'update' : 'add'} category:`, err);
             const errorMsg = err.message || `Failed to ${editingCategory ? 'update' : 'add'} category`;
             setSectionErrors(prev => ({...prev, category: errorMsg}));
              toast.success(errorMsg);
        } finally {
             setIsSubmitting(prev => ({...prev, category: false}));
        }
    };

    const confirmDelete = async () => { /* ... (keep logic, ensure deletingItemId uses _id if applicable) ... */
        if (!deletingItemId || !deletingItemType) return;
        setSectionErrors(prev => ({...prev, [deletingItemType]: null}));
        const itemDescription = deletingItemType.replace(/([A-Z])/g, ' $1').toLowerCase();

        try {
            if (deletingItemType === 'category') {
                await deleteCategory(deletingItemId); // Assumes deletingItemId is the _id
                setCategories(prev => prev.filter(cat => cat._id !== deletingItemId));
            } else if (deletingItemType === 'invitation') {
                await rejectInvitation(deletingItemId); // Assumes deletingItemId is the _id
                setPendingInvitations(prev => prev.filter(inv => inv.id !== deletingItemId)); // Keep using id if that's what the API returns/uses
            }
              toast.success(`${itemDescription.charAt(0).toUpperCase() + itemDescription.slice(1)} ${deletingItemType === 'invitation' ? 'rejected' : 'deleted'}!`);
            closeModal();
        } catch (err) {
             console.error(`Failed to delete/reject ${deletingItemType}:`, err);
             const errorMsg = err.message || `Failed action on ${itemDescription}`;
             setSectionErrors(prev => ({...prev, [deletingItemType]: errorMsg}));
              toast.success(errorMsg);
        }
    };
    const handleAcceptInvite = async (inviteId) => { /* ... (keep logic, use _id if applicable) ... */
         setSectionErrors(prev => ({...prev, invitation: null}));
        try {
            await acceptInvitation(inviteId); // Assumes inviteId is the _id
            setPendingInvitations(prev => prev.filter(inv => inv.id !== inviteId)); // Keep using id if that's what the API returns/uses for key
             toast.success(`Invitation accepted successfully!`);
        } catch (err) {
            console.error("Failed to accept invitation:", err);
            setSectionErrors(prev => ({...prev, invitation: err.message || 'Failed to accept invitation'}));
             toast.success(err.message || 'Failed to accept invitation.');
        }
    };

    const handleLogout = async () => { try { await logoutUser(); } catch (error) { console.error('Backend logout failed:', error); } finally { localStorage.removeItem('token');  toast.success("Logged out successfully!"); navigate('/login', { replace: true }); } };
    // --- Effects ---
     useEffect(() => { if (editingCategory && modalState.isCategoryModalOpen) { setCategoryFormData({ name: editingCategory.name }); } else if (!editingCategory && modalState.isCategoryModalOpen) { setCategoryFormData({ name: '' }); } }, [editingCategory, modalState.isCategoryModalOpen]);

    // --- Render ---
    if (isLoading) { return <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading Settings...</p></div>; }

    return (
    <>
        <Navbar />
        <div className="settings-page-container">
            <header className="settings-header">
                <div className="quick-links"><strong>Quick Links:</strong><a href="#profile">Profile</a><a href="#budget">Budget/Expense</a><a href="#ui">Appearance</a><a href="#pending">Invitations</a></div>
                <motion.button onClick={handleLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-logout">Log Out</motion.button>
            </header>
            {error && !isLoading && !Object.values(modalState).some(isOpen => isOpen) && <motion.div className="error-message global-error">{error}</motion.div>}

            {/* --- Edit Profile Section --- */}
            <motion.section id="profile" className="settings-section profile-section" initial="hidden" animate="visible" variants={sectionVariants}>
                <div className="section-header"><h2>Edit Profile</h2><motion.button onClick={handleProfileSave} disabled={isSubmitting.profile} className="button button-primary">{isSubmitting.profile ? 'Saving...' : 'Save Profile'}</motion.button></div>
                {sectionErrors.profile && <p className="error-message">{sectionErrors.profile}</p>}
                <div className="profile-picture-area">
                    <img src={imagePreviewUrl || 'https://via.placeholder.com/100'} alt="Profile Preview" className="profile-img"/>
                    <div className="profile-picture-controls">
                        <p>Profile Picture</p>
                        <input type="file" id="profileImageUpload" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} disabled={isSubmitting.profile}/>
                        <label htmlFor="profileImageUpload" className={`button button-secondary file-upload-label ${isSubmitting.profile ? 'disabled-button' : ''}`}>Choose Picture</label>
                    </div>
                </div>
                {/* ... Profile Form Inputs ... */}
                 <div className="form-group"><label htmlFor="fullName">Full Name</label><input type="text" id="fullName" name="fullName" className="input-field" required value={profileData.fullName} onChange={handleProfileChange} disabled={isSubmitting.profile}/></div>
                <div className="form-group"><label htmlFor="email">Email (Cannot be changed)</label><input type="email" id="email" name="email" className="input-field" value={profileData.email} readOnly disabled/></div>
                <div className="form-group"><label htmlFor="recovery_email">Recovery Email</label><input type="email" id="recovery_email" name="recovery_email" className="input-field" value={profileData.recovery_email} onChange={handleProfileChange} placeholder="Optional recovery email" disabled={isSubmitting.profile}/></div>
                <div className="form-group"><label htmlFor="password">New Password</label><input type="password" id="password" name="password" className="input-field" value={profileData.password} onChange={handleProfileChange} placeholder="Leave blank to keep current" disabled={isSubmitting.profile}/></div>
            </motion.section>

            {/* --- Budget and Expense Settings Section --- */}
            <motion.section id="budget" className="settings-section budget-section" initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.1 }}>
                 <div className="section-header"><h2>Budget & Expense Settings</h2><motion.button onClick={handleBudgetSettingsSave} disabled={isSubmitting.budget} className="button button-primary">{isSubmitting.budget ? 'Saving...' : 'Save Budget Settings'}</motion.button></div>
                 {sectionErrors.budget && <p className="error-message">{sectionErrors.budget}</p>}
                 {/* Updated value prop for currency */}
                 <div className="setting-row"><label htmlFor="currency">Currency</label><select id="currency" name="currency" className="select-field" value={budgetSettings.currency} onChange={(e) => setBudgetSettings(p=>({...p, currency: e.target.value}))} disabled={isSubmitting.budget}><option value="" disabled>-- Select --</option>{availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 {/* Updated onClick for toggle */}
                <div className="setting-row"><label>Expense Approval System</label><div className={`toggle-switch ${budgetSettings.expenseApproval ? 'active' : ''} ${isSubmitting.budget ? 'disabled-toggle' : ''}`} onClick={isSubmitting.budget ? null : () => setBudgetSettings(p=>({...p, expenseApproval: !p.expenseApproval}))}><motion.div className="toggle-knob" layout transition={toggleSpring} /></div></div>
                <div className="expense-categories">
                    <div className="categories-header"><h3>Expense Categories</h3><motion.button onClick={() => openModal('isCategoryModalOpen')} disabled={isSubmitting.category} className="button button-secondary">Add Category</motion.button></div>
                     {sectionErrors.category && <p className="error-message">{sectionErrors.category}</p>}
                    <div className="category-list">
                        <div className="category-row header-row"><div className="category-cell id-cell">ID</div><div className="category-cell name-cell">Name</div><div className="category-cell action-cell">Action</div></div>
                        <AnimatePresence>
                            {categories.map((category) => (
                                <motion.div layout key={category._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="category-row">
                                    <div className="category-cell id-cell">{category._id.slice(-6)}</div>
                                    <div className="category-cell name-cell">{category.name}</div>
                                    <div className="category-cell action-cell action-icons">
                                        <motion.button disabled={isSubmitting.category} onClick={() => openModal('isCategoryModalOpen', category, 'category')} whileTap={{ scale: 0.9 }} className="icon-button"><EditIcon size={14}/></motion.button>
                                        {/* Use category._id for deletion */}
                                        <motion.button disabled={isSubmitting.category} onClick={() => openModal('isDeleteCategoryModalOpen', category, 'category')} whileTap={{ scale: 0.9 }} className="icon-button"><DeleteIcon size={14}/></motion.button>
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
                 <div className="section-header"><h2>Appearance Settings</h2><motion.button onClick={handleUiSettingsSave} disabled={isSubmitting.ui} className="button button-primary">{isSubmitting.ui ? 'Saving...' : 'Save Appearance'}</motion.button></div>
                 {sectionErrors.ui && <p className="error-message">{sectionErrors.ui}</p>}
                <div className="setting-row"><label htmlFor="language">Language</label><select id="language" name="language" className="select-field" value={uiSettings.language} onChange={(e) => setUiSettings(p=>({...p, language: e.target.value}))} disabled={isSubmitting.ui}><option value="" disabled>-- Select --</option>{availableLanguages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
                {/* Use uiSettings.darkMode for value and setter */}
                <div className="setting-row"><label>Dark Mode</label><div className={`toggle-switch ${uiSettings.darkMode ? 'active' : ''} ${isSubmitting.ui ? 'disabled-toggle' : ''}`} onClick={isSubmitting.ui ? null : () => setUiSettings(p=>({...p, darkMode: !p.darkMode}))}><motion.div className="toggle-knob" layout transition={toggleSpring} /></div></div>
            </motion.section>

            {/* --- Pending Invitations Section --- */}
            <motion.section id="pending" className="settings-section pending-invitations-section" initial="hidden" animate="visible" variants={sectionVariants} transition={{ delay: 0.3 }}>
                 <div className="section-header no-button"><h2>Pending Invitations</h2></div>
                 {sectionErrors.invitation && <p className="error-message">{sectionErrors.invitation}</p>}
                 <div className="invitations-list">
                    <AnimatePresence>
                        {pendingInvitations.length === 0 ? ( <motion.p variants={itemVariants} className="no-data-message">No pending invitations.</motion.p> ) : (
                            pendingInvitations.map((invite) => (
                                <motion.div layout key={invite.id} className="invitation-card" initial="hidden" animate="visible" exit={{ opacity: 0, x: -50 }} variants={itemVariants}>
                                    {/* Use invite._id if that's the unique key from API */}
                                    <div className="invitation-details"><h4 className="invitation-title">{invite.plan_name || invite.type}</h4><p className="invitation-sender">From: {invite.inviter_name || invite.from}</p><p className="invitation-role">Role: {invite.role_assigned}</p><p className="invitation-status">Received: {new Date(invite.created_at || Date.now()).toLocaleDateString()}</p></div>
                                    <div className="invitation-actions">
                                        <motion.button onClick={() => handleAcceptInvite(invite.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="button button-accept">Accept</motion.button>
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
        <Modal isOpen={modalState.isCategoryModalOpen} onClose={closeModal} title={editingCategory ? "Edit Category" : "Add New Category"}>
            <form onSubmit={handleCategorySubmit} className="modal-form">
                 {editingCategory && (<div className="form-group"><label>Category ID</label><input type="text" value={editingCategory._id} className="input-field" readOnly disabled/></div>)}
                 <div className="form-group"><label htmlFor="cat-name">Category Name</label><input type="text" id="cat-name" name="name" required className="input-field" value={categoryFormData.name} onChange={handleCategoryFormChange} placeholder="e.g., Groceries"/></div>
                 {sectionErrors.category && <p className="error-message modal-error">{sectionErrors.category}</p>}
                 <div className="form-actions"><motion.button type="button" className="secondary-button" onClick={closeModal} disabled={isSubmitting.category}>Cancel</motion.button><motion.button type="submit" className="primary-button" disabled={isSubmitting.category} whileTap={{ scale: 0.95 }}>{isSubmitting.category ? 'Saving...' : (editingCategory ? "Save Changes" : "Add Category")}</motion.button></div>
            </form>
        </Modal>
         <Modal isOpen={modalState.isDeleteCategoryModalOpen} onClose={closeModal} title="Confirm Delete Category">
            <div className="confirmation-text">Are you sure you want to delete the category: <strong>{categories.find(c=>c._id === deletingItemId)?.name || deletingItemId}</strong>?</div> {/* Use _id */}
            <div className="confirmation-actions"><motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button><motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDelete} whileTap={{ scale: 0.95 }}>Delete Category</motion.button></div>
        </Modal>
         <Modal isOpen={modalState.isRejectInviteModalOpen} onClose={closeModal} title="Confirm Reject Invitation">
             <div className="confirmation-text">Are you sure you want to reject the invitation from <strong>{pendingInvitations.find(inv => inv.id === deletingItemId)?.inviter_name || 'this user'}</strong>?</div>{/* Use id */}
             <div className="confirmation-actions"><motion.button type="button" className="secondary-button" onClick={closeModal} whileTap={{ scale: 0.95 }}>Cancel</motion.button><motion.button type="button" className="primary-button delete-confirm-button" onClick={confirmDelete} whileTap={{ scale: 0.95 }}>Reject Invitation</motion.button></div>
        </Modal>

        <Footer />
    </>
    );
};

export default SettingsPage;