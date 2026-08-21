from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import math
import time
import tempfile
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="DriveHub API")
api_router = APIRouter(prefix="/api")

# ---------- Models ----------
class Track(BaseModel):
    id: str
    title: str
    artist: str
    album: str
    duration: int  # seconds
    artwork: str
    genre: str

class Video(BaseModel):
    id: str
    title: str
    channel: str
    duration: int
    thumbnail: str
    category: str

class Contact(BaseModel):
    id: str
    name: str
    phone: str
    avatar: Optional[str] = None
    favorite: bool = False

class CallLog(BaseModel):
    id: str
    contact_id: Optional[str] = None
    name: str
    phone: str
    direction: str  # incoming, outgoing, missed
    duration: int  # seconds
    timestamp: str

class CallLogCreate(BaseModel):
    contact_id: Optional[str] = None
    name: str
    phone: str
    direction: str
    duration: int = 0

class Destination(BaseModel):
    id: str
    name: str
    address: str
    distance_km: float
    eta_minutes: int
    category: str  # home, work, favorite, recent

class VehicleMetrics(BaseModel):
    speed_kmh: float
    rpm: int
    fuel_percent: float
    engine_temp: float
    battery_v: float
    range_km: int
    odometer: int
    trip_distance: float
    trip_avg_speed: float
    trip_fuel_used: float
    outside_temp: float
    tire_pressure: List[float]

class VoiceIntent(BaseModel):
    transcript: str
    intent: str  # play_music, call_contact, navigate, set_temp, unknown
    target: Optional[str] = None

# ---------- Seed Data ----------
SEED_TRACKS = [
    {"id": "t1", "title": "Midnight City", "artist": "M83", "album": "Hurry Up, We're Dreaming", "duration": 244, "genre": "Synthwave",
     "artwork": "https://images.unsplash.com/photo-1643914543607-7f755947dd70?w=400&q=80"},
    {"id": "t2", "title": "Neon Drive", "artist": "The Midnight", "album": "Endless Summer", "duration": 312, "genre": "Synthwave",
     "artwork": "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=400&q=80"},
    {"id": "t3", "title": "Highway to Hell", "artist": "AC/DC", "album": "Highway to Hell", "duration": 208, "genre": "Rock",
     "artwork": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80"},
    {"id": "t4", "title": "Thunder Road", "artist": "Bruce Springsteen", "album": "Born to Run", "duration": 289, "genre": "Rock",
     "artwork": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80"},
    {"id": "t5", "title": "Cruise Control", "artist": "Kavinsky", "album": "OutRun", "duration": 267, "genre": "Electronic",
     "artwork": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80"},
    {"id": "t6", "title": "Radar Love", "artist": "Golden Earring", "album": "Moontan", "duration": 385, "genre": "Rock",
     "artwork": "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&q=80"},
    {"id": "t7", "title": "Sunset Drive", "artist": "FM-84", "album": "Atlas", "duration": 298, "genre": "Synthwave",
     "artwork": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80"},
    {"id": "t8", "title": "Life is a Highway", "artist": "Rascal Flatts", "album": "Cars OST", "duration": 273, "genre": "Country",
     "artwork": "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=400&q=80"},
    {"id": "t9", "title": "Nightcall", "artist": "Kavinsky", "album": "Drive OST", "duration": 254, "genre": "Electronic",
     "artwork": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&q=80"},
    {"id": "t10", "title": "Born to Be Wild", "artist": "Steppenwolf", "album": "Steppenwolf", "duration": 210, "genre": "Rock",
     "artwork": "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&q=80"},
]

SEED_VIDEOS = [
    {"id": "v1", "title": "Grand Tour: Sahara Special", "channel": "Amazon", "duration": 4800, "category": "Automotive",
     "thumbnail": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80"},
    {"id": "v2", "title": "Le Mans '66", "channel": "20th Century", "duration": 9060, "category": "Movie",
     "thumbnail": "https://images.unsplash.com/photo-1541348263662-e068662d82af?w=600&q=80"},
    {"id": "v3", "title": "Top Gear: Best Moments", "channel": "BBC", "duration": 3600, "category": "Automotive",
     "thumbnail": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80"},
    {"id": "v4", "title": "Ford v Ferrari", "channel": "Disney+", "duration": 9180, "category": "Movie",
     "thumbnail": "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600&q=80"},
    {"id": "v5", "title": "Formula 1: Drive to Survive", "channel": "Netflix", "duration": 2700, "category": "Series",
     "thumbnail": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80"},
    {"id": "v6", "title": "Fast & Furious 10", "channel": "Universal", "duration": 8400, "category": "Movie",
     "thumbnail": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80"},
]

SEED_CONTACTS = [
    {"id": "c1", "name": "Sarah Johnson", "phone": "+1 415 555 0132", "favorite": True,
     "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"},
    {"id": "c2", "name": "Michael Chen", "phone": "+1 415 555 0187", "favorite": True,
     "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"},
    {"id": "c3", "name": "Emma Rodriguez", "phone": "+1 415 555 0294", "favorite": True,
     "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80"},
    {"id": "c4", "name": "David Park", "phone": "+1 415 555 0346", "favorite": False,
     "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80"},
    {"id": "c5", "name": "Olivia Martinez", "phone": "+1 415 555 0421", "favorite": True,
     "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80"},
    {"id": "c6", "name": "James Wilson", "phone": "+1 415 555 0512", "favorite": False,
     "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80"},
    {"id": "c7", "name": "Ava Thompson", "phone": "+1 415 555 0629", "favorite": False,
     "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80"},
    {"id": "c8", "name": "Noah Kim", "phone": "+1 415 555 0778", "favorite": False,
     "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80"},
]

SEED_DESTINATIONS = [
    {"id": "d1", "name": "Home", "address": "1250 Sunset Blvd, San Francisco", "distance_km": 8.2, "eta_minutes": 14, "category": "home"},
    {"id": "d2", "name": "Office", "address": "500 Market Street, San Francisco", "distance_km": 12.5, "eta_minutes": 22, "category": "work"},
    {"id": "d3", "name": "Golden Gate Park", "address": "501 Stanyan St, San Francisco", "distance_km": 4.8, "eta_minutes": 11, "category": "favorite"},
    {"id": "d4", "name": "SFO Airport", "address": "780 S Airport Blvd, San Francisco", "distance_km": 21.3, "eta_minutes": 28, "category": "recent"},
    {"id": "d5", "name": "Fisherman's Wharf", "address": "Pier 39, San Francisco", "distance_km": 6.7, "eta_minutes": 15, "category": "recent"},
    {"id": "d6", "name": "Twin Peaks Vista", "address": "501 Twin Peaks Blvd, San Francisco", "distance_km": 5.9, "eta_minutes": 13, "category": "favorite"},
]

# ---------- Startup seeding ----------
@app.on_event("startup")
async def seed_db():
    if await db.tracks.count_documents({}) == 0:
        await db.tracks.insert_many([t.copy() for t in SEED_TRACKS])
    if await db.videos.count_documents({}) == 0:
        await db.videos.insert_many([v.copy() for v in SEED_VIDEOS])
    if await db.contacts.count_documents({}) == 0:
        await db.contacts.insert_many([c.copy() for c in SEED_CONTACTS])
    if await db.destinations.count_documents({}) == 0:
        await db.destinations.insert_many([d.copy() for d in SEED_DESTINATIONS])
    if await db.call_logs.count_documents({}) == 0:
        # Seed some call history
        now = datetime.now(timezone.utc)
        logs = [
            {"id": str(uuid.uuid4()), "contact_id": "c1", "name": "Sarah Johnson", "phone": "+1 415 555 0132",
             "direction": "outgoing", "duration": 214, "timestamp": now.isoformat()},
            {"id": str(uuid.uuid4()), "contact_id": "c3", "name": "Emma Rodriguez", "phone": "+1 415 555 0294",
             "direction": "incoming", "duration": 388, "timestamp": now.isoformat()},
            {"id": str(uuid.uuid4()), "contact_id": "c2", "name": "Michael Chen", "phone": "+1 415 555 0187",
             "direction": "missed", "duration": 0, "timestamp": now.isoformat()},
            {"id": str(uuid.uuid4()), "contact_id": "c5", "name": "Olivia Martinez", "phone": "+1 415 555 0421",
             "direction": "outgoing", "duration": 92, "timestamp": now.isoformat()},
        ]
        await db.call_logs.insert_many(logs)

# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"app": "DriveHub", "status": "online"}

# Media
@api_router.get("/media/tracks", response_model=List[Track])
async def get_tracks():
    tracks = await db.tracks.find({}, {"_id": 0}).to_list(1000)
    return tracks

@api_router.get("/media/videos", response_model=List[Video])
async def get_videos():
    videos = await db.videos.find({}, {"_id": 0}).to_list(1000)
    return videos

# Contacts
@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts():
    contacts = await db.contacts.find({}, {"_id": 0}).to_list(1000)
    return contacts

@api_router.get("/call-logs", response_model=List[CallLog])
async def get_call_logs():
    logs = await db.call_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return logs

@api_router.post("/call-logs", response_model=CallLog)
async def create_call_log(payload: CallLogCreate):
    log = CallLog(
        id=str(uuid.uuid4()),
        contact_id=payload.contact_id,
        name=payload.name,
        phone=payload.phone,
        direction=payload.direction,
        duration=payload.duration,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    await db.call_logs.insert_one(log.dict())
    return log

# Navigation
@api_router.get("/navigation/destinations", response_model=List[Destination])
async def get_destinations():
    dests = await db.destinations.find({}, {"_id": 0}).to_list(1000)
    return dests

class DestinationSearch(BaseModel):
    query: str

@api_router.post("/navigation/search", response_model=List[Destination])
async def search_destinations(body: DestinationSearch):
    q = body.query.lower().strip()
    dests = await db.destinations.find({}, {"_id": 0}).to_list(1000)
    if not q:
        return dests
    return [d for d in dests if q in d["name"].lower() or q in d["address"].lower()]

# Vehicle Metrics (simulated live data)
_START_TIME = time.time()

@api_router.get("/vehicle/metrics", response_model=VehicleMetrics)
async def get_vehicle_metrics():
    t = time.time() - _START_TIME
    # Smooth pseudo-live values
    speed = 55 + 25 * math.sin(t / 8) + random.uniform(-2, 2)
    speed = max(0, min(180, speed))
    rpm = 1500 + 900 * (0.5 + 0.5 * math.sin(t / 6)) + random.randint(-50, 50)
    rpm = int(max(700, min(6500, rpm)))
    fuel = 68 - (t % 3600) / 240
    fuel = max(0, min(100, fuel))
    return VehicleMetrics(
        speed_kmh=round(speed, 1),
        rpm=rpm,
        fuel_percent=round(fuel, 1),
        engine_temp=round(88 + 3 * math.sin(t / 20), 1),
        battery_v=round(13.8 + 0.3 * math.sin(t / 15), 2),
        range_km=int(340 + fuel * 3),
        odometer=48237,
        trip_distance=round(24.7 + t / 600, 1),
        trip_avg_speed=round(58.2 + math.sin(t / 40) * 3, 1),
        trip_fuel_used=round(2.3 + t / 5000, 2),
        outside_temp=round(22 + math.sin(t / 200) * 2, 1),
        tire_pressure=[round(32 + random.uniform(-0.4, 0.4), 1) for _ in range(4)],
    )

# Voice command
def _parse_intent(text: str) -> dict:
    t = text.lower().strip()
    if not t:
        return {"intent": "unknown", "target": None}
    if any(k in t for k in ["play", "song", "music", "track", "album"]):
        m = re.search(r"(?:play|song|track|album)\s+(.+)", t)
        return {"intent": "play_music", "target": (m.group(1).strip() if m else None)}
    if any(k in t for k in ["call", "dial", "phone"]):
        m = re.search(r"(?:call|dial|phone)\s+(.+)", t)
        return {"intent": "call_contact", "target": (m.group(1).strip() if m else None)}
    if any(k in t for k in ["navigate", "go to", "drive to", "directions", "take me"]):
        m = re.search(r"(?:navigate to|go to|drive to|directions to|take me to)\s+(.+)", t)
        return {"intent": "navigate", "target": (m.group(1).strip() if m else None)}
    if "temperature" in t or "temp" in t or "climate" in t:
        return {"intent": "set_temp", "target": None}
    return {"intent": "unknown", "target": None}

@api_router.post("/voice/command", response_model=VoiceIntent)
async def voice_command(
    audio: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    """Accepts an audio file OR text. Transcribes with Whisper if audio provided."""
    transcript = ""
    if text:
        transcript = text
    elif audio is not None:
        try:
            from openai import OpenAI
            api_key = os.environ.get("EMERGENT_LLM_KEY")
            if not api_key:
                raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY missing")
            client_ai = OpenAI(
                api_key=api_key,
                base_url="https://integrations.emergentagent.com/llm",
            )
            suffix = ".m4a"
            fname = audio.filename or ""
            if "." in fname:
                suffix = "." + fname.rsplit(".", 1)[-1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                content = await audio.read()
                tmp.write(content)
                tmp_path = tmp.name
            try:
                with open(tmp_path, "rb") as f:
                    result = client_ai.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                    )
                transcript = getattr(result, "text", "") or ""
            finally:
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Whisper transcription failed: {e}")
            transcript = ""
    else:
        raise HTTPException(status_code=400, detail="Provide audio file or text")

    parsed = _parse_intent(transcript)
    return VoiceIntent(transcript=transcript, intent=parsed["intent"], target=parsed["target"])

# ---------- Wire up ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
