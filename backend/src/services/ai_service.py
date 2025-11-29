"""
AI Service module for handling LangChain and ChatXAI integration.
Provides streaming chat functionality using xAI's Grok model with memory tools.
"""

from typing import AsyncGenerator, List
import logging
from langchain_xai import ChatXAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage, BaseMessage
from src.core.config import settings
from src.services.tools import memory_tools, search_memory, delete_memory, schedule_reminder
import asyncio
import json
from src.services.memory_processor import memory_processor

logger = logging.getLogger("yield.services.ai_service")


class AIService:
    """Service class for AI chat interactions with memory tools."""
    
    def __init__(self):
        """Initialize the ChatXAI model with memory tools."""
        self.chat_model = ChatXAI(
            model="grok-3",
            temperature=0.7,
            xai_api_key=settings.xai_api_key,
        )
        
        # Bind search_memory, delete_memory, and schedule_reminder to the main chat model.
        available_tools = [search_memory, delete_memory, schedule_reminder]
        
        self.chat_model_with_tools = self.chat_model.bind_tools(available_tools)
        
        self.system_prompt = """You are yield, an intelligent and obedient digital memory assistant.

You have access to a long‑term memory database via tools. You DO NOT automatically know the user's name, preferences, or history – you must either:
- Use the `search_memory` tool, or
- Rely on any memory snippets the system passes to you in the system message.

**Rules for Using Memory:**
- When the user asks about themselves (e.g., "What is my name?", "What do I like?", "What are my plans?"), you MUST use any provided memory snippets first.
- If no snippets are present or they seem insufficient, you SHOULD call the `search_memory` tool with the latest user message to retrieve relevant memories.
- When you see multiple memories about the same fact, trust the **most recent** one as the current truth.
- You may mention the change in time if helpful (e.g., "You mentioned last year that you liked X, but more recently you said you hate it.").

**Scheduling Reminders:**
- You can schedule reminders for the user using the `schedule_reminder` tool.
- If the user asks you to remind them later or follow up, use this tool.
- Examples: "Remind me in 2 hours to call mom", "Ask me how the concert went tomorrow (24 hours)".

Always be helpful, concise, and natural."""
    
    async def generate_response(self, messages_input: List[object], user_id: str) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response from the AI model with tool support.
        
        Args:
            messages_input: List of message objects (role, content)
            user_id: The authenticated user ID
            
        Yields:
            Word-by-word chunks of the complete response
        """
        # Extract the latest user message for memory processing
        latest_user_message = next(
            (m.content for m in reversed(messages_input) if m.role == "user"), 
            None
        )
        
        context_window = [
            {"role": msg.role, "content": msg.content}
            for msg in messages_input[-20:]
        ]
        
        if latest_user_message:
            # 🚀 FIRE-AND-FORGET: Start memory processing with context awareness
            asyncio.create_task(
                memory_processor.process_message(
                    latest_user_message,
                    user_id,
                    context_window,
                )
            )
            logger.debug("Queued memory processing task for user %s", user_id)
        
        # Try to proactively retrieve relevant memories based on the latest user message.
        # This ensures the model has access to facts like the user's name, preferences, etc.,
        # even if it forgets to call the `search_memory` tool itself.
        memory_snippets = ""
        if latest_user_message:
            try:
                memory_result = await search_memory.ainvoke(
                    {"query": latest_user_message, "user_id": user_id}
                )
                # Only attach if we actually found something useful
                if isinstance(memory_result, str) and not memory_result.startswith("No relevant memories"):
                    memory_snippets = memory_result
            except Exception as e:
                logger.exception("Error retrieving proactive memory context for user %s", user_id)

        # Build system message, optionally enriched with retrieved memories
        system_content = self.system_prompt
        if memory_snippets:
            system_content += (
                "\n\n---\n"
                "The following long‑term memories were retrieved based on the user's latest message.\n"
                "Use them as trusted context when answering:\n"
                f"{memory_snippets}\n"
            )

        # Convert input messages to LangChain format
        lc_messages: List[BaseMessage] = [SystemMessage(content=system_content)]
        
        for msg in messages_input:
            if msg.role == "user":
                lc_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                lc_messages.append(AIMessage(content=msg.content))
            # Skip system messages from input as we prepend our own system prompt
        
        try:
            # First, invoke the model to check if it wants to use tools
            response = await self.chat_model_with_tools.ainvoke(lc_messages)
            
            # Check if the model wants to call tools
            if hasattr(response, 'tool_calls') and response.tool_calls:
                # Execute tool calls
                lc_messages.append(response)
                
                for tool_call in response.tool_calls:
                    tool_name = tool_call['name']
                    tool_args = tool_call['args']
                    tool_id = tool_call['id']
                    
                    # Find and execute the tool
                    tool_result = await self._execute_tool(tool_name, tool_args, user_id)
                    
                    # Add tool result to messages
                    lc_messages.append(
                        ToolMessage(
                            content=tool_result,
                            tool_call_id=tool_id
                        )
                    )
                
                # Get final response from the model after tool execution
                final_response = await self.chat_model_with_tools.ainvoke(lc_messages)
                full_response = final_response.content
            else:
                # No tool calls, use the direct response
                full_response = response.content
            
            # Stream the response word-by-word for smooth display
            words = full_response.split(' ')
            for i, word in enumerate(words):
                if i < len(words) - 1:
                    yield word + ' '
                else:
                    yield word
                await asyncio.sleep(0.03)  # Small delay for smooth streaming
            
            # Note: We no longer save history here. The frontend handles it.
                
        except Exception as e:
            logger.exception("Error generating response for user %s", user_id)
            yield f"[Error: {str(e)}]"
    
    async def _execute_tool(self, tool_name: str, tool_args: dict, user_id: str) -> str:
        """
        Execute a tool by name with given arguments.
        Injects user_id into the tool arguments.
        """
        # Find the tool by name
        tool = None
        for t in memory_tools:
            if t.name == tool_name:
                tool = t
                break
        
        if tool is None:
            logger.warning("Requested tool '%s' not found", tool_name)
            return f"Error: Tool '{tool_name}' not found"
        
        try:
            # Inject user_id into tool arguments
            tool_args["user_id"] = user_id
            
            # Execute the tool (tools are async)
            result = await tool.ainvoke(tool_args)
            return str(result)
        except Exception as e:
            logger.exception("Error executing tool '%s' for user %s", tool_name, user_id)
            return f"Error executing tool '{tool_name}': {str(e)}"


# Global AI service instance
ai_service = AIService()
