/**
 * main.js — Entry point
 *
 * Responsibilities:
 *  - Import all other modules
 *  - Attach UI event listeners
 *  - Coordinate state ↔ scheduler ↔ simulation ↔ visualization
 *
 * This file contains NO business logic (no scheduling, no math).
 * Phase 1: wire up algorithm card selection + basic UI chrome.
 */

import { initUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initUI();
});
