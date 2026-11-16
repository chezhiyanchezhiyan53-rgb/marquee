(async function adminPage() {
  await App.initAuth();
  if (!App.requireAuth() || !App.requireAdmin()) return;

  const nav = App.qs('#adminNav');
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-panel]');
    if (!btn) return;
    App.qsa('#adminNav button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    App.qsa('.admin-panel').forEach((p) => p.classList.remove('active'));
    App.qs(`#panel-${btn.dataset.panel}`)?.classList.add('active');
  });

  let movies = [];
  let theatres = [];
  let screens = [];

  async function loadOverview() {
    try {
      const res = await Api.get('/admin/analytics');
      const s = res.data.summary;
      App.qs('#statsGrid').innerHTML = `
        <div class="stat-card"><p class="dim">Confirmed Bookings</p><div class="value">${s.confirmedBookings}</div></div>
        <div class="stat-card"><p class="dim">Tickets Sold</p><div class="value">${s.ticketsSold}</div></div>
        <div class="stat-card"><p class="dim">Paid Revenue</p><div class="value">${App.formatCurrency(s.paidRevenue)}</div></div>
        <div class="stat-card"><p class="dim">Cancelled</p><div class="value">${s.cancelledBookings}</div></div>
      `;
      const popular = res.data.popularMovies || [];
      App.qs('#popularMovies').innerHTML = `
        <h3 style="margin-bottom:0.75rem">Popular Movies</h3>
        ${
          popular.length
            ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Bookings</th><th>Tickets</th><th>Revenue</th></tr></thead>
               <tbody>${popular
                 .map(
                   (m) =>
                     `<tr><td>${App.escape(m.title)}</td><td>${m.bookings}</td><td>${m.tickets}</td><td>${App.formatCurrency(m.revenue)}</td></tr>`
                 )
                 .join('')}</tbody></table></div>`
            : '<p class="muted">No booking data yet.</p>'
        }
      `;
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }

  async function loadMovies() {
    const res = await Api.get('/admin/movies');
    movies = res.data.movies || [];
    App.qs('#moviesAdmin').innerHTML = `
      <div class="table-wrap card"><table>
        <thead><tr><th>Title</th><th>Status</th><th>Language</th><th>Rating</th><th></th></tr></thead>
        <tbody>
          ${movies
            .map(
              (m) => `<tr>
              <td>${App.escape(m.title)}</td>
              <td>${App.badge(m.status)}</td>
              <td>${App.escape(m.language)}</td>
              <td>${m.rating}</td>
              <td>
                <button class="btn btn-secondary btn-sm" data-edit-movie="${m._id}">Edit</button>
                <button class="btn btn-danger btn-sm" data-del-movie="${m._id}">Delete</button>
              </td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table></div>`;
    fillSelect('#shMovie', movies, (m) => m.title);
  }

  async function loadTheatres() {
    const res = await Api.get('/admin/theatres');
    theatres = res.data.theatres || [];
    App.qs('#theatresAdmin').innerHTML = `
      <div class="table-wrap card"><table>
        <thead><tr><th>Name</th><th>City</th><th>Address</th><th></th></tr></thead>
        <tbody>
          ${theatres
            .map(
              (t) => `<tr>
              <td>${App.escape(t.name)}</td>
              <td>${App.escape(t.city)}</td>
              <td>${App.escape(t.address)}</td>
              <td><button class="btn btn-danger btn-sm" data-del-theatre="${t._id}">Delete</button></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table></div>`;
    fillSelect('#sTheatre', theatres, (t) => `${t.name} (${t.city})`);
  }

  async function loadScreens() {
    const res = await Api.get('/admin/screens');
    screens = res.data.screens || [];
    App.qs('#screensAdmin').innerHTML = `
      <div class="table-wrap card"><table>
        <thead><tr><th>Screen</th><th>Theatre</th><th>Seats</th><th></th></tr></thead>
        <tbody>
          ${screens
            .map(
              (s) => `<tr>
              <td>${App.escape(s.name)}</td>
              <td>${App.escape(s.theatre?.name || '')}</td>
              <td>${s.totalSeats}</td>
              <td><button class="btn btn-danger btn-sm" data-del-screen="${s._id}">Delete</button></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table></div>`;
    fillSelect(
      '#shScreen',
      screens,
      (s) => `${s.theatre?.name || ''} — ${s.name}`
    );
  }

  async function loadShows() {
    const res = await Api.get('/admin/shows');
    const shows = res.data.shows || [];
    App.qs('#showsAdmin').innerHTML = `
      <div class="table-wrap card"><table>
        <thead><tr><th>Movie</th><th>Theatre / Screen</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${shows
            .slice(0, 40)
            .map(
              (s) => `<tr>
              <td>${App.escape(s.movie?.title || '')}</td>
              <td>${App.escape(s.screen?.theatre?.name || '')} / ${App.escape(s.screen?.name || '')}</td>
              <td>${App.formatDate(s.showDate)}</td>
              <td>${App.escape(s.startTime)}</td>
              <td>${App.badge(s.status)}</td>
              <td><button class="btn btn-danger btn-sm" data-del-show="${s._id}">Delete</button></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table></div>`;
  }

  async function loadBookings() {
    const res = await Api.get('/admin/bookings?limit=50');
    const bookings = res.data.bookings || [];
    App.qs('#bookingsAdmin').innerHTML = `
      <div class="table-wrap card"><table>
        <thead><tr><th>Ref</th><th>User</th><th>Movie</th><th>Seats</th><th>Amount</th><th>Status</th><th>Payment</th></tr></thead>
        <tbody>
          ${bookings
            .map(
              (b) => `<tr>
              <td>${App.escape(b.bookingReference)}</td>
              <td>${App.escape(b.user?.email || '')}</td>
              <td>${App.escape(b.show?.movie?.title || '')}</td>
              <td>${(b.seats || []).map((s) => s.row + s.seatNumber).join(', ')}</td>
              <td>${App.formatCurrency(b.totalAmount)}</td>
              <td>${App.badge(b.bookingStatus)}</td>
              <td>${App.badge(b.paymentStatus)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table></div>`;
  }

  function fillSelect(sel, items, labelFn) {
    const el = App.qs(sel);
    if (!el) return;
    el.innerHTML = items
      .map((i) => `<option value="${i._id}">${App.escape(labelFn(i))}</option>`)
      .join('');
  }

  // Movie form
  App.qs('#addMovieBtn')?.addEventListener('click', () => {
    App.qs('#movieForm').style.display = 'block';
    App.qs('#movieFormTitle').textContent = 'Add Movie';
    App.qs('#movieId').value = '';
    App.qs('#movieForm').reset();
  });
  App.qs('#cancelMovieForm')?.addEventListener('click', () => {
    App.qs('#movieForm').style.display = 'none';
  });

  App.qs('#movieForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      title: App.qs('#mTitle').value.trim(),
      description: App.qs('#mDesc').value.trim(),
      genre: App.qs('#mGenre').value.split(',').map((g) => g.trim()).filter(Boolean),
      language: App.qs('#mLang').value.trim(),
      durationMinutes: Number(App.qs('#mDuration').value),
      rating: Number(App.qs('#mRating').value),
      releaseDate: App.qs('#mRelease').value,
      posterUrl: App.qs('#mPoster').value.trim(),
      bannerUrl: App.qs('#mBanner').value.trim(),
      status: App.qs('#mStatus').value,
      isDemo: true,
    };
    try {
      const id = App.qs('#movieId').value;
      if (id) await Api.put(`/admin/movies/${id}`, payload);
      else await Api.post('/admin/movies', payload);
      App.toast('Movie saved', 'success');
      App.qs('#movieForm').style.display = 'none';
      await loadMovies();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });

  App.qs('#moviesAdmin')?.addEventListener('click', async (e) => {
    const edit = e.target.closest('[data-edit-movie]');
    const del = e.target.closest('[data-del-movie]');
    if (edit) {
      const m = movies.find((x) => x._id === edit.dataset.editMovie);
      if (!m) return;
      App.qs('#movieForm').style.display = 'block';
      App.qs('#movieFormTitle').textContent = 'Edit Movie';
      App.qs('#movieId').value = m._id;
      App.qs('#mTitle').value = m.title;
      App.qs('#mDesc').value = m.description;
      App.qs('#mGenre').value = (m.genre || []).join(', ');
      App.qs('#mLang').value = m.language;
      App.qs('#mDuration').value = m.durationMinutes;
      App.qs('#mRating').value = m.rating;
      App.qs('#mRelease').value = App.formatDateInput(m.releaseDate);
      App.qs('#mPoster').value = m.posterUrl;
      App.qs('#mBanner').value = m.bannerUrl;
      App.qs('#mStatus').value = m.status;
    }
    if (del) {
      if (!confirm('Delete this movie?')) return;
      try {
        await Api.delete(`/admin/movies/${del.dataset.delMovie}`);
        App.toast('Movie deleted', 'success');
        await loadMovies();
      } catch (err) {
        App.toast(err.message, 'error');
      }
    }
  });

  App.qs('#addTheatreBtn')?.addEventListener('click', () => {
    App.qs('#theatreForm').style.display = 'block';
  });

  App.qs('#theatreForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await Api.post('/admin/theatres', {
        name: App.qs('#tName').value.trim(),
        address: App.qs('#tAddress').value.trim(),
        city: App.qs('#tCity').value.trim(),
      });
      App.toast('Theatre created', 'success');
      e.target.reset();
      e.target.style.display = 'none';
      await loadTheatres();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });

  App.qs('#theatresAdmin')?.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-theatre]');
    if (!del) return;
    if (!confirm('Delete theatre?')) return;
    try {
      await Api.delete(`/admin/theatres/${del.dataset.delTheatre}`);
      App.toast('Theatre deleted', 'success');
      await loadTheatres();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });

  App.qs('#screenForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const seatLayout = [
      { row: 'A', count: 10, seatType: 'regular' },
      { row: 'B', count: 10, seatType: 'regular' },
      { row: 'C', count: 10, seatType: 'regular' },
      { row: 'D', count: 10, seatType: 'regular' },
      { row: 'E', count: 8, seatType: 'premium' },
      { row: 'F', count: 8, seatType: 'premium' },
      { row: 'G', count: 6, seatType: 'recliner' },
    ];
    try {
      await Api.post('/admin/screens', {
        theatre: App.qs('#sTheatre').value,
        name: App.qs('#sName').value.trim(),
        totalSeats: 62,
        seatLayout,
      });
      App.toast('Screen and seats created', 'success');
      e.target.reset();
      await loadScreens();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });

  App.qs('#screensAdmin')?.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-screen]');
    if (!del) return;
    if (!confirm('Delete screen and its seats?')) return;
    try {
      await Api.delete(`/admin/screens/${del.dataset.delScreen}`);
      App.toast('Screen deleted', 'success');
      await loadScreens();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });

  App.qs('#showForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await Api.post('/admin/shows', {
        movie: App.qs('#shMovie').value,
        screen: App.qs('#shScreen').value,
        showDate: App.qs('#shDate').value,
        startTime: App.qs('#shTime').value,
        ticketPrices: {
          regular: Number(App.qs('#shRegular').value),
          premium: Number(App.qs('#shPremium').value),
          recliner: Number(App.qs('#shRecliner').value),
        },
        status: 'scheduled',
      });
      App.toast('Show scheduled with seat inventory', 'success');
      await loadShows();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });

  App.qs('#showsAdmin')?.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-show]');
    if (!del) return;
    if (!confirm('Delete show and inventory?')) return;
    try {
      await Api.delete(`/admin/shows/${del.dataset.delShow}`);
      App.toast('Show deleted', 'success');
      await loadShows();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  });

  App.qs('#refreshBookingsBtn')?.addEventListener('click', loadBookings);

  try {
    await Promise.all([
      loadOverview(),
      loadMovies(),
      loadTheatres(),
      loadScreens(),
      loadShows(),
      loadBookings(),
    ]);
  } catch (err) {
    App.toast(err.message, 'error');
  }
})();
