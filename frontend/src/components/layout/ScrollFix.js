/**
 * Global scroll fix component
 * This component injects CSS fixes to ensure proper scrolling works throughout the application
 */
import React, { useEffect } from 'react';

const ScrollFix = () => {
  useEffect(() => {
    // Apply global scroll fixes when component mounts
    const style = document.createElement('style');
    style.textContent = `
      /* Critical scroll fixes */
      body, html, #root {
        min-height: 100%;
        height: auto !important;
        overflow-y: auto !important;
        overflow-x: hidden;
      }
      
      /* Overscroll color - multiple approaches to ensure it works */
      html {
        background-color: #f5f5f5 !important; /* Light gray overscroll */
      }
      
      /* For dark mode support */
      [data-mui-color-scheme="dark"] html {
        background-color: #121212 !important; /* Dark gray for dark mode */
      }
      
      /* Alternative approach for browsers that need it */
      :root {
        background-color: #f5f5f5 !important;
      }
      
      [data-mui-color-scheme="dark"] :root {
        background-color: #121212 !important;
      }
      
      /* Override any other background colors that might interfere */
      body {
        background-color: transparent !important;
      }
      
      /* Fix for MUI containers that might block scrolling */
      .MuiBox-root, .MuiContainer-root, .MuiPaper-root {
        max-height: none !important;
        overflow: visible !important;
      }
      
      /* Fix for main content area */
      main {
        overflow-y: auto !important;
        min-height: calc(100vh - 64px);
        padding-bottom: 2rem !important;
      }
      
      /* Ensure inputs and select boxes are properly accessible */
      .MuiFormControl-root {
        margin-bottom: 12px !important;
      }
      
      /* Improve dropdown visibility */
      .MuiMenuItem-root {
        padding: 12px 16px !important;
      }
      
      /* Better form layout */
      form {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      // Clean up when component unmounts
      document.head.removeChild(style);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default ScrollFix;
