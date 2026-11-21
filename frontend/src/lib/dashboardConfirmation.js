const CONFIRM_EVENT = 'dashboard:confirm-action';

/** Show the dashboard's styled confirmation dialog and resolve with the user's choice. */
export function confirmDashboardAction(message, options = {}) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, {
      detail: {
        message,
        title: options.title || 'Please confirm',
        confirmLabel: options.confirmLabel || 'Confirm',
        danger: Boolean(options.danger),
        resolve,
      },
    }));
  });
}

export { CONFIRM_EVENT };
