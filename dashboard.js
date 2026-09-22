document.addEventListener('DOMContentLoaded', async () => {
    /* ==========================================================================
       1. CONFIGURATION SUPABASE
       ========================================================================== */
    const SUPABASE_URL = window.ENV ? window.ENV.SUPABASE_URL : 'https://VOTRE_PROJET.supabase.co';
    const SUPABASE_ANON_KEY = window.ENV ? window.ENV.SUPABASE_ANON_KEY : 'VOTRE_CLE_ANON';

    let supabase;
    if (SUPABASE_URL !== 'https://VOTRE_PROJET.supabase.co') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Mode démo : Supabase non configuré.");
        return; // Stoppe l'exécution si pas configuré pour éviter les erreurs
    }

    /* ==========================================================================
       2. VÉRIFICATION DE SESSION (ROUTES PROTÉGÉES)
       ========================================================================== */
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session) {
        // Redirection forcée si l'utilisateur n'est pas connecté
        window.location.href = 'index.html';
        return;
    }

    const user = session.user;
    
    /* ==========================================================================
       3. GESTION DU ROUTING SPA (Navigation)
       ========================================================================== */
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const views = document.querySelectorAll('.view-section');
    const sidebar = document.getElementById('sidebar');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            
            // Retirer active de tous les liens
            navItems.forEach(n => n.classList.remove('active'));
            // Cacher toutes les vues
            views.forEach(v => v.classList.remove('active'));
            
            // Activer le lien et la vue cible
            item.classList.add('active');
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');

            // Sur mobile, fermer la sidebar après un clic
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
            
            // Optionnel : Re-fetch certaines données quand on entre sur la vue
            if (targetId === 'view-matches') fetchMatches();
            if (targetId === 'view-predictions') fetchPredictions();
        });
    });

    // Mobile sidebar toggle
    document.getElementById('open-sidebar')?.addEventListener('click', () => sidebar.classList.add('active'));
    document.getElementById('close-sidebar')?.addEventListener('click', () => sidebar.classList.remove('active'));

    // Déconnexion
    document.getElementById('btn-logout-dash')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    /* ==========================================================================
       4. CHARGEMENT DES DONNÉES UTILISATEUR (Profil)
       ========================================================================== */
    async function loadUserProfile() {
        const displayNameEl = document.getElementById('user-display-name');
        const welcomeMessageEl = document.getElementById('welcome-message');
        
        let firstName = user.user_metadata?.first_name || '';
        let lastName = user.user_metadata?.last_name || '';
        let whatsapp = user.user_metadata?.whatsapp || '';
        
        // Tenter de récupérer depuis la table profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            firstName = profile.first_name || firstName;
            lastName = profile.last_name || lastName;
            whatsapp = profile.whatsapp || whatsapp;
        }

        // MAJ UI
        const displayName = firstName || user.email || user.phone || 'Utilisateur';
        displayNameEl.textContent = displayName;
        welcomeMessageEl.innerHTML = `Bonjour ${displayName} 👋`;

        // Remplir le formulaire Profil
        document.getElementById('profile-firstname').value = firstName;
        document.getElementById('profile-lastname').value = lastName;
        document.getElementById('profile-email').value = user.email || 'Non défini';
        document.getElementById('profile-whatsapp').value = whatsapp;
    }

    // Gestion du formulaire de mise à jour du profil
    const profileForm = document.getElementById('form-update-profile');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgEl = document.getElementById('profile-msg');
            const submitBtn = profileForm.querySelector('button');
            
            submitBtn.disabled = true;
            submitBtn.textContent = "Mise à jour...";
            msgEl.style.display = 'none';
            msgEl.className = '';

            const updates = {
                first_name: document.getElementById('profile-firstname').value,
                last_name: document.getElementById('profile-lastname').value,
                whatsapp: document.getElementById('profile-whatsapp').value,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) {
                msgEl.textContent = "Erreur : " + error.message;
                msgEl.style.color = "red";
                msgEl.style.display = 'block';
            } else {
                msgEl.textContent = "Profil mis à jour avec succès !";
                msgEl.style.color = "green";
                msgEl.style.display = 'block';
                // Recharger les infos du haut
                loadUserProfile();
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = "Enregistrer les modifications";
        });
    }

    /* ==========================================================================
       5. CHARGEMENT DES DONNÉES SPORTIVES & STATS (Dashboard)
       ========================================================================== */
    
    // Fonction utilitaire pour rendre un Empty State
    const renderEmptyState = (icon, message) => `
        <div class="empty-state glass-panel">
            <i class="ph ${icon}"></i>
            <p>${message}</p>
        </div>
    `;

    async function loadDashboardStats() {
        // Dans une vraie app, on compterait les matchs du jour
        // Pour l'instant, on interroge la table 'matches'
        const { count: matchesCount, error: matchesError } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true });
            
        const { count: notifsCount, error: notifsError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);
            
        // Si les tables n'existent pas encore, count renverra une erreur ou 0
        const mCount = matchesError ? 0 : (matchesCount || 0);
        const nCount = notifsError ? 0 : (notifsCount || 0);

        document.getElementById('stat-predictions').textContent = mCount;
        document.getElementById('stat-notifs').textContent = nCount;
        
        // Mettre à jour les badges
        const notifBadge = document.getElementById('badge-notif');
        if (nCount > 0) {
            notifBadge.textContent = nCount;
            notifBadge.style.display = 'inline-block';
        }
    }

    async function fetchMatches() {
        const containerDash = document.getElementById('dashboard-matches-container');
        const containerFull = document.getElementById('full-matches-container');
        
        // Loader
        const loader = `<div style="text-align:center; padding: 2rem;"><i class="ph ph-spinner ph-spin" style="font-size:2rem;"></i></div>`;
        if (containerDash) containerDash.innerHTML = loader;
        if (containerFull) containerFull.innerHTML = loader;

        const { data: matches, error } = await supabase
            .from('matches')
            .select('*')
            .order('start_time', { ascending: true })
            .limit(10);

        if (error || !matches || matches.length === 0) {
            const empty = renderEmptyState('ph-soccer-ball', "Aucun match programmé aujourd'hui.");
            if (containerDash) containerDash.innerHTML = empty;
            if (containerFull) containerFull.innerHTML = empty;
            return;
        }

        // Render HTML for matches
        let html = '';
        matches.forEach(m => {
            const isLive = m.status === '1H' || m.status === '2H' || m.status === 'HT' || m.status === 'LIVE';
            const isFinished = m.status === 'FT' || m.status === 'AET' || m.status === 'PEN';
            const statusBadge = isLive ? `<span class="badge bg-danger">EN DIRECT</span>` : (isFinished ? `<span class="badge bg-secondary">Terminé</span>` : `<span class="time"><i class="ph ph-clock"></i> ${new Date(m.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`);
            
            const scoreDisplay = (isLive || isFinished) ? `<div class="score" style="font-size: 1.5rem; font-weight: 800; color: var(--c-primary); margin: 0 1rem;">${m.score_home} - ${m.score_away}</div>` : `<div class="vs" style="margin: 0 1rem;">VS</div>`;
            
            const compLogo = m.competition_logo ? `<img src="${m.competition_logo}" style="width: 16px; height: 16px; margin-right: 4px;" alt="logo">` : `<i class="ph-fill ph-trophy"></i>`;
            const homeLogo = m.team_home_logo ? `<img src="${m.team_home_logo}" style="width: 30px; height: 30px; margin-bottom: 5px; border-radius: 50%;" alt="home logo"><br>` : '';
            const awayLogo = m.team_away_logo ? `<img src="${m.team_away_logo}" style="width: 30px; height: 30px; margin-bottom: 5px; border-radius: 50%;" alt="away logo"><br>` : '';

            html += `
                <div class="match-card glass-panel" style="position: relative; overflow: hidden;">
                    ${isLive ? '<div style="position: absolute; top:0; left:0; width: 100%; height: 3px; background: var(--c-danger); animation: pulse 2s infinite;"></div>' : ''}
                    <div class="match-header">
                        <span class="competition" style="display:flex; align-items:center;">${compLogo} ${m.competition || 'Compétition'}</span>
                        ${statusBadge}
                    </div>
                    <div class="match-teams" style="display: flex; align-items: center; justify-content: space-between; text-align: center; margin: 1.5rem 0;">
                        <div class="team" style="flex:1;">
                            ${homeLogo}
                            <span class="team-name" style="font-weight: 700;">${m.team_home}</span>
                        </div>
                        ${scoreDisplay}
                        <div class="team" style="flex:1;">
                            ${awayLogo}
                            <span class="team-name" style="font-weight: 700;">${m.team_away}</span>
                        </div>
                    </div>
                    <div class="match-actions" style="display: flex; gap: 1rem;">
                        <button class="btn btn-outline btn-sm w-100" onclick="alert('Analyse bientôt disponible')"><i class="ph ph-chart-pie-slice"></i> Analyse</button>
                        <button class="btn btn-primary btn-sm w-100" onclick="alert('Fonction d\\'ajout au coupon en développement')"><i class="ph ph-plus"></i> Au coupon</button>
                    </div>
                </div>
            `;
        });

        if (containerDash) containerDash.innerHTML = html;
        if (containerFull) containerFull.innerHTML = html;
    }

    async function fetchPredictions() {
        const container = document.getElementById('predictions-container');
        
        const { data: preds, error } = await supabase
            .from('predictions')
            .select('*, matches(team_home, team_away)')
            .limit(10);
            
        if (error || !preds || preds.length === 0) {
            container.innerHTML = renderEmptyState('ph-chart-line-up', "Les prédictions de l'IA sont en cours de génération pour les prochains matchs.");
            return;
        }
        
        // Logique similaire de rendu à implémenter plus tard
    }

    // Initialisation
    loadUserProfile();
    loadDashboardStats();
    fetchMatches(); // Charge les matchs du dashboard par défaut

});
