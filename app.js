// Core logic for the Thesis Playground.
// - Renders thesis cards from `posts` in data.js
// - Shows detail view with feedback UI
// - Stores emoji reactions and comments in localStorage (per device)

(function () {
  const STORAGE_KEY = 'thesisFeedback';

  const EMOJIS = [
    { id: 'thumbs', symbol: '👍', label: 'This feels good / I like this' },
    { id: 'heart', symbol: '❤️', label: 'I feel excited or emotionally seen' },
    { id: 'thinking', symbol: '🤔', label: 'I have questions / I\'m not sure yet' },
    { id: 'sparkles', symbol: '✨', label: 'Interesting direction / new idea' },
    { id: 'confused', symbol: '😕', label: 'Confusing or not working for me' }
  ];

  function loadFeedback() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveFeedback(allFeedback) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allFeedback));
    } catch (e) {
      // Ignore quota errors in this simple MVP
    }
  }

  function getPostFeedback(postId) {
    const all = loadFeedback();
    return all[postId] || { reactions: {}, comments: [] };
  }

  function setPostFeedback(postId, data) {
    const all = loadFeedback();
    all[postId] = data;
    saveFeedback(all);
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function renderCards() {
    const grid = document.getElementById('posts-grid');
    if (!grid || !Array.isArray(posts)) return;

    posts.forEach((post, index) => {
      const card = document.createElement('article');
      card.className = 'post-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-pressed', 'false');
      card.setAttribute('aria-label', `Open details for: ${post.title}`);
      card.dataset.postId = post.id;

      card.innerHTML = `
        <div class="post-card-header">
          <div>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-date">${formatDate(post.date)}</p>
          </div>
          <span class="card-badge">${index === 0 ? 'Latest' : 'In progress'}</span>
        </div>
        <p class="post-summary">${post.summary}</p>
        <div class="post-tags">
          ${Array.isArray(post.tags)
            ? post.tags
                .map((tag) => `<span class="tag-pill">${tag}</span>`)
                .join('')
            : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        selectPost(post.id, { fromKeyboard: false });
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectPost(post.id, { fromKeyboard: true });
        }
      });

      grid.appendChild(card);
    });
  }

  function selectPost(postId, options = {}) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const cards = document.querySelectorAll('.post-card');
    cards.forEach((card) => {
      const isActive = card.dataset.postId === postId;
      card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    renderDetail(post);

    const detail = document.getElementById('post-detail');
    if (detail && !options.fromKeyboard) {
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderDetail(post) {
    const container = document.getElementById('post-detail');
    if (!container) return;

    const feedback = getPostFeedback(post.id);

    const detailHtml = `
      <div class="post-detail-header">
        <div>
          <h3 class="post-detail-title">${post.title}</h3>
          <p class="post-detail-meta">
            <span>${formatDate(post.date)}</span>
            ${Array.isArray(post.tags) && post.tags.length
              ? `<span> · ${post.tags.join(', ')}</span>`
              : ''}
          </p>
        </div>
      </div>
      <div class="post-detail-body">
        <p>Here’s what I’m exploring in this piece of the thesis:</p>
        <ul>
          ${Array.isArray(post.detail)
            ? post.detail.map((item) => `<li>${item}</li>`).join('')
            : ''}
        </ul>
      </div>
      <div class="post-detail-visual">
        <span class="visual-label">Visual sketch</span>
        <span>${post.visualNote || 'I will add a visual or GIF for this exploration later.'}</span>
      </div>
      <div class="post-detail-footer" data-post-id="${post.id}">
        <section aria-label="Emoji reactions for this card">
          <div class="emoji-bar">
            <span class="emoji-label">How does this feel?</span>
            ${EMOJIS.map((emoji) => {
              const count = feedback.reactions?.[emoji.id] || 0;
              return `
                <button
                  type="button"
                  class="emoji-button"
                  data-emoji-id="${emoji.id}"
                  aria-label="${emoji.label}"
                >
                  <span>${emoji.symbol}</span>
                  <span class="emoji-button-count">${count}</span>
                </button>
              `;
            }).join('')}
          </div>
        </section>
        <section aria-label="Write a quick comment about this card">
          <form class="feedback-form" novalidate>
            <label class="feedback-label" for="feedback-textarea">
              Want to write a quick thought?
            </label>
            <textarea
              id="feedback-textarea"
              class="feedback-textarea"
              name="feedback"
              rows="3"
              placeholder="Example: “I love the light + vibration idea, but I worry about sensory overload.”"
            ></textarea>
            <div class="feedback-actions">
              <button type="submit" class="feedback-submit">
                <span>Save my feedback</span>
              </button>
              <p class="feedback-hint">
                Short is great. Your words stay on this device only.
              </p>
            </div>
            <p class="feedback-message" aria-live="polite"></p>
            <ul class="comments-list" aria-label="Previous comments for this card">
              ${renderCommentsList(feedback.comments)}
            </ul>
          </form>
        </section>
      </div>
    `;

    container.innerHTML = detailHtml;

    attachFeedbackHandlers(post.id);
  }

  function renderCommentsList(comments) {
    if (!Array.isArray(comments) || comments.length === 0) {
      return '';
    }

    const sorted = [...comments].sort((a, b) => b.timestamp - a.timestamp);

    return sorted
      .map((comment) => {
        const date = new Date(comment.timestamp);
        const label = Number.isNaN(date.getTime())
          ? ''
          : date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            });
        return `
          <li class="comment-item">
            <p class="comment-meta">${label ? `Saved on ${label}` : 'Saved'}</p>
            <p class="comment-text">${escapeHtml(comment.text)}</p>
          </li>
        `;
      })
      .join('');
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function attachFeedbackHandlers(postId) {
    const detailFooter = document.querySelector('.post-detail-footer[data-post-id="' + postId + '"]');
    if (!detailFooter) return;

    const feedback = getPostFeedback(postId);

    const emojiButtons = detailFooter.querySelectorAll('.emoji-button');
    emojiButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const emojiId = button.dataset.emojiId;
        if (!emojiId) return;

        const updated = getPostFeedback(postId);
        if (!updated.reactions) updated.reactions = {};
        const current = updated.reactions[emojiId] || 0;
        updated.reactions[emojiId] = current + 1;
        setPostFeedback(postId, updated);

        const countSpan = button.querySelector('.emoji-button-count');
        if (countSpan) {
          countSpan.textContent = updated.reactions[emojiId];
        }
      });
    });

    const form = detailFooter.querySelector('.feedback-form');
    if (!form) return;

    const textarea = form.querySelector('.feedback-textarea');
    const messageEl = form.querySelector('.feedback-message');
    const commentsList = form.querySelector('.comments-list');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!textarea) return;

      const value = textarea.value.trim();
      if (!value) {
        if (messageEl) {
          messageEl.textContent = 'If you want to leave a comment, please type a few words first.';
          messageEl.className = 'feedback-message error';
        }
        return;
      }

      const updated = getPostFeedback(postId);
      if (!Array.isArray(updated.comments)) {
        updated.comments = [];
      }
      updated.comments.push({
        text: value.slice(0, 600),
        timestamp: Date.now()
      });
      setPostFeedback(postId, updated);

      if (commentsList) {
        commentsList.innerHTML = renderCommentsList(updated.comments);
      }
      textarea.value = '';
      textarea.focus();

      if (messageEl) {
        messageEl.textContent = 'Thank you — your comment is saved on this device.';
        messageEl.className = 'feedback-message success';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCards();
    if (Array.isArray(posts) && posts.length > 0) {
      selectPost(posts[0].id);
    }
  });
})();


