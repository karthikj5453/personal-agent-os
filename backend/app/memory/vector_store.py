import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class MemoryRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    key: str
    content: str
    category: str = "general"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class VectorMemoryEngine:
    def __init__(self):
        self._store: Dict[str, MemoryRecord] = {}
        # Pre-seed default memories for Boss
        self.remember("favorite_title", "Boss", "preference")
        self.remember("core_project", "HEY Nexus Personal AI Operating System", "project")

    def remember(self, key: str, content: str, category: str = "general") -> MemoryRecord:
        """Store a long-term memory for Boss."""
        clean_key = key.lower().strip()
        record = MemoryRecord(key=clean_key, content=content, category=category)
        self._store[clean_key] = record
        return record

    def recall(self, query: str) -> List[MemoryRecord]:
        """Perform semantic recall search across stored memories."""
        q_lower = query.lower().strip()
        results = []
        for key, rec in self._store.items():
            if (
                q_lower in key
                or q_lower in rec.content.lower()
                or any(w in rec.content.lower() for w in q_lower.split())
            ):
                results.append(rec)
        return results or list(self._store.values())[:3]

    def get_all_memories(self) -> List[MemoryRecord]:
        return list(self._store.values())


memory_engine = VectorMemoryEngine()
