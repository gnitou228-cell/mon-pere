document.addEventListener('DOMContentLoaded', async () => {
    /* ==========================================================================
       SUPABASE CONFIGURATION
       ========================================================================== */
    const SUPABASE_URL = 'https://VOTRE_PROJET.supabase.co';
    const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON';

    let supabase;
    if (SUPABASE_URL !== 'https://VOTRE_PROJET.supabase.co') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Mode démo : Supabase non configuré.");
    }

    /* ==========================================================================
       AUTH & USER DATA
       ========================================================================== */
    const displayNameEl = document.getElementById('user-display-name');
    const welcomeMessageEl = document.getElementById('welcome-message');

    if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!session) {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
            return;
        }

        const user = session.user;
        const metadata = user.user_metadata || {};
        
        let firstName = metadata.first_name || '';
        let emailOrPhone = user.email || user.phone || 'Utilisateur';

        if (firstName) {
            welcomeMessageEl.innerHTML = `Bonjour ${firstName} 👋`;
            displayNameEl.textContent = firstName;
        } else {
            welcomeMessageEl.innerHTML = `Bonjour 👋`;
            displayNameEl.textContent = emailOrPhone;
        }

        // Handle Logout
        const btnLogout = document.getElementById('btn-logout-dash');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            });
        }
    } else {
        // Mode démo : Mock user data
        welcomeMessageEl.innerHTML = `Bonjour Visiteur 👋`;
        displayNameEl.textContent = "Mode Démo";
        
        const btnLogout = document.getElementById('btn-logout-dash');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }

    /* ==========================================================================
       MOBILE SIDEBAR TOGGLE
       ========================================================================== */
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    if (openSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
});
