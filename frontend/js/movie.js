(async function moviePage() {
  await App.initAuth();

  const params = new URLSearchParams(window.location.search);
  const movieId = params.get('id');
  const root = App.qs('#movieRoot');

  if (!movieId) {
    App.emptyState(root, 'Movie not specified.');
    return;
  }

  let movie = null;
  let shows = [];
  let selectedDate = App.formatDateInput(new Date());
  let selectedShowId = null;

  try {
    const movieRes = await Api.get(`/movies/${movieId}`);
    movie = movieRes.data.movie;
    document.title = `${movie.title} — CineBook`;
    await loadShows();
    render();
  } catch (err) {
    App.emptyState(root, err.message);
    App.toast(err.message, 'error');
  }

  async function loadShows() {
    const res = await Api.get(`/shows?movieId=${movieId}&date=${selectedDate}`);
    shows = res.data.shows || [];
    selectedShowId = shows[0]?._id || null;
  }

  function dateOptions() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(App.formatDateInput(d));
    }
    return days;
  }

  function groupByTheatre(list) {
    const map = new Map();
    for (const show of list) {
      const theatre = show.screen?.theatre;
      if (!theatre) continue;
      const key = theatre._id;
      if (!map.has(key)) map.set(key, { theatre, shows: [] });
      map.get(key).shows.push(show);
    }
    return [...map.values()];
  }

  function render() {
    const canBook = movie.status === 'now_showing';
    const groups = groupByTheatre(shows);

    root.innerHTML = `
      <div class="detail-layout">
        <div class="detail-poster">
          <img src="${App.escape(App.posterUrl(movie.posterUrl))}"
               alt="${App.escape(movie.title)}"
               onerror="this.src='${FALLBACK_POSTER}'" />
        </div>
        <div>
          <p class="chip" style="margin-bottom:0.75rem">${movie.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'} · Demo</p>
          <h1>${App.escape(movie.title)}</h1>
          <div class="hero-meta" style="margin:1rem 0">
            <span class="chip">${App.escape((movie.genre || []).join(' · '))}</span>
            <span class="chip">${App.escape(movie.language)}</span>
            <span class="chip">${movie.durationMinutes} min</span>
            ${movie.status === 'now_showing' ? `<span class="chip rating">★ ${Number(movie.rating).toFixed(1)}</span>` : ''}
            <span class="chip">Release ${App.formatDate(movie.releaseDate)}</span>
          </div>
          <p class="muted">${App.escape(movie.description)}</p>

          ${
            canBook
              ? `
            <div class="show-panel">
              <h3>Select Date & Showtime</h3>
              <p class="dim" style="font-size:0.85rem;margin-top:0.25rem">Demo catalogue — not real cinema inventory.</p>
              <div class="date-tabs" id="dateTabs">
                ${dateOptions()
                  .map(
                    (d) =>
                      `<button type="button" class="tab-btn ${d === selectedDate ? 'active' : ''}" data-date="${d}">${App.formatDate(d)}</button>`
                  )
                  .join('')}
              </div>
              <div id="theatreList">
                ${
                  groups.length
                    ? groups
                        .map(
                          (g) => `
                    <div class="theatre-block">
                      <h4>${App.escape(g.theatre.name)}</h4>
                      <p class="dim" style="font-size:0.85rem">${App.escape(g.theatre.address)}, ${App.escape(g.theatre.city)}</p>
                      <div class="time-tabs">
                        ${g.shows
                          .map(
                            (s) => `
                          <button type="button" class="tab-btn ${s._id === selectedShowId ? 'active' : ''}" data-show="${s._id}">
                            ${s.startTime} · ${App.escape(s.screen.name)} · from ${App.formatCurrency(s.ticketPrices.regular)}
                          </button>`
                          )
                          .join('')}
                      </div>
                    </div>`
                        )
                        .join('')
                    : '<div class="alert alert-info">No showtimes for this date. Try another day.</div>'
                }
              </div>
              <button class="btn btn-primary" id="bookBtn" ${selectedShowId ? '' : 'disabled'}>
                Continue to Seat Selection
              </button>
            </div>`
              : '<div class="alert alert-warning" style="margin-top:1.5rem">This title is coming soon. Booking opens after release.</div>'
          }
        </div>
      </div>
    `;

    App.qs('#dateTabs')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-date]');
      if (!btn) return;
      selectedDate = btn.dataset.date;
      App.setLoading(root, true, 'Loading showtimes...');
      try {
        await loadShows();
        render();
      } catch (err) {
        App.toast(err.message, 'error');
        render();
      }
    });

    App.qs('#theatreList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-show]');
      if (!btn) return;
      selectedShowId = btn.dataset.show;
      render();
    });

    App.qs('#bookBtn')?.addEventListener('click', () => {
      if (!selectedShowId) return;
      if (!App.user) {
        window.location.href = `/login?next=${encodeURIComponent(`/seats?showId=${selectedShowId}`)}`;
        return;
      }
      window.location.href = `/seats?showId=${selectedShowId}`;
    });
  }
})();
