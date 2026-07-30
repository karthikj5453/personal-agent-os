from typing import Dict, Any
from langchain_core.tools import tool
from app.memory.vector_store import memory_engine


@tool
def remember_info_tool(key: str, content: str, category: str = "preference") -> Dict[str, Any]:
    """
    Store long-term memory or preference for Boss.
    Args:
        key: Memory key identifier (e.g. 'favorite_coffee', 'github_username').
        content: Detailed memory content to store.
        category: Category tag ('preference', 'work', 'project', 'personal').
    """
    rec = memory_engine.remember(key, content, category)
    return {
        "status": "stored",
        "key": rec.key,
        "content": rec.content,
        "category": rec.category,
        "message": f"Memory stored for Boss: '{rec.key}' = '{rec.content}'"
    }


@tool
def recall_memory_tool(query: str) -> Dict[str, Any]:
    """
    Recall long-term memories or stored preferences for Boss.
    Args:
        query: Memory search topic or key.
    """
    results = memory_engine.recall(query)
    memories_formatted = [f"• **{r.key}**: {r.content} ({r.category})" for r in results]
    msg = (
        f"🧠 **Memory Recall for Boss ('{query}'):**\n"
        + "\n".join(memories_formatted)
    )
    return {
        "status": "recalled",
        "query": query,
        "count": len(results),
        "message": msg
    }
