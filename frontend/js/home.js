(async function homePage() {
  await App.initAuth();

  const state = {
    movies: [],
    genres: [],
    search: '',
    genre: 'all',
  };

  const nowGrid = App.qs('#nowShowingGrid');
  const soonGrid = App.qs('#comingSoonGrid');
  const searchInput = App.qs('#searchInput');
  const genrePills = App.qs('#genrePills');

  try {
    const [moviesRes, genresRes] = await Promise.all([
      Api.get('/movies?limit=50'),
      Api.get('/movies/genres/list'),
    ]);
    state.movies = moviesRes.data.movies || [];
    state.genres = genresRes.data.genres || [];
    renderHero();
    renderGenrePills();
    renderMovies();
  } catch (err) {
    App.emptyState(
      nowGrid,
      err.message || 'Unable to load movies. Is MongoDB connected?'
    );
    App.toast(err.message, 'error');
  }

  function renderHero() {
    const featured =
      state.movies.find((m) => m.status === 'now_showing') || state.movies[0];
    if (!featured) return;

    App.qs('#heroBg').style.backgroundImage = `url('${App.bannerUrl(featured.bannerUrl)}')`;
    App.qs('#heroTitle').textContent = featured.title;
    App.qs('#heroDesc').textContent = featured.description.slice(0, 160) + '...';
    App.qs('#heroMeta').innerHTML = `
      <span class="chip">${App.escape((featured.genre || []).join(' · '))}</span>
      <span class="chip">${App.escape(featured.language)}</span>
      <span class="chip">${featured.durationMinutes} min</span>
      <span class="chip rating">★ ${Number(featured.rating).toFixed(1)}</span>
    `;
    const cta = App.qs('#heroCta');
    cta.textContent = featured.status === 'now_showing' ? 'Book Tickets' : 'View Details';
    cta.href = `/movie?id=${featured._id}`;
  }

  function renderGenrePills() {
    const pills = ['all', ...state.genres];
    genrePills.innerHTML = pills
      .map(
        (g) =>
          `<button type="button" class="pill ${state.genre === g ? 'active' : ''}" data-genre="${App.escape(g)}">${g === 'all' ? 'All' : App.escape(g)}</button>`
      )
      .join('');
  }

  genrePills?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-genre]');
    if (!btn) return;
    state.genre = btn.dataset.genre;
    renderGenrePills();
    renderMovies();
  });

  function filtered(status) {
    return state.movies.filter((m) => {
      if (m.status !== status) return false;
      if (state.genre !== 'all' && !(m.genre || []).includes(state.genre)) return false;
      if (state.search && !m.title.toLowerCase().includes(state.search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  function renderMovies() {
    const now = filtered('now_showing');
    const soon = filtered('coming_soon');

    nowGrid.innerHTML = now.length
      ? now.map((m, i) => App.movieCard(m).replace('fadeUp', `fadeUp; animation-delay:${i * 0.04}s`)).join('')
      : '<div class="empty-state"><p>No movies match your filters.</p></div>';

    soonGrid.innerHTML = soon.length
      ? soon.map((m) => App.movieCard(m)).join('')
      : '<div class="empty-state"><p>No upcoming titles for these filters.</p></div>';
  }

  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      renderMovies();
    }, 200);
  });
})();
