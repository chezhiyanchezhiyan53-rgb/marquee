/**
 * CineBook shared UI helpers
 */
const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop';
const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1400&h=500&fit=crop';

const App = {
  user: null,

  qs(sel, root = document) {
    return root.querySelector(sel);
  },

  qsa(sel, root = document) {
    return [...root.querySelectorAll(sel)];
  },

  formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  },

  formatDateInput(date) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  posterUrl(url) {
    return url || FALLBACK_POSTER;
  },

  bannerUrl(url) {
    return url || FALLBACK_BANNER;
  },

  toast(message, type = 'info') {
    let stack = this.qs('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, 3500);
  },

  setLoading(el, loading, text = 'Loading...') {
    if (!el) return;
    if (loading) {
      el.innerHTML = `<div class="loading"><div class="spinner"></div><p>${text}</p></div>`;
    }
  },

  emptyState(el, message) {
    if (!el) return;
    el.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
  },

  async initAuth() {
    try {
      const res = await Api.get('/auth/me');
      this.user = res.data.user;
    } catch {
      this.user = null;
      Api.setToken(null);
    }
    this.renderNavAuth();
    return this.user;
  },

  requireAuth(redirect = '/login') {
    if (!this.user) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${redirect}?next=${next}`;
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.user || this.user.role !== 'admin') {
      this.toast('Admin access required', 'error');
      window.location.href = '/login';
      return false;
    }
    return true;
  },

  renderNavAuth() {
    const slot = this.qs('[data-auth-slot]');
    if (!slot) return;

    if (this.user) {
      slot.innerHTML = `
        <a href="/bookings">My Bookings</a>
        ${this.user.role === 'admin' ? '<a href="/admin">Admin</a>' : ''}
        <span class="chip" style="margin:0 0.35rem">${this.escape(this.user.name)}</span>
        <button class="linkish" type="button" id="logoutBtn">Logout</button>
      `;
      this.qs('#logoutBtn')?.addEventListener('click', () => this.logout());
    } else {
      slot.innerHTML = `
        <a href="/login">Login</a>
        <a href="/register" class="btn btn-primary btn-sm">Sign Up</a>
      `;
    }
  },

  async logout() {
    try {
      await Api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    Api.setToken(null);
    this.user = null;
    this.toast('Logged out', 'success');
    window.location.href = '/';
  },

  escape(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  movieCard(movie) {
    const genres = (movie.genre || []).slice(0, 2).join(' · ');
    const rating =
      movie.status === 'coming_soon'
        ? 'Coming Soon'
        : `★ ${Number(movie.rating).toFixed(1)}`;
    const canBook = movie.status === 'now_showing';

    return `
      <article class="movie-card">
        <img class="movie-poster" src="${this.escape(this.posterUrl(movie.posterUrl))}"
             alt="${this.escape(movie.title)}"
             onerror="this.src='${FALLBACK_POSTER}'" />
        <div class="movie-card-body">
          <h3>${this.escape(movie.title)}</h3>
          <p class="movie-card-meta">${this.escape(genres)} · ${this.escape(movie.language)}</p>
          <p class="movie-card-meta">${movie.durationMinutes} min · ${rating}</p>
          ${
            canBook
              ? `<a class="btn btn-primary btn-sm" href="/movie?id=${movie._id}">Book Tickets</a>`
              : `<a class="btn btn-secondary btn-sm" href="/movie?id=${movie._id}">View Details</a>`
          }
        </div>
      </article>
    `;
  },

  badge(status) {
    const map = {
      confirmed: 'badge-success',
      cancelled: 'badge-danger',
      paid: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      refunded: 'badge-info',
      scheduled: 'badge-info',
      completed: 'badge-info',
    };
    return `<span class="badge ${map[status] || 'badge-info'}">${this.escape(status)}</span>`;
  },

  initNavToggle() {
    const toggle = this.qs('.nav-toggle');
    const links = this.qs('.nav-links');
    toggle?.addEventListener('click', () => links?.classList.toggle('open'));
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.initNavToggle();
});

window.App = App;
window.FALLBACK_POSTER = FALLBACK_POSTER;
window.FALLBACK_BANNER = FALLBACK_BANNER;
