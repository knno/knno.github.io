// @desc auto theme detection
function applyThemeAuto() {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.setAttribute("data-bs-theme", "dark");
    } else {
        document.body.setAttribute("data-bs-theme", "light");
    }
}

// Helper to convert header text to a URL-friendly slug
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

document.addEventListener("DOMContentLoaded", async () => {
    // Set current year
    document.getElementById('current-year').textContent = new Date().getFullYear();
    applyThemeAuto();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyThemeAuto);

    // ----------------------------------------------------
    // Extract the slug from the URL with local testing fallbacks
    // Priority 1: Query parameter (e.g., ?post=post-slug)
    // Priority 2: Hash routing (e.g., /#/post-slug)
    // Priority 3: Pathname (e.g., /post-slug)
    // ----------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    let path = params.get('post');
    
    if (!path) {
        // Fallback to hash routing (remove leading # and /)
        if (window.location.hash && window.location.hash.length > 1) {
            path = window.location.hash.replace(/^#\/?/, '');
        } else {
            // Fallback to standard pathname
            path = window.location.pathname.replace(/(^\/+)|(\/+$)|(\/+[\?\#\\\/].*)/g, '');
        }
    }

    // 1. Remove "index.html" (helps with local testing)
    path = path.replace(/index\.html$/, '');
    
    // 2. Strip any dangling query params or hash fragments from the string
    path = path.split('?')[0].split('#')[0];
    
    // 3. Strip ALL leading and ALL trailing slashes (fixes "slug/" or "slug//")
    path = path.replace(/(^\/+)|(\/+$)|(\/+[\?\#\\\/].*)/g, '');

    // 4. Decode URI components just in case (e.g., %20 to space)
    try {
        path = decodeURIComponent(path);
    } catch (e) {
        console.warn("Could not decode path string.");
    }

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
        `/blog/posts/${path}.md`,
        `/blog/posts/${path}/post.md`
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

        // Style tables
        const tables = container.querySelectorAll('table');
        tables.forEach(table => {
            // Removed 'table-hover' so the entire row doesn't highlight
            table.classList.add('table', 'table-bordered', 'table-striped');
            
            const wrapper = document.createElement('div');
            wrapper.classList.add('table-responsive', 'mb-4'); 
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });

        // Sidenav
        const tocContainer = document.getElementById('toc-container');
        const headings = container.querySelectorAll('h2, h3'); // Target H2 and H3 for the side nav
        
        if (headings.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'nav flex-column ms-0 ps-0';
            
            headings.forEach((heading, index) => {
                // Generate slugified ID from header text
                const baseSlug = slugify(heading.textContent);
                // Append index to guarantee uniqueness if two headers have the exact same text
                const id = heading.id || (baseSlug ? `${baseSlug}-${index}` : `heading-${index}`);
                heading.id = id;
                
                const li = document.createElement('li');
                li.className = 'nav-item mb-2';
                
                // Indent H3 tags slightly to show hierarchy
                const isSubHeading = heading.tagName.toLowerCase() === 'h3';
                const paddingClass = isSubHeading ? 'ms-3' : '';
                
                const a = document.createElement('a');
                // Added 'toc-link' class so the scrollspy querySelector finds it
                a.className = `text-decoration-none text-secondary toc-link ${paddingClass}`;
                a.href = `#${id}`;
                a.textContent = heading.textContent;
                
                // Change color on hover
                a.addEventListener('mouseenter', () => {
                    if (!a.classList.contains('fw-bold')) {
                        a.classList.replace('text-secondary', 'text-tertiary');
                    }
                });
                a.addEventListener('mouseleave', () => {
                    if (!a.classList.contains('fw-bold')) {
                        a.classList.replace('text-tertiary', 'text-secondary');
                    }
                });
                
                li.appendChild(a);
                ul.appendChild(li);
            });
            tocContainer.appendChild(ul);
            
            // Add Scroll to Top button at the bottom of the sidenav
            const scrollTopBtn = document.createElement('a');
            scrollTopBtn.href = '#';
            scrollTopBtn.className = 'd-block mt-4 text-decoration-none text-secondary small';
            scrollTopBtn.innerHTML = '&uarr; Scroll to Top';
            scrollTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Optional: remove hash from URL when scrolling to top
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
            });
            tocContainer.appendChild(scrollTopBtn);

            // Sidenav > Scrollspy
            const tocLinks = tocContainer.querySelectorAll('.toc-link');
            const onScroll = () => {
                // Default to the first heading so it never loses highlight at the top
                let currentHeading = headings.length > 0 ? headings[0].id : '';

                headings.forEach(heading => {
                    const rect = heading.getBoundingClientRect();
                    // 150px threshold accounts for top spacing/sticky nav
                    if (rect.top <= 150) {
                        currentHeading = heading.id;
                    }
                });

                // Update link classes based on the current heading in view
                tocLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${currentHeading}`) {
                        link.classList.remove('text-secondary');
                        link.classList.add('text-tertiary', 'fw-bold'); 
                    } else {
                        link.classList.remove('text-tertiary', 'fw-bold');
                        link.classList.add('text-secondary');
                    }
                });
            };
            window.addEventListener('scroll', onScroll);
            onScroll(); // Trigger once on load to set initial state

        } else {
            tocContainer.innerHTML = '<span class="text-muted small">No sections available.</span>';
        }

        // Dynamically update the document <title> based on the first <h1> in the markdown
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