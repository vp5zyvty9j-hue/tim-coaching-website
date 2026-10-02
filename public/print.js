// Print action for the legal document pages.
// Kept in an external file because the Content-Security-Policy only allows
// same-origin scripts and no inline event handlers.
for (const button of document.querySelectorAll('[data-print]')) {
  button.addEventListener('click', () => window.print());
}
