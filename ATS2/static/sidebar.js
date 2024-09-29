document.addEventListener('DOMContentLoaded', function () {
    var menuButton = document.getElementById('menu-button');
    var menuList = document.getElementById('menu-list');

    menuButton.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent the click from bubbling up
        if (menuList.style.display === 'block') {
            menuList.style.display = 'none';
            menuButton.setAttribute('aria-expanded', 'false');
        } else {
            menuList.style.display = 'block';
            menuButton.setAttribute('aria-expanded', 'true');
        }
    });

    // Close the menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!menuList.contains(event.target) && !menuButton.contains(event.target)) {
            menuList.style.display = 'none';
            menuButton.setAttribute('aria-expanded', 'false');
        }
    });
});
