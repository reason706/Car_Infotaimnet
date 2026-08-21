# DriveHub

DriveHub is a landscape-first automotive cockpit interface for connected vehicles. It combines live vehicle telemetry, navigation, media playback, weather, climate controls, contacts, voice commands, and a responsive dashboard in one high-contrast driving surface.

The project is designed as a realistic cockpit prototype: the backend provides simulated OBD-II metrics and seed data, while the Expo frontend provides the interactive vehicle experience.

## Highlights

- Three-column cockpit home: vehicle status, navigation map, and utility widgets.
- Expandable full-screen map with live speed and gear overlay.
- Mapbox navigation with route search, recentering, map styles, navigation zoom, and directional vehicle arrow.
- Outside weather from Open-Meteo with GPS-based lookup and vehicle-sensor fallback.
- Cabin climate controls, gear selector, lighting controls, tire metrics, fuel range, and drive status.
- Media hub with local audio import, album organization, favorites, searchable country radio, Spotify and YouTube Music provider surfaces, and a shared music player widget.
- Draggable home music player with play/pause, previous, next, queue-aware radio playback, and shared task-bar volume control.
- Contacts, call history, voice commands, destination search, and vehicle metrics API.
- Dark-first automotive UI using Barlow Condensed, DM Sans, and Material Community Icons.

## Project Structure

```text
.
├── backend/
│   ├── server.py              # FastAPI service and seed data
│   ├── requirements.txt       # Python dependencies
│   └── pytest.ini              # Test configuration
├── frontend/
│   ├── app/                   # Expo Router screens and cockpit layouts
│   ├── src/components/        # Vehicle, map, media, gauge, and control UI
│   ├── src/hooks/             # Location and font hooks
│   ├── src/lib/               # Mapbox, weather, and domain helpers
│   ├── src/state/             # Shared player state
│   ├── assets/                # Fonts and image assets
│   └── package.json           # Expo scripts and dependencies
├── design_guidelines.json     # Product and visual design direction
└── test_result.md             # Existing test notes
```

## Requirements

- Node.js 20 or newer
- Yarn 1.22 or npm
- Python 3.11 or newer
- MongoDB, local or hosted
- A Mapbox public access token for live maps and route search

## Quick Start

### 1. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=drivehub
```

Run FastAPI:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000/api`.

### 2. Configure the frontend

Create `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token
```

For a physical device, replace `localhost` with the host computer's LAN address, for example `http://192.168.1.20:8000`.

### 3. Start Expo

```bash
cd frontend
yarn install
yarn web
```

Useful alternatives:

```bash
yarn start       # Expo developer menu
yarn android     # Android target
yarn ios         # iOS target
yarn lint        # ESLint
yarn tsc --noEmit
```

## Backend API

The FastAPI service currently exposes:

| Area | Endpoint | Purpose |
| --- | --- | --- |
| Health | `GET /api/` | Service status |
| Media | `GET /api/media/tracks` | Seed music library |
| Media | `GET /api/media/videos` | Parked video catalog |
| Vehicle | `GET /api/vehicle/metrics` | Simulated live telemetry |
| Navigation | `GET /api/navigation/destinations` | Saved destinations |
| Navigation | `POST /api/navigation/search` | Search saved destinations |
| Contacts | `GET /api/contacts` | Contact list |
| Calls | `GET /api/call-logs` | Recent call history |
| Calls | `POST /api/call-logs` | Add a call record |
| Voice | `POST /api/voice/command` | Parse text or audio commands |

The backend seeds tracks, videos, contacts, destinations, and call history into MongoDB on startup. Vehicle metrics are intentionally simulated so the UI can be developed without an OBD-II device.

## Integrations

### Mapbox

Mapbox powers the live map, geocoding, directions, map styles, route rendering, and navigation camera. The public token can be supplied through `EXPO_PUBLIC_MAPBOX_TOKEN` or changed from the map settings control. Only public Mapbox tokens should be used in the client.

### Weather

The cockpit uses Open-Meteo for current weather. It does not require an API key. If location permission, network access, or the weather service is unavailable, the widget falls back to the vehicle telemetry temperature.

### Radio

Country-based radio stations are loaded from the public Radio Browser directory. The media hub supports searchable countries, station favorites, and queue playback within the selected country. Station availability depends on the directory and each station's stream URL.

### Spotify and YouTube Music

The media hub provides in-app provider surfaces. Production account playback requires official OAuth configuration, provider client IDs, redirect URLs, and the relevant playback permissions. These credentials are intentionally not committed to the repository.

## Media Behavior

- Local audio can be imported from the device with the Local source picker.
- Imported track metadata and local URIs are persisted locally.
- Local tracks can be grouped into albums, played with album-scoped next/previous queues, favorited, and removed.
- Radio stations play through the shared player flow where the browser or platform permits the stream, with the next station shown in the player widget.
- The music player widget appears in the media hub, overlays the home cockpit, and can be dragged within the viewport.
- Volume is controlled from the task bar and is shared with active web audio playback.
- Provider playback behavior depends on the provider's embed, account, and platform restrictions.

## Design Direction

DriveHub follows a dark-first utility language intended for quick glances while driving:

- Solid surfaces and borders instead of blur or glass effects.
- High-contrast white metrics and blue functional accents.
- Barlow Condensed for large vehicle numbers and DM Sans for labels.
- Landscape orientation with large touch targets.
- Map and telemetry remain the primary visual hierarchy; decorative elements are restrained.

## Validation

Frontend checks:

```bash
cd frontend
yarn tsc --noEmit
npx expo export --platform web
yarn lint
```

Backend checks:

```bash
cd backend
pytest
```

The backend test command requires the dependencies in `backend/requirements.txt`, including `pytest-xdist`.

## Roadmap

- Connect real OBD-II or CAN telemetry hardware.
- Add secure Google and Spotify OAuth through a backend session service.
- Add turn-by-turn voice navigation and traffic-aware route recalculation.
- Add native background audio and lock-screen media controls.
- Add vehicle maintenance schedules, warning alerts, and service history.
- Add automated frontend and backend test coverage.

## License

No license has been selected for this repository yet. Add a license before distributing DriveHub publicly.
