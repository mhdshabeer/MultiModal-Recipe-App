document.addEventListener('DOMContentLoaded', function() {
    console.log('Recipe App Initialized');
    
    // Theme toggle functionality
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const icon = themeToggleBtn.querySelector('i');
    
    // Check for saved theme preference or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        themeToggleBtn.className = `btn btn-outline-${theme === 'dark' ? 'light' : 'dark'} me-3`;
    }

    // Helper function to get URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Helper function to set up keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(event) {
            // Check what page we're on
            const isRecipePage = document.querySelector('.recipe-detail') !== null;
            
            if (isRecipePage) {
                const nextStepBtn = document.getElementById('nextStepBtn');
                const prevStepBtn = document.getElementById('prevStepBtn');
                const readInstructionsBtn = document.getElementById('readInstructionsBtn');
                const pauseInstructionsBtn = document.getElementById('pauseInstructionsBtn');
                
                switch (event.key) {
                    // Right arrow key for next step
                    case 'ArrowRight':
                        if (nextStepBtn && !nextStepBtn.disabled) {
                            nextStepBtn.click();
                        }
                        break;
                    
                    // Left arrow key for previous step
                    case 'ArrowLeft':
                        if (prevStepBtn && !prevStepBtn.disabled) {
                            prevStepBtn.click();
                        }
                        break;
                    
                    // Space to start/pause reading
                    case ' ':
                        if (readInstructionsBtn && !readInstructionsBtn.classList.contains('d-none')) {
                            readInstructionsBtn.click();
                        } else if (pauseInstructionsBtn && !pauseInstructionsBtn.classList.contains('d-none')) {
                            pauseInstructionsBtn.click();
                        }
                        break;
                }
            }
        });
    }

    // Set up application-wide features
    setupKeyboardShortcuts();

    // Handle pre-filling search from URL parameters
    const searchQuery = getUrlParameter('query');
    if (searchQuery && document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = searchQuery;
        document.getElementById('searchButton').click();
    }
});
