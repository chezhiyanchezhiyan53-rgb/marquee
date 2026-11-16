(async function confirmationPage() {
  await App.initAuth();
  if (!App.requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('id');
  const root = App.qs('#confirmRoot');

  if (!bookingId) {
    App.emptyState(root, 'Booking not specified.');
    return;
  }

  let booking = null;

  try {
    const res = await Api.get(`/bookings/${bookingId}`);
    booking = res.data.booking;
    render();
  } catch (err) {
    App.emptyState(root, err.message);
    App.toast(err.message, 'error');
  }

  function render() {
    const show = booking.show;
    const movie = show?.movie;
    const theatre = show?.screen?.theatre;
    const seats = (booking.seats || [])
      .map((s) => `${s.row}${s.seatNumber}`)
      .join(', ');

    root.innerHTML = `
      <div style="text-align:center;padding-top:1.5rem" class="no-print">
        <h1>Booking ${booking.bookingStatus === 'cancelled' ? 'Cancelled' : 'Confirmed'}</h1>
        <p class="muted">Thank you for choosing MARQUEE</p>
      </div>

      <article class="card ticket-card" id="ticket">
        <p class="dim" style="font-size:0.8rem">BOOKING REFERENCE</p>
        <div class="ticket-ref">${App.escape(booking.bookingReference)}</div>
        <h2 style="margin:1rem 0 0.25rem">${App.escape(movie?.title || 'Movie')}</h2>
        <p class="muted">${App.escape(theatre?.name || '')} · ${App.escape(show?.screen?.name || '')}</p>

        <dl class="info-grid">
          <div>
            <dt>Date</dt>
            <dd>${App.formatDate(show?.showDate)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>${App.escape(show?.startTime || '')}</dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>${App.escape(seats)}</dd>
          </div>
          <div>
            <dt>Tickets</dt>
            <dd>${booking.seats?.length || 0}</dd>
          </div>
          <div>
            <dt>Total Amount</dt>
            <dd>${App.formatCurrency(booking.totalAmount)}</dd>
          </div>
          <div>
            <dt>Booking Status</dt>
            <dd>${App.badge(booking.bookingStatus)}</dd>
          </div>
          <div>
            <dt>Payment Status</dt>
            <dd>${App.badge(booking.paymentStatus)}</dd>
          </div>
        </dl>

        ${
          booking.paymentStatus === 'pending' && booking.bookingStatus === 'confirmed'
            ? `<div class="alert alert-warning no-print">
                Payment is simulated for this demo. Click below to mark as paid.
               </div>
               <button class="btn btn-primary btn-block no-print" id="payBtn">Demo Pay Now</button>`
            : ''
        }
      </article>

      <div class="summary-inner container no-print" style="justify-content:center;gap:0.75rem;padding-bottom:2rem">
        <button class="btn btn-secondary" onclick="window.print()">Print Ticket</button>
        <a class="btn btn-ghost" href="/bookings">My Bookings</a>
        <a class="btn btn-primary" href="/">Back to Home</a>
      </div>
    `;

    App.qs('#payBtn')?.addEventListener('click', async () => {
      const btn = App.qs('#payBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Processing...';
      }
      try {
        const res = await Api.post(`/bookings/${booking._id}/pay`);
        booking = res.data.booking;
        App.toast('Demo payment successful', 'success');
        render();
      } catch (err) {
        App.toast(err.message, 'error');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Demo Pay Now';
        }
      }
    });
  }
})();
