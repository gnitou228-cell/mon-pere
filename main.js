document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       NAVBAR SCROLL EFFECT
       ========================================================================== */
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* ==========================================================================
       MOBILE MENU TOGGLE
       ========================================================================== */
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.classList.remove('ph-list');
            icon.classList.add('ph-x');
        } else {
            icon.classList.remove('ph-x');
            icon.classList.add('ph-list');
        }
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const icon = menuToggle.querySelector('i');
            icon.classList.remove('ph-x');
            icon.classList.add('ph-list');
        });
    });

    /* ==========================================================================
       FAQ ACCORDION
       ========================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other open items
            const currentActive = document.querySelector('.faq-item.active');
            if (currentActive && currentActive !== item) {
                currentActive.classList.remove('active');
            }
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    /* ==========================================================================
       SCROLL ANIMATIONS (INTERSECTION OBSERVER)
       ========================================================================== */
    // Add fade-up class to elements we want to animate
    const animatableElements = document.querySelectorAll(
        '.section-header, .step-card, .feature-card, .result-item, .price-card, .testimonial-card, .faq-item'
    );
    
    animatableElements.forEach(el => el.classList.add('fade-up'));

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated
                // observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    animatableElements.forEach(el => observer.observe(el));
});
