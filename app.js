if (typeof document === 'undefined') {
  module.exports = require('./server');
} else {
  const rows = 'ABCDEFGHIJ'.split('');
  const occupied = new Set(['A2','A3','B11','C5','C6','D12','E3','E13','F2','G10','H4','I7','J12']);
  let selectedId = 'F8';
  let confirmed = false;

  const seatMap = document.getElementById('seatMap');
  const details = document.getElementById('details');
  const toast = document.getElementById('toast');
  const povScreen = document.getElementById('povScreen');
  const povRoom = document.getElementById('povRoom');
  const crosshair = document.getElementById('crosshair');
  const previewTitle = document.getElementById('previewTitle');
  const viewPill = document.getElementById('viewPill');
  const selectedHeroSeat = document.getElementById('selectedHeroSeat');
  const bestSeatBtn = document.getElementById('bestSeatBtn');

  const seats = rows.flatMap((row, rowIndex) => {
    return Array.from({ length: 14 }, (_, index) => {
      const number = index + 1;
      const id = `${row}${number}`;
      const x = number <= 7 ? number - 8 : number - 7;
      const z = rowIndex + 1;
      const centerPremium = rowIndex >= 4 && rowIndex <= 6 && number >= 6 && number <= 9;
      return {
        id,
        row,
        rowIndex,
        number,
        x,
        z,
        status: occupied.has(id) ? 'occupied' : centerPremium ? 'premium' : 'available',
        price: centerPremium ? 24 : rowIndex <= 1 ? 16 : 19
      };
    });
  });

  function getSeat(id) {
    return seats.find(seat => seat.id === id);
  }

  function scoreSeat(seat) {
    const centerPenalty = Math.abs(seat.x) * 7.2;
    const frontPenalty = seat.rowIndex < 2 ? (2 - seat.rowIndex) * 11 : 0;
    const backPenalty = seat.rowIndex > 7 ? (seat.rowIndex - 7) * 5 : 0;
    const sweetSpotPenalty = Math.abs(seat.rowIndex - 5.5) * 4.2;
    const raw = 100 - centerPenalty - frontPenalty - backPenalty - sweetSpotPenalty;
    const score = Math.max(32, Math.min(99, Math.round(raw)));
    const angle = Math.round(Math.atan2(Math.abs(seat.x), seat.z + 2) * 57.2958);
    const distance = `${Math.round((seat.z + 2.5) * 4.7)} ft`;
    let label = 'Balanced';
    if (score >= 90) label = 'Best view';
    else if (Math.abs(seat.x) <= 1 && score >= 78) label = 'Centered';
    else if (seat.rowIndex <= 1) label = 'Close to screen';
    else if (Math.abs(seat.x) >= 5) label = 'Side angle';
    else if (seat.rowIndex >= 8) label = 'Back row';
    const grade = score >= 90 ? 'Excellent' : score >= 78 ? 'Great' : score >= 65 ? 'Good' : score >= 50 ? 'Okay' : 'Poor angle';
    return { score, angle, distance, label, grade };
  }

  function renderSeatMap() {
    seatMap.innerHTML = '';
    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'row';
      const leftLabel = document.createElement('span');
      leftLabel.className = 'rowLabel';
      leftLabel.textContent = row;
      rowEl.appendChild(leftLabel);

      seats.filter(seat => seat.row === row).forEach(seat => {
        if (seat.number === 8) {
          const aisle = document.createElement('span');
          aisle.className = 'aisle';
          rowEl.appendChild(aisle);
        }
        const button = document.createElement('button');
        button.className = `seat ${seat.status} ${seat.id === selectedId ? 'selected' : ''}`;
        button.type = 'button';
        button.textContent = seat.number;
        button.ariaLabel = `Seat ${seat.id}, ${seat.status}`;
        button.addEventListener('click', () => selectSeat(seat));
        rowEl.appendChild(button);
      });

      const rightLabel = document.createElement('span');
      rightLabel.className = 'rowLabel';
      rightLabel.textContent = row;
      rowEl.appendChild(rightLabel);
      seatMap.appendChild(rowEl);
    });
  }

  function selectSeat(seat) {
    if (seat.status === 'occupied') {
      showToast('Seat unavailable');
      return;
    }
    selectedId = seat.id;
    confirmed = false;
    updateUI();
  }

  function updatePreview(seat, meta) {
    const side = Math.max(-1, Math.min(1, seat.x / 6));
    const depth = seat.rowIndex / 9;
    const screenW = 78 - depth * 33 - Math.abs(side) * 9;
    const screenH = 45 - depth * 18 - Math.abs(side) * 4;
    const angle = -side * 21;
    const x = 50 - side * 10;
    const y = 48 + (depth - .5) * 4;

    povScreen.style.setProperty('--screen-w', `${screenW}%`);
    povScreen.style.setProperty('--screen-h', `${screenH}%`);
    povScreen.style.setProperty('--screen-angle', `${angle}deg`);
    povScreen.style.left = `${x}%`;
    povScreen.style.top = `${y}%`;
    crosshair.style.setProperty('--cross-x', `${50 - side * 11}%`);
    crosshair.style.setProperty('--cross-y', `${54 + (depth - .5) * 8}%`);
    povRoom.style.filter = seat.rowIndex < 2 ? 'brightness(1.08)' : seat.rowIndex > 7 ? 'brightness(.9)' : 'brightness(1)';
    previewTitle.textContent = `View from ${seat.id}`;
    viewPill.textContent = meta.label;
    selectedHeroSeat.textContent = seat.id;
  }

  function renderDetails(seat, meta) {
    if (confirmed) {
      details.classList.add('confirmed');
      details.innerHTML = `
        <p class="eyebrow">Demo booking complete</p>
        <h3>Seat ${seat.id} selected</h3>
        <p class="muted">Great choice — ${meta.label.toLowerCase()} with a ${meta.grade.toLowerCase()} view score. This is the final confirmation state for the MVP.</p>
        <div class="metrics">
          <div class="metric"><span>Seat</span><strong>${seat.id}</strong></div>
          <div class="metric"><span>Total</span><strong>$${seat.price}.00</strong></div>
        </div>
        <button class="cta" id="changeSeat">Change seat</button>
      `;
      document.getElementById('changeSeat').addEventListener('click', () => {
        confirmed = false;
        updateUI();
      });
      return;
    }

    details.classList.remove('confirmed');
    details.innerHTML = `
      <p class="eyebrow">Selected seat</p>
      <h3>${seat.id} · ${meta.grade}</h3>
      <p class="muted">${descriptionFor(seat, meta)}</p>
      <div class="scoreLine">
        <div class="score">${meta.score}<small>/100</small></div>
        <div class="bar"><div class="barFill" style="--score:${meta.score}%"></div></div>
      </div>
      <div class="metrics">
        <div class="metric"><span>Recommendation</span><strong>${meta.label}</strong></div>
        <div class="metric"><span>Price</span><strong>$${seat.price}.00</strong></div>
        <div class="metric"><span>Distance</span><strong>${meta.distance}</strong></div>
        <div class="metric"><span>Viewing angle</span><strong>${meta.angle}°</strong></div>
        <div class="metric"><span>Row</span><strong>${seat.row}</strong></div>
        <div class="metric"><span>Seat number</span><strong>${seat.number}</strong></div>
      </div>
      <button class="cta" id="continueBtn">Continue with ${seat.id}</button>
    `;
    document.getElementById('continueBtn').addEventListener('click', () => {
      confirmed = true;
      updateUI();
    });
  }

  function descriptionFor(seat, meta) {
    if (meta.label === 'Best view') return 'Centered, immersive, and far enough back to take in the whole screen without neck strain.';
    if (meta.label === 'Close to screen') return 'Very immersive, but the screen will feel large and close from this row.';
    if (meta.label === 'Side angle') return 'A usable seat, but the screen is noticeably angled from this side of the auditorium.';
    if (meta.label === 'Back row') return 'Comfortable and farther back, with a smaller but complete view of the screen.';
    if (meta.label === 'Centered') return 'A strong centered seat with a balanced perspective and low horizontal angle.';
    return 'A balanced seat with solid distance and a clean view of the full screen.';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 1400);
  }

  function chooseBestSeat() {
    const best = seats
      .filter(seat => seat.status !== 'occupied')
      .map(seat => ({ seat, meta: scoreSeat(seat) }))
      .sort((a, b) => b.meta.score - a.meta.score)[0].seat;
    selectSeat(best);
  }

  function updateUI() {
    const seat = getSeat(selectedId);
    const meta = scoreSeat(seat);
    renderSeatMap();
    updatePreview(seat, meta);
    renderDetails(seat, meta);
  }

  bestSeatBtn.addEventListener('click', chooseBestSeat);
  updateUI();
}
