"""
Redis-backed online/offline presence (FR-CHAT-04).

A user counts as "online" while at least one of their browser tabs holds an
open `/ws/notifications` connection (that socket is mounted app-wide via the
notification bell, so it's a reliable global heartbeat). Presence is a
connection COUNT with a refreshed TTL, not a boolean flag:
  - counting connections means one tab closing doesn't flip a user offline
    while another tab is still open;
  - the TTL means a connection that dies without a clean close (crash,
    network drop) still expires instead of leaving someone stuck "online"
    forever — see PRESENCE_REFRESH_SECONDS in chat_ws.py.
"""

import json

import redis.asyncio as aioredis

from app.config import get_settings

settings = get_settings()
_redis = aioredis.from_url(settings.redis_url)

PRESENCE_TTL_SECONDS = 45
PRESENCE_REFRESH_SECONDS = 20
PRESENCE_UPDATES_CHANNEL = "presence:updates"


def _count_key(user_id) -> str:
    return f"presence:count:{user_id}"


async def _publish(user_id, online: bool) -> None:
    await _redis.publish(
        PRESENCE_UPDATES_CHANNEL,
        json.dumps({"event": "presence", "user_id": str(user_id), "online": online}),
    )


async def connect(user_id) -> bool:
    """Call once when a connection opens. Returns True if this user just
    transitioned from offline to online."""
    count = await _redis.incr(_count_key(user_id))
    await _redis.expire(_count_key(user_id), PRESENCE_TTL_SECONDS)
    if count == 1:
        await _publish(user_id, True)
    return count == 1


async def refresh(user_id) -> None:
    """Call periodically while a connection stays open, so a connection
    that dies uncleanly still expires via TTL instead of staying 'online'."""
    await _redis.expire(_count_key(user_id), PRESENCE_TTL_SECONDS)


async def disconnect(user_id) -> bool:
    """Call once when a connection closes. Returns True if this user just
    transitioned from online to offline (no tabs left)."""
    count = await _redis.decr(_count_key(user_id))
    if count <= 0:
        await _redis.delete(_count_key(user_id))
        await _publish(user_id, False)
        return True
    return False


async def get_online_user_ids(user_ids: list) -> set[str]:
    if not user_ids:
        return set()
    pipe = _redis.pipeline()
    for uid in user_ids:
        pipe.exists(_count_key(uid))
    results = await pipe.execute()
    return {str(uid) for uid, present in zip(user_ids, results) if present}
