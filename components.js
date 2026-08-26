document.querySelectorAll('[data-component]').forEach(async (placeholder) => {
    const component = placeholder.dataset.component;
    const response = await fetch(`${component}.html`);

    if (!response.ok) {
        throw new Error(`Unable to load component: ${component}`);
    }

    placeholder.outerHTML = await response.text();
});
