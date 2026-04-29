import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseWebSocketProps {
    projectId?: string;
    onMessageReceived?: (message: any) => void;
    onTypingEvent?: (event: any) => void;
    onReadReceipt?: (event: any) => void;
    onChatEvent?: (event: any) => void;
    onPresenceUpdate?: (event: any) => void;
    onNotification?: (notification: any) => void;
    onAppNotification?: (notification: any) => void;
}

export const useWebSocket = ({
    projectId,
    onMessageReceived,
    onTypingEvent,
    onReadReceipt,
    onChatEvent,
    onPresenceUpdate,
    onNotification,
    onAppNotification
}: UseWebSocketProps) => {
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                setConnected(true);
                console.log('Connected to WebSocket');

                if (projectId) {
                    // Subscribe to project-specific chat topic
                    client.subscribe(`/topic/chat/${projectId}`, (message: IMessage) => {
                        if (onMessageReceived) onMessageReceived(JSON.parse(message.body));
                    });

                    // Subscribe to project events (updates/deletes)
                    client.subscribe(`/topic/chat/${projectId}/events`, (message: IMessage) => {
                        if (onChatEvent) onChatEvent(JSON.parse(message.body));
                    });

                    // Subscribe to private messages (DMs)
                    client.subscribe('/user/queue/chat', (message: IMessage) => {
                        if (onMessageReceived) onMessageReceived(JSON.parse(message.body));
                    });

                    // Subscribe to private events
                    client.subscribe('/user/queue/chat/events', (message: IMessage) => {
                        if (onChatEvent) onChatEvent(JSON.parse(message.body));
                    });

                    // Subscribe to typing indicators
                    client.subscribe(`/topic/chat/${projectId}/typing`, (message: IMessage) => {
                        if (onTypingEvent) onTypingEvent(JSON.parse(message.body));
                    });

                    // Subscribe to read receipts
                    client.subscribe(`/topic/chat/${projectId}/read`, (message: IMessage) => {
                        if (onReadReceipt) onReadReceipt(JSON.parse(message.body));
                    });
                }

                // Subscribe to private notifications (for unread count & toasts)
                client.subscribe('/user/queue/notifications', (message: IMessage) => {
                    if (onNotification) onNotification(JSON.parse(message.body));
                });

                // Subscribe to app notifications (e.g. mentions adding to bell history)
                client.subscribe('/user/queue/app-notifications', (message: IMessage) => {
                    if (onAppNotification) onAppNotification(JSON.parse(message.body));
                });

                // Subscribe to global presence
                client.subscribe('/topic/presence', (message: IMessage) => {
                    if (onPresenceUpdate) onPresenceUpdate(JSON.parse(message.body));
                });

                // Send initial presence heartbeat
                client.publish({ destination: '/app/chat.presence' });
            },
            onDisconnect: () => {
                setConnected(false);
                console.log('Disconnected from WebSocket');
            },
            onStompError: (frame) => {
                console.error('STOMP error', frame);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        client.activate();
        stompClientRef.current = client;
    }, [projectId, onMessageReceived, onTypingEvent, onReadReceipt, onChatEvent, onNotification, onAppNotification, onPresenceUpdate]);

    const disconnect = useCallback(() => {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // Action functions
    const sendChatMessage = useCallback((content: string, type: 'TEXT' | 'FILE' | 'SYSTEM' = 'TEXT', recipientId?: string) => {
        if (stompClientRef.current?.connected && projectId) {
            stompClientRef.current.publish({
                destination: `/app/chat.send/${projectId}`,
                body: JSON.stringify({ content, messageType: type, recipientId })
            });
        }
    }, [projectId]);

    const sendTypingStatus = useCallback((typing: boolean) => {
        if (stompClientRef.current?.connected && projectId) {
            stompClientRef.current.publish({
                destination: `/app/chat.typing/${projectId}`,
                body: JSON.stringify({ typing })
            });
        }
    }, [projectId]);

    const sendHeartbeat = useCallback(() => {
        if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
                destination: '/app/chat.presence'
            });
        }
    }, []);

    return {
        connected,
        sendChatMessage,
        sendTypingStatus,
        sendHeartbeat
    };
};
