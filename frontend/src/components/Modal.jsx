import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/Modal.css'; // We'll create this CSS file

// Basic Close Icon (replace with SVG if preferred)
const CloseIcon = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


const Modal = ({ isOpen, onClose, children, title }) => {

    // Handle Escape key press
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }

        // Cleanup function
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]); // Rerun effect if isOpen or onClose changes


    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const modalVariants = {
        hidden: { opacity: 0, y: -30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
        exit: { opacity: 0, y: 30, scale: 0.95 }
    };


    return (
        <AnimatePresence mode="wait"> {/* 'wait' ensures exit anim completes before enter */}
            {isOpen && (
                <motion.div
                    className="modal-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose} // Close when clicking backdrop
                >
                    <motion.div
                        className="modal-content"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? "modal-title" : undefined} // Add aria-labelledby if title exists
                    >
                        {title && (
                            <div className="modal-header">
                                <h3 id="modal-title">{title}</h3>
                                <button onClick={onClose} className="modal-close-button" aria-label="Close modal">
                                    <CloseIcon />
                                </button>
                            </div>
                        )}
                        <div className="modal-body">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;