/**
 * @fileoverview Card Renderer Module
 * Responsible for generating HTML markup for project cards and list items.
 */

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string.
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates the source code URL for a project.
 * @param {string} link - The relative link to the project.
 * @returns {string} The absolute GitHub URL.
 */
function getSourceCodeUrl(link) {
    if (!link) return 'https://github.com/YadavAkhileshh/OpenPlayground';

    let path = link;
    // Remove leading ./
    if (path.startsWith('./')) {
        path = path.slice(2);
    }
    // Remove trailing /index.html or index.html
    path = path.replace(/\/index\.html$/, '').replace(/^index\.html$/, '');

    return `https://github.com/YadavAkhileshh/OpenPlayground/tree/main/${path}`;
}

/**
 * Generates HTML for a project card.
 * @param {Object} project - The project data object.
 * @returns {string} The HTML string for the project card.
 */
export function createProjectCard(project) {
    const isBookmarked = window.bookmarksManager?.isBookmarked(project.title);
    const techHtml = project.tech?.map(t => `<span>${escapeHtml(t)}</span>`).join('') || '';
    const coverStyle = project.coverStyle || '';
    const coverClass = project.coverClass || '';
    const sourceUrl = getSourceCodeUrl(project.link);

    // Note: We're using onclick handlers here to maintain compatibility with existing global functions
    // but ideally these should be event listeners attached after rendering.
    // Keeping it simple for this refactor to match existing pattern.

    return `
        <div class="card" data-category="${escapeHtml(project.category)}" onclick="window.location.href='${escapeHtml(project.link)}'; event.stopPropagation();">
            <div class="card-actions">
                <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                        data-project-title="${escapeHtml(project.title)}" 
                        onclick="event.preventDefault(); event.stopPropagation(); window.toggleProjectBookmark(this, '${escapeHtml(project.title)}', '${escapeHtml(project.link)}', '${escapeHtml(project.category)}', '${escapeHtml(project.description || '')}');"
                        title="${isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}">
                    <i class="${isBookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'}"></i>
                </button>
                <a href="${sourceUrl}" target="_blank" class="source-btn" 
                   onclick="event.stopPropagation();" 
                   title="View Source Code">
                    <i class="ri-github-fill"></i>
                </a>
            </div>
            <div class="card-link">
                <div class="card-cover ${coverClass}" style="${coverStyle}">
                    <i class="${escapeHtml(project.icon || 'ri-code-s-slash-line')}"></i>
                </div>
                <div class="card-content">
                    <div class="card-header-flex">
                        <h3 class="card-heading">${escapeHtml(project.title)}</h3>
                        <span class="category-tag">${capitalize(project.category)}</span>
                    </div>
                    <p class="card-description">${escapeHtml(project.description || '')}</p>
                    <div class="card-tech">${techHtml}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generates HTML for a project list item.
 * @param {Object} project - The project data object.
 * @returns {string} The HTML string for the project list item.
 */
export function createProjectListCard(project) {
    const isBookmarked = window.bookmarksManager?.isBookmarked(project.title);
    const coverStyle = project.coverStyle || '';
    const coverClass = project.coverClass || '';
    const sourceUrl = getSourceCodeUrl(project.link);

    return `
        <div class="list-card">
            <div class="list-card-icon ${coverClass}" style="${coverStyle}">
                <i class="${escapeHtml(project.icon || 'ri-code-s-slash-line')}"></i>
            </div>
            <div class="list-card-content">
                <h4 class="list-card-title">${escapeHtml(project.title)}</h4>
                <p class="list-card-description">${escapeHtml(project.description || '')}</p>
            </div>
            <div class="list-card-meta">
                <span class="list-card-category">${capitalize(project.category || 'project')}</span>
                <div class="list-card-actions">
                    <button class="list-card-btn ${isBookmarked ? 'bookmarked' : ''}" 
                            onclick="window.toggleProjectBookmark(this, '${escapeHtml(project.title)}', '${escapeHtml(project.link)}', '${escapeHtml(project.category)}', '${escapeHtml(project.description || '')}');">
                        <i class="${isBookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'}"></i>
                    </button>
                    <a href="${escapeHtml(project.link)}" class="list-card-btn" title="Open Project">
                        <i class="ri-external-link-line"></i>
                    </a>
                    <a href="${sourceUrl}" target="_blank" class="list-card-btn" title="View Source Code">
                        <i class="ri-github-fill"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}
