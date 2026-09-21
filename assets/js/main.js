// @desc auto theme detection
function applyThemeAuto() {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.body.setAttribute("data-bs-theme", "dark");
    } else {
    document.body.setAttribute("data-bs-theme", "light");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Set current year
    document.getElementById('current-year').textContent = new Date().getFullYear();
    applyThemeAuto();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyThemeAuto);

    // Extract the slug from the URL (e.g., "post-slug" from "/post-slug" or "/post-slug/")
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    const container = document.getElementById('markdown-container');

    if (!path) {
        container.innerHTML = '<h1 class="mb-3">Home</h1><p class="lead mb-4">Welcome to the root page.</p>';
        document.title = "Home";
        return;
    }

    // Configure Marked.js for GitHub Flavored Markdown and code highlighting
    marked.setOptions({
        gfm: true,
        breaks: true,
        highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
        }
    });

    // Define the file paths to try based on your priority
    const endpoints = [
        `/blog/src/${path}.md`,
        `/blog/src/${path}/post.md`
    ];

    let markdownContent = null;

    // Try fetching the endpoints sequentially
    for (const url of endpoints) {
        try {
        const response = await fetch(url);
        if (response.ok) {
            markdownContent = await response.text();
            break; 
        }
        } catch (error) {
        console.warn(`Failed to load ${url}`);
        }
    }

    // Render the result
    if (markdownContent) {
        container.innerHTML = marked.parse(markdownContent);
        
        // Optional: Dynamically update the document <title> based on the first <h1> in the markdown
        const firstHeading = container.querySelector('h1');
        if (firstHeading) {
        document.title = firstHeading.textContent;
        }
    } else {
        // Fallback if neither markdown file exists
        container.innerHTML = '<h1 class="mb-3">404 - Not Found</h1><p class="lead mb-4">The post you are looking for does not exist.</p>';
        document.title = "404 Not Found";
    }
});
