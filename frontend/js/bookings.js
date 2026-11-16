(async function bookingsPage() {
  await App.initAuth();
  if (!App.requireAuth()) return;

  const root = App.qs('#bookingsRoot');

  async function load() {
    App.setLoading(root, true, 'Refreshing bookings...');
    try {
      const res = await Api.get('/bookings/my');
      render(res.data.bookings || []);
    } catch (err) {
      App.emptyState(root, err.message);
      App.toast(err.message, 'error');
    }
  }

  function render(bookings) {
    if (!bookings.length) {
      App.emptyState(root, 'No bookings yet. Pick a movie and book your seats!');
      return;
    }

    root.innerHTML = `
      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Movie</th>
              <th>Showtime</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Booking</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${bookings
              .map((b) => {
                const show = b.show;
                const seats = (b.seats || []).map((s) => `${s.row}${s.seatNumber}`).join(', ');
                return `
                <tr>
                  <td><a href="/confirmation?id=${b._id}"><strong>${App.escape(b.bookingReference)}</strong></a></td>
                  <td>${App.escape(show?.movie?.title || '—')}</td>
                  <td>${App.formatDate(show?.showDate)} · ${App.escape(show?.startTime || '')}</td>
                  <td>${App.escape(seats)}</td>
                  <td>${App.formatCurrency(b.totalAmount)}</td>
                  <td>${App.badge(b.bookingStatus)}</td>
                  <td>${App.badge(b.paymentStatus)}</td>
                  <td>
                    ${
                      b.bookingStatus === 'confirmed'
                        ? `<button class="btn btn-danger btn-sm" data-cancel="${b._id}">Cancel</button>`
                        : '—'
                    }
                  </td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    const id = btn.dataset.cancel;
    if (!confirm('Cancel this booking? Seats will be released.')) return;
    btn.disabled = true;
    try {
      await Api.patch(`/bookings/${id}/cancel`);
      App.toast('Booking cancelled. Seats released.', 'success');
      await load();
    } catch (err) {
      App.toast(err.message, 'error');
      btn.disabled = false;
    }
  });

  App.qs('#refreshBtn')?.addEventListener('click', load);
  await load();
})();
