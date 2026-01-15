# COW Movement POT - Chatbot Integration Guide

A production-ready ChatGPT-like chatbot for querying COW movement insights using machine learning.

## Overview

**COW Movement POT** is an AI assistant that:
- Answers questions about COW status and movements
- Predicts next locations using ML models
- Recommends movement actions
- Provides statistics and analytics
- Performs pattern analysis
- Maintains conversation history

## Architecture

```
Frontend
├── COWChatbotButton.tsx (Floating button + modal)
├── COWMovementChat.tsx (Chat UI)
├── useCOWChatbot.ts (React hook)
└── cowMovementChatbot.ts (Client-side chatbot logic)

Backend
├── server/routes/chatbot.ts (API endpoints)
└── ML Integration (trained models)
```

## Quick Integration (5 steps)

### Step 1: Add to Main Dashboard

In `client/pages/Index.tsx`:

```typescript
import { COWChatbotButton } from "@/components/COWChatbotButton";

export function DashboardPage() {
  // ... existing code ...

  return (
    <div className="relative h-screen">
      {/* Existing dashboard content */}
      
      {/* Add chatbot button */}
      <COWChatbotButton
        movements={filteredMovements}
        locations={locations}
        className="fixed bottom-6 right-6 z-50"
      />
    </div>
  );
}
```

### Step 2: Register Backend Routes

In `server/index.ts`:

```typescript
import chatbotRouter, { initializeChatbotML } from "./routes/chatbot";
import {
  MovementRecommendationEngine,
  FeatureEngineer,
} from "../ml";

// Initialize ML for chatbot
const mlEngine = new MovementRecommendationEngine();
const featureEngineer = new FeatureEngineer();

// Setup with trained models
// (assume models are already trained from /ml module)
mlEngine.setModels(nextLocationModel, optimalStayModel, clusterModel);

// Initialize chatbot with ML
initializeChatbotML(
  mlEngine,
  featureEngineer,
  movements,
  locations,
);

// Mount routes
app.use("/api/chatbot", chatbotRouter);
```

### Step 3: Configure Environment

Add to `.env` or environment variables:

```
VITE_CHATBOT_ENABLED=true
VITE_CHATBOT_MAX_HISTORY=50
```

### Step 4: Update Package.json (if needed)

The chatbot uses existing dependencies (no new packages required).

### Step 5: Test Integration

1. Start your dev server: `npm run dev`
2. Look for the chat button in the bottom-right corner (🐄 icon)
3. Click to open chat interface
4. Try asking:
   - "What's the status of COW_001?"
   - "Show me movement statistics"
   - "Analyze movement patterns"

## Usage Examples

### User Queries

**Status Queries**
```
User: "What's the status of COW_001?"
POT:  "📍 Current Location: WH_RIYADH
      📅 Last Moved: Jan 15, 2024
      ⏱️ Idle Time: 25 days
      ✅ Recently moved"
```

**Statistics Queries**
```
User: "Show me movement statistics"
POT:  "📊 System Overview
      - Total COWs: 150
      - Total Locations: 25
      - Total Movements: 5,234
      - Average Idle Days: 18"
```

**Analysis Queries**
```
User: "Analyze movement patterns"
POT:  "🔍 Patterns:
      - 📈 Peak season in month 3
      - 🔄 COWs show warehouse preference
      
      ⚠️ Anomalies:
      - 5 COWs idle >60 days
      
      💡 Insights:
      - High movement activity
      - 150 unique COWs"
```

**Help Query**
```
User: "help"
POT:  Lists all available commands and examples
```

## API Endpoints

### POST /api/chatbot/chat
Send a message and get response

**Request:**
```typescript
{
  sessionId: "session_123",
  message: "What's the status of COW_001?"
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: "COW_001 Status Report...",
    queryType: "COW_STATUS",
    context: {
      cowId: "COW_001",
      currentLocation: "WH_RIYADH",
      idleDays: 25,
      movements: 42
    },
    sessionId: "session_123"
  }
}
```

### GET /api/chatbot/history/:sessionId
Get conversation history

**Response:**
```typescript
{
  success: true,
  data: {
    sessionId: "session_123",
    history: [
      { role: "user", content: "..." },
      { role: "assistant", content: "..." }
    ],
    messageCount: 4
  }
}
```

### DELETE /api/chatbot/history/:sessionId
Clear conversation history

### GET /api/chatbot/status
Get chatbot status

**Response:**
```typescript
{
  success: true,
  data: {
    status: "active",
    mlModelsInitialized: true,
    sessionsActive: 5,
    totalMessages: 247
  }
}
```

## React Hook Usage

### useChat Hook

```typescript
import { useCOWChatbot } from "@/hooks/useCOWChatbot";

export function CustomChatComponent() {
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory,
    getStatus,
  } = useCOWChatbot();

  const handleSubmit = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.role}>
          {msg.content}
        </div>
      ))}

      {loading && <p>POT is thinking...</p>}
      {error && <p>Error: {error}</p>}

      <input
        onKeyPress={(e) => {
          if (e.key === "Enter") handleSubmit(e.currentTarget.value);
        }}
        placeholder="Ask me anything..."
      />
    </div>
  );
}
```

## Customization

### Add Custom Queries

In `server/routes/chatbot.ts`, add to `parseQueryType()`:

```typescript
if (lower.includes("custom_keyword")) {
  return "CUSTOM_QUERY_TYPE";
}
```

Then add handler in the switch statement:

```typescript
case "CUSTOM_QUERY_TYPE":
  const customResult = handleCustomQuery(message);
  response = formatCustomResponse(customResult);
  context = customResult;
  break;
```

### Customize Welcome Message

In `client/components/COWMovementChat.tsx`:

```typescript
const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `Your custom welcome message here...`,
  // ...
};
```

### Customize Response Formatting

Edit formatting functions in `server/routes/chatbot.ts`:

```typescript
function formatCOWStatusResponse(statusInfo: any): string {
  return `Your custom format: ${statusInfo.cowId}...`;
}
```

## ML Integration

The chatbot uses ML models for predictions and recommendations.

### Train Models First

```typescript
import { createMLPipeline } from "./ml";

const { engine, models } = await createMLPipeline(movements, locations);

// Initialize chatbot with trained models
initializeChatbotML(engine, featureEngineer, movements, locations);
```

### Query ML for Predictions

When user asks for predictions:

```typescript
case "PREDICTIONS":
  if (mlEngine && featureEngineer) {
    // Use ML models for predictions
    const features = featureEngineer.createMovementFeatureVector(...);
    const prediction = mlEngine.recommendMovement(...);
    response = formatPredictionResponse(prediction);
  }
  break;
```

## Performance Optimization

### Caching Conversations

Conversations are stored in memory. For production, use a database:

```typescript
// Replace in-memory Map with database
const conversationHistory = new Map(); // Current

// Production: use Redis or Database
await redis.set(`conversation:${sessionId}`, JSON.stringify(history));
const history = await redis.get(`conversation:${sessionId}`);
```

### Limit History Size

```typescript
// Keep history size manageable (last 50 messages)
if (history.length > 50) {
  history.splice(0, 2);
}
```

### Batch ML Predictions

```typescript
// For multiple COWs, use batch predictions
const batchResults = mlEngine.recommendBatch(cowsList);
```

## Troubleshooting

### Chatbot Not Appearing

1. Check if button component is imported and rendered
2. Verify z-index (should be high, e.g., z-50)
3. Check browser console for errors

### API Errors

1. Verify chatbot routes are registered: `app.use("/api/chatbot", router)`
2. Check if ML models are initialized
3. Test endpoint: `curl http://localhost:3000/api/chatbot/status`

### ML Predictions Not Working

1. Ensure ML models are trained before using chatbot
2. Call `initializeChatbotML()` with trained models
3. Check `mlEngine` and `featureEngineer` are not null

### History Not Persisting

By default, history is stored in memory and cleared when server restarts.

For persistence:

```typescript
// Use localStorage (client-side)
localStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages));

// Or database (server-side)
await db.chatHistory.create({ sessionId, messages });
```

## Production Deployment

### Checklist

- [ ] ML models are trained and validated
- [ ] Chatbot routes are registered
- [ ] Error handling is in place
- [ ] Rate limiting is configured
- [ ] Conversation history is backed up
- [ ] Monitoring/logging is enabled
- [ ] CORS is configured (if needed)
- [ ] Authentication is enforced (if needed)

### Rate Limiting

Add to `server/routes/chatbot.ts`:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

router.post("/chat", limiter, async (req, res) => {
  // Handle chat
});
```

### Logging

```typescript
router.post("/chat", async (req, res) => {
  console.log(`[CHATBOT] ${sessionId}: ${message}`);
  // Log response
  console.log(`[CHATBOT] Response: ${response.substring(0, 50)}...`);
});
```

## Features

✅ **Natural Language Understanding** - Parses different query types
✅ **Status Queries** - Get current COW location and details
✅ **Predictions** - ML-based next location forecasting
✅ **Recommendations** - Actionable movement suggestions
✅ **Statistics** - System-wide movement analytics
✅ **Analysis** - Pattern detection and anomaly identification
✅ **Conversation History** - Multi-session support
✅ **Help System** - Built-in guidance
✅ **ChatGPT-like UI** - Familiar chat interface
✅ **Dark Mode Support** - Theme-aware design

## File Structure

```
client/
├── lib/cowMovementChatbot.ts          # Client-side chatbot logic
├── components/COWMovementChat.tsx     # Chat UI component
├── components/COWChatbotButton.tsx    # Button & modal wrapper
└── hooks/useCOWChatbot.ts            # React hook

server/
└── routes/chatbot.ts                  # Backend API routes

ml/
├── [existing ML module files]         # For predictions
└── index.ts                           # ML exports
```

## Next Steps

1. **Integrate chatbot** - Follow quick integration steps
2. **Train ML models** - Use ML module to train models
3. **Test conversations** - Ask various queries
4. **Customize responses** - Adapt to your needs
5. **Deploy** - Follow production checklist
6. **Monitor** - Track usage and performance

## Support

For implementation help:
- Check the examples in `EXAMPLE_USAGE.md`
- Review API endpoints in this guide
- Check browser/server console for errors
- Verify ML models are trained first

---

**Created**: 2024
**Version**: 1.0.0
**Status**: Production Ready
