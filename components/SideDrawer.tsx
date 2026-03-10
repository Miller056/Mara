
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef } from 'react';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
}

const SideDrawer = ({ isOpen, onClose, title, children }: SideDrawerProps) => {
    const drawerRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    // Trap focus inside the drawer when open
    useEffect(() => {
        if (isOpen) {
            const originalFocus = document.activeElement as HTMLElement;
            closeBtnRef.current?.focus();

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'Tab') {
                    const focusableElements = drawerRef.current?.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (!focusableElements) return;
                    
                    const firstElement = focusableElements[0] as HTMLElement;
                    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                originalFocus?.focus();
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="drawer-overlay" 
            onClick={onClose}
            role="presentation"
        >
            <div 
                ref={drawerRef}
                className="drawer-content" 
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-title"
            >
                <div className="drawer-header">
                    <h2 id="drawer-title">{title}</h2>
                    <button 
                        ref={closeBtnRef}
                        onClick={onClose} 
                        className="close-button"
                        aria-label="Close drawer"
                    >
                        &times;
                    </button>
                </div>
                <div className="drawer-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SideDrawer;
