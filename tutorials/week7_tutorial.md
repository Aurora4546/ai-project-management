# Week 7 In-Depth Tutorial: Real-Time Synchronization with WebSockets (Step-by-Step)

This document provides a highly technical, chronological walkthrough of the real-time communication system we implemented in Week 7. We moved beyond standard "Request-Response" APIs to a "Push" architecture, allowing messages, typing indicators, and online status to update instantly across all users without a single page refresh.

---

## 1. The Architecture of "Push" Communication

In previous weeks, if User A sent a message, User B wouldn't see it until they refreshed their page or sent their own request. In Week 7, we implemented **WebSockets** using the **STOMP** (Simple Text Oriented Messaging Protocol) sub-protocol over **SockJS**.

### Why STOMP?
Instead of sending raw bits, STOMP gives us a high-level "Pub/Sub" (Publisher/Subscriber) model. It works like a radio station:
*   **The Backend** acts as the Broadcaster.
*   **The Frontend** "Subscribes" to specific frequencies (Topics).
*   When something happens, the Backend "Publishes" to that frequency, and every listener hears it instantly.

---

## 2. Backend: Configuring the Message Broker

The heart of the system is `WebSocketConfig.java`. This file tells Spring Boot how to route messages between users.

### Step 1: Defining the Routes
We configure a "Simple Broker" that handles two types of traffic:
1.  **`/topic`**: Public broadcasts (e.g., "Everyone in Project Alpha, look at this new message").
2.  **`/queue`**: Private messages (e.g., "User B, here is a DM just for you").

```java
// Inside /config/WebSocketConfig.java

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 'topic' is for broadcasting to many, 'queue' is for one-to-one
        config.enableSimpleBroker("/topic", "/queue");
        
        // Messages sent FROM the browser TO the server must start with /app
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for private messages delivered to a specific user
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // The physical handshake URL
                .setAllowedOrigins("http://localhost:5173")
                .withSockJS(); // Fallback for browsers that don't support raw WebSockets
    }
}
```

### Step 2: Securing the Connection
Unlike REST APIs, WebSockets don't send headers with every message. We must intercept the initial "Handshake" to verify the user's JWT token. We did this in `WebSocketAuthInterceptor.java`.

```java
// Inside /config/WebSocketAuthInterceptor.java

@Override
public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
    
    // When the user first connects, we read the 'Authorization' header
    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        String token = authHeader.substring(7); // Remove "Bearer "
        
        // 1. Validate the token
        // 2. Load the user from the DB
        // 3. Inject them into the WebSocket Session
        accessor.setUser(authentication); 
    }
    return message;
}
```

---

## 3. The Controller Layer: Routing STOMP Traffic

Once the channel is open, we use a `ChatWebSocketController` to handle user actions. Instead of `@GetMapping`, we use `@MessageMapping`.

### Example: Sending a Message
When a user types a message and hits enter, the browser sends it to `/app/chat.send/{projectId}`.

```java
// Inside /controller/ChatWebSocketController.java

@MessageMapping("/chat.send/{projectId}")
public void sendMessage(@DestinationVariable UUID projectId, 
                        @Payload ChatMessageRequest request, 
                        SimpMessageHeaderAccessor headerAccessor) {
    
    // 1. Extract the verified user from the session
    User user = getUserFromAccessor(headerAccessor);
    
    // 2. Save the message to PostgreSQL (so it's permanent)
    // 3. The Business Logic layer then handles broadcasting it
    chatService.sendMessage(request, user);
}
```

The `ChatService` then uses a `SimpMessagingTemplate` to push that message out to anyone subscribed to that project's topic.

---

## 4. Frontend: The Reactive useWebSocket Hook

On the React side, managing a WebSocket connection is difficult because it must stay alive even when the component re-renders. We solved this by creating a custom hook: `useWebSocket.ts`.

### Step 1: Connecting and Subscribing
The hook uses a `useRef` to hold the STOMP Client and a `useEffect` to manage the connection lifecycle.

```typescript
// Inside frontend/src/hooks/useWebSocket.ts

export const useWebSocket = ({ projectId, onMessageReceived, ...callbacks }) => {
    const stompClientRef = useRef<Client | null>(null);

    const connect = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                // IMPORTANT: Once connected, we subscribe to our project's "frequency"
                client.subscribe(`/topic/chat/${projectId}`, (message) => {
                    const receivedMsg = JSON.parse(message.body);
                    onMessageReceived(receivedMsg); // Trigger the React UI update!
                });
            }
        });
        client.activate();
    };

    // ... cleaners and action functions ...
}
```

---

## 5. Detailed Code Example: The Full Sync Lifecycle

To truly understand Week 7, you must follow one piece of data from the **Sender** to the **Database** to the **Receiver**.

### The Flow: "User A sends 'Hello' in Project PROJ-1"

1.  **UI Level**: In `TeamChat.tsx`, User A calls `sendChatMessage("Hello")`.
2.  **Hook Level**: `useWebSocket` publishes to `/app/chat.send/PROJ-1`.
3.  **Backend Level**: `ChatWebSocketController` receives the JSON.
4.  **Service Level**: `ChatService` saves "Hello" to the `chat_messages` table and identifies which users are in `PROJ-1`.
5.  **Broadcast Level**: `ChatService` pushes the saved message to `/topic/chat/PROJ-1`.
6.  **Receiver Level**: User B's browser, which is subscribed to `/topic/chat/PROJ-1`, hears the message.
7.  **React Level**: The `onMessageReceived` callback triggers `setMessages(prev => [...prev, newMessage])`.
8.  **Render Level**: React instantly renders the new message on User B's screen.

### Typing Indicators Logic
We use the same logic for "User is typing...". When you type, we send a lightweight "Typing: true" event. 
*   **Sender**: `onKeyUp` triggers `sendTypingStatus(true)`.
*   **Receiver**: `onTypingEvent` is triggered, adding the user's name to a `typingUsers` state object.
*   **Auto-Clear**: A `setTimeout` or a "Typing: false" event clears the indicator after 3 seconds of silence.

---

## Summary of Architecture

By separating the **Configuration (Broker)**, **Security (Interceptor)**, and **Reaction (Hook)**, we have created a chat system that feels as fast as Slack or Discord, but is fully integrated with our Agile Project Management database. This allows us to @mention users or link #issues directly in the chat, which will be the foundation for the AI Summarization in Week 9!

***
