# SeatSight

SeatSight is a premium, cinematic movie theater booking demo. Pick a seat, see a simulated screen view from that exact position, review seat quality metrics, and confirm the booking.

## Live deploy

This repo is Vercel-ready as a static app. Import `dhruvtoprani/seatsight` into Vercel and deploy with the default static settings.

## Local run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Features

- Interactive 10-row auditorium seat map
- Available, selected, occupied, and premium seat states
- Dynamic POV preview driven by seat position
- Seat quality scoring, viewing angle, distance, price, and labels
- Clean confirmation flow
- Responsive dark cinematic UI

## Stack

- Vanilla HTML/CSS/JS
- Tiny Node static server for local development
- Vercel static deployment support
