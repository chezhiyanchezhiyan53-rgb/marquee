(async function seatsPage() {
  await App.initAuth();
  if (!App.requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  const showId = params.get('showId');
  const root = App.qs('#seatsRoot');
  const MAX = 8;

  if (!showId) {
    App.emptyState(root, 'Show not specified.');
    return;
  }

  let show = null;
  let seats = [];
  let prices = {};
  let selected = new Set();

  try {
    const [showRes, seatRes] = await Promise.all([
      Api.get(`/shows/${showId}`),
      Api.get(`/shows/${showId}/seats`),
    ]);
    show = showRes.data.show;
    seats = seatRes.data.seats || [];
    prices = seatRes.data.ticketPrices || show.ticketPrices || {};
    render();
  } catch (err) {
    App.emptyState(root, err.message);
    App.toast(err.message, 'error');
  }

  function groupRows(list) {
    const map = new Map();
    for (const s of list) {
      if (!map.has(s.row)) map.set(s.row, []);
      map.get(s.row).push(s);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.seatNumber - b.seatNumber);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  function totalPrice() {
    let total = 0;
    for (const id of selected) {
      const seat = seats.find((s) => s.seatId === id);
      if (seat) total += prices[seat.seatType] || 0;
    }
    return total;
  }

  function selectedLabels() {
    return [...selected]
      .map((id) => {
        const s = seats.find((x) => x.seatId === id);
        return s ? `${s.row}${s.seatNumber}` : id;
      })
      .sort();
  }

  function render() {
    const movie = show.movie;
    const theatre = show.screen?.theatre;
    const rows = groupRows(seats);

    root.innerHTML = `
      <div class="seat-page-header">
        <h1>Select Seats</h1>
        <p class="muted">${App.escape(movie?.title || '')}</p>
        <div class="hero-meta" style="margin-top:0.75rem">
          <span class="chip">${App.escape(theatre?.name || '')}</span>
          <span class="chip">${App.escape(show.screen?.name || '')}</span>
          <span class="chip">${App.formatDate(show.showDate)}</span>
          <span class="chip">${App.escape(show.startTime)}</span>
        </div>
        <p class="demo-note">Max ${MAX} seats · Prices: Regular ${App.formatCurrency(prices.regular)} · Premium ${App.formatCurrency(prices.premium)} · Recliner ${App.formatCurrency(prices.recliner)}</p>
      </div>

      <div class="screen-indicator">
        <div class="screen-curve"></div>
        <p class="dim">SCREEN THIS WAY</p>
      </div>

      <div class="seat-legend">
        <span class="legend-item"><span class="seat-swatch available"></span> Available</span>
        <span class="legend-item"><span class="seat-swatch selected"></span> Selected</span>
        <span class="legend-item"><span class="seat-swatch booked"></span> Booked</span>
        <span class="legend-item"><span class="seat-swatch premium"></span> Premium</span>
        <span class="legend-item"><span class="seat-swatch recliner"></span> Recliner</span>
      </div>

      <div class="seat-map">
        <div class="seat-rows" id="seatRows">
          ${rows
            .map(
              ([row, list]) => `
            <div class="seat-row">
              <span class="row-label">${App.escape(row)}</span>
              ${list
                .map((s) => {
                  const isSelected = selected.has(s.seatId);
                  const isBooked = s.status === 'booked';
                  const cls = [
                    'seat',
                    s.seatType,
                    isBooked ? 'booked' : '',
                    isSelected ? 'selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return `<button type="button" class="${cls}" data-seat="${s.seatId}" ${isBooked ? 'disabled' : ''} title="${s.row}${s.seatNumber} · ${s.seatType}">${s.seatNumber}</button>`;
                })
                .join('')}
              <span class="row-label">${App.escape(row)}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div class="booking-summary">
        <div class="container summary-inner">
          <div>
            <p class="muted">Selected: <strong>${selectedLabels().join(', ') || 'None'}</strong> (${selected.size}/${MAX})</p>
            <p style="font-size:1.25rem;font-weight:700;margin-top:0.25rem">Total: ${App.formatCurrency(totalPrice())}</p>
          </div>
          <button class="btn btn-primary" id="confirmBtn" ${selected.size ? '' : 'disabled'}>
            Confirm Booking
          </button>
        </div>
      </div>
    `;

    App.qs('#seatRows')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-seat]');
      if (!btn || btn.disabled) return;
      const id = btn.dataset.seat;
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        if (selected.size >= MAX) {
          App.toast(`You can select up to ${MAX} seats`, 'error');
          return;
        }
        selected.add(id);
      }
      render();
    });

    App.qs('#confirmBtn')?.addEventListener('click', createBooking);
  }

  async function createBooking() {
    const btn = App.qs('#confirmBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Booking...';
    }
    try {
      const res = await Api.post('/bookings', {
        showId,
        seatIds: [...selected],
      });
      const booking = res.data.booking;
      App.toast('Booking created', 'success');
      window.location.href = `/confirmation?id=${booking._id}`;
    } catch (err) {
      App.toast(err.message, 'error');
      // Refresh availability after conflict
      try {
        const seatRes = await Api.get(`/shows/${showId}/seats`);
        seats = seatRes.data.seats || [];
        selected.clear();
        render();
      } catch {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Confirm Booking';
        }
      }
    }
  }
})();
