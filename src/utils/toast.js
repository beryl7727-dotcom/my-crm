// Simple toast notification utility
const toastContainer = () => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(container);
  }
  return container;
};

const createToastElement = (message, type) => {
  const toast = document.createElement('div');
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type];

  toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in`;
  toast.textContent = message;

  return toast;
};

export const toast = {
  success: (message) => {
    const container = toastContainer();
    const element = createToastElement(message, 'success');
    container.appendChild(element);
    setTimeout(() => element.remove(), 3000);
  },
  error: (message) => {
    const container = toastContainer();
    const element = createToastElement(message, 'error');
    container.appendChild(element);
    setTimeout(() => element.remove(), 4000);
  },
  warning: (message) => {
    const container = toastContainer();
    const element = createToastElement(message, 'warning');
    container.appendChild(element);
    setTimeout(() => element.remove(), 3000);
  },
  info: (message) => {
    const container = toastContainer();
    const element = createToastElement(message, 'info');
    container.appendChild(element);
    setTimeout(() => element.remove(), 3000);
  },
};
