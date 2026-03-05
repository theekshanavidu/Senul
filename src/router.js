export const router = {
    init: () => {
        window.addEventListener('hashchange', router.handleLocation);
        // Initial load
        router.handleLocation();
    },

    navigate: (path) => {
        window.location.hash = path;
    },

    handleLocation: () => {
        let path = window.location.hash.replace('#', '') || 'login';

        // Allowed paths
        const routes = ['login', 'register', 'dashboard', 'admin'];
        if (!routes.includes(path)) {
            path = 'login';
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });

        // Show header only if not login
        const header = document.getElementById('app-header');
        if (path === 'login' || path === 'register') {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }

        // Show active view
        const activeView = document.getElementById(`view-${path}`);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('active');
        }

        // Custom events based on path (triggered in main.js to load data)
        const event = new CustomEvent('routeChanged', { detail: { path } });
        window.dispatchEvent(event);
    }
};
