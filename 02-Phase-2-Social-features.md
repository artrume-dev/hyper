# System Design Document (SDD) - Phase 2
## Social Features & Real-time Communication

**Phase:** 2 - Social & Communication  
**Duration:** 3 weeks  
**Priority:** P1 (High)  
**Status:** Planning

---

## Phase 2 Overview

### Goals
- Implement follow/unfollow system
- Build real-time messaging with Socket.io
- Create notification system
- Develop activity feed
- Implement team messaging channels

### Dependencies
- Phase 1 completed (user profiles, teams, invitations)

### Success Criteria
- [ ] Follow system functional
- [ ] Real-time messaging working
- [ ] Notifications delivered in real-time
- [ ] Activity feed displays updates
- [ ] Team channels operational

---

## Architecture Updates

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│         Socket.io Client (Real-time Events)                 │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket (WSS)
┌────────────────────────▼────────────────────────────────────┐
│                  Socket.io Server                           │
│      Event Handlers + Room Management                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Message & Notification Services                │
│         Redis Pub/Sub (Optional for scaling)                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Database Layer                           │
│        Messages, Notifications, Follows, Activity           │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Tasks

### Task 2.1: Follow System
**Branch:** `feature/2.1-follow-system`  
**Estimated Time:** 3 days  
**Assignee:** TBD

#### Subtasks
- [ ] Create follow/unfollow service
- [ ] Build follow/unfollow endpoints
- [ ] Create followers/following lists
- [ ] Add follow button component
- [ ] Implement follow notifications
- [ ] Write tests

#### Technical Specifications

**Follow Service (backend/src/services/follow.service.ts):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FollowService {
  async followUser(followerId: string, followingId: string) {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }
    
    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    
    if (existing) {
      throw new Error('Already following this user');
    }
    
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      },
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });
    
    // TODO: Create notification
    
    return follow;
  }
  
  async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    
    if (!follow) {
      throw new Error('Not following this user');
    }
    
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    
    return { success: true };
  }
  
  async getFollowers(userId: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    return await prisma.follow.findMany({
      where: { followingId: userId },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        follower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            role: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async getFollowing(userId: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    return await prisma.follow.findMany({
      where: { followerId: userId },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            role: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });
    
    return !!follow;
  }
}
```

**Follow Button Component (frontend/src/components/Follow/FollowButton.tsx):**
```typescript
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { followApi } from '../../services/api/follow.api';
import { useAuthStore } from '../../stores/auth.store';

interface FollowButtonProps {
  userId: string;
  variant?: 'contained' | 'outlined' | 'text';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  variant = 'outlined'
}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  
  const { data: isFollowing } = useQuery({
    queryKey: ['follow', 'status', userId],
    queryFn: () => followApi.isFollowing(userId),
    enabled: !!currentUser && currentUser.id !== userId
  });
  
  const followMutation = useMutation({
    mutationFn: () => followApi.follow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow', 'status', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
  });
  
  const unfollowMutation = useMutation({
    mutationFn: () => followApi.unfollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow', 'status', userId] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
  });
  
  if (!currentUser || currentUser.id === userId) {
    return null;
  }
  
  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };
  
  return (
    <Button
      variant={variant}
      onClick={handleClick}
      disabled={followMutation.isPending || unfollowMutation.isPending}
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
};
```

#### API Endpoints
- `POST /api/follow/:userId` - Follow user
- `DELETE /api/follow/:userId` - Unfollow user
- `GET /api/follow/:userId/followers` - Get followers
- `GET /api/follow/:userId/following` - Get following
- `GET /api/follow/:userId/status` - Check if following

#### Acceptance Criteria
- Users can follow/unfollow others
- Follower counts update correctly
- Lists display properly
- Self-follow prevented
- Notifications sent on follow

---

### Task 2.2: Real-time Messaging System
**Branch:** `feature/2.2-realtime-messaging`  
**Estimated Time:** 6 days  
**Assignee:** TBD

#### Subtasks
- [ ] Set up Socket.io server
- [ ] Implement Socket.io client
- [ ] Create message service
- [ ] Build chat interface
- [ ] Add typing indicators
- [ ] Implement read receipts
- [ ] Add online status
- [ ] Write tests

#### Technical Specifications

**Socket.io Server Setup (backend/src/socket/index.ts):**
```typescript
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class SocketServer {
  private io: Server;
  private userSockets: Map<string, string> = new Map();
  
  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
      }
    });
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }
  
  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const decoded = authService.verifyToken(token);
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      this.userSockets.set(userId, socket.id);
      
      console.log(`User ${userId} connected`);
      
      // Broadcast online status
      socket.broadcast.emit('user:online', { userId });
      
      // Join user's personal room
      socket.join(`user:${userId}`);
      
      // Message events
      socket.on('message:send', (data) => this.handleSendMessage(socket, data));
      socket.on('message:typing', (data) => this.handleTyping(socket, data));
      socket.on('message:read', (data) => this.handleMessageRead(socket, data));
      
      // Team chat events
      socket.on('team:join', (teamId) => socket.join(`team:${teamId}`));
      socket.on('team:leave', (teamId) => socket.leave(`team:${teamId}`));
      socket.on('team:message', (data) => this.handleTeamMessage(socket, data));
      
      // Disconnect
      socket.on('disconnect', () => {
        this.userSockets.delete(userId);
        socket.broadcast.emit('user:offline', { userId });
        console.log(`User ${userId} disconnected`);
      });
    });
  }
  
  private async handleSendMessage(socket: Socket, data: {
    receiverId: string;
    content: string;
  }) {
    const senderId = socket.data.userId;
    
    // Save message to database
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: data.receiverId,
        content: data.content
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });
    
    // Send to receiver
    this.io.to(`user:${data.receiverId}`).emit('message:new', message);
    
    // Confirm to sender
    socket.emit('message:sent', message);
  }
  
  private handleTyping(socket: Socket, data: { receiverId: string }) {
    const senderId = socket.data.userId;
    this.io.to(`user:${data.receiverId}`).emit('message:typing', {
      userId: senderId
    });
  }
  
  private async handleMessageRead(socket: Socket, data: { messageId: string }) {
    await prisma.message.update({
      where: { id: data.messageId },
      data: { isRead: true, readAt: new Date() }
    });
    
    const message = await prisma.message.findUnique({
      where: { id: data.messageId }
    });
    
    if (message) {
      this.io.to(`user:${message.senderId}`).emit('message:read', {
        messageId: data.messageId
      });
    }
  }
  
  private async handleTeamMessage(socket: Socket, data: {
    teamId: string;
    content: string;
  }) {
    const senderId = socket.data.userId;
    
    // TODO: Save team message to database
    
    // Broadcast to team room
    this.io.to(`team:${data.teamId}`).emit('team:message:new', {
      teamId: data.teamId,
      senderId,
      content: data.content,
      createdAt: new Date()
    });
  }
  
  getIO() {
    return this.io;
  }
  
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
```

**Socket.io Client Setup (frontend/src/services/socket.service.ts):**
```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token }
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  sendMessage(receiverId: string, content: string) {
    if (this.socket) {
      this.socket.emit('message:send', { receiverId, content });
    }
  }
  
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }
  
  onMessageSent(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('message:sent', callback);
    }
  }
  
  sendTyping(receiverId: string) {
    if (this.socket) {
      this.socket.emit('message:typing', { receiverId });
    }
  }
  
  onTyping(callback: (data: { userId: string }) => void) {
    if (this.socket) {
      this.socket.on('message:typing', callback);
    }
  }
  
  markAsRead(messageId: string) {
    if (this.socket) {
      this.socket.emit('message:read', { messageId });
    }
  }
  
  onMessageRead(callback: (data: { messageId: string }) => void) {
    if (this.socket) {
      this.socket.on('message:read', callback);
    }
  }
  
  joinTeam(teamId: string) {
    if (this.socket) {
      this.socket.emit('team:join', teamId);
    }
  }
  
  leaveTeam(teamId: string) {
    if (this.socket) {
      this.socket.emit('team:leave', teamId);
    }
  }
  
  sendTeamMessage(teamId: string, content: string) {
    if (this.socket) {
      this.socket.emit('team:message', { teamId, content });
    }
  }
  
  onTeamMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('team:message:new', callback);
    }
  }
  
  onUserOnline(callback: (data: { userId: string }) => void) {
    if (this.socket) {
      this.socket.on('user:online', callback);
    }
  }
  
  onUserOffline(callback: (data: { userId: string }) => void) {
    if (this.socket) {
      this.socket.on('user:offline', callback);
    }
  }
}

export const socketService = new SocketService();
```

**Chat Interface (frontend/src/components/Chat/ChatWindow.tsx):**
```typescript
import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { messageApi } from '../../services/api/message.api';
import { socketService } from '../../services/socket.service';
import { useAuthStore } from '../../stores/auth.store';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  recipientId,
  recipientName,
  recipientAvatar
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore(state => state.user);
  
  const { data: initialMessages } = useQuery({
    queryKey: ['messages', recipientId],
    queryFn: () => messageApi.getConversation(recipientId)
  });
  
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  
  useEffect(() => {
    socketService.onNewMessage((msg) => {
      if (msg.senderId === recipientId) {
        setMessages(prev => [...prev, msg]);
        socketService.markAsRead(msg.id);
      }
    });
    
    socketService.onMessageSent((msg) => {
      setMessages(prev => [...prev, msg]);
    });
    
    socketService.onTyping((data) => {
      if (data.userId === recipientId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
    
    return () => {
      // Cleanup listeners
    };
  }, [recipientId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (message.trim()) {
      socketService.sendMessage(recipientId, message);
      setMessage('');
    }
  };
  
  const handleTyping = () => {
    socketService.sendTyping(recipientId);
  };
  
  return (
    <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center">
          <Avatar src={recipientAvatar} sx={{ mr: 2 }}>
            {recipientName[0]}
          </Avatar>
          <Typography variant="h6">{recipientName}</Typography>
        </Box>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg) => (
          <ListItem
            key={msg.id}
            sx={{
              justifyContent: msg.senderId === currentUser?.id ? 'flex-end' : 'flex-start'
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '70%',
                bgcolor: msg.senderId === currentUser?.id ? 'primary.main' : 'grey.200',
                color: msg.senderId === currentUser?.id ? 'white' : 'text.primary'
              }}
            >
              <Typography variant="body2">{msg.content}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </Typography>
            </Paper>
          </ListItem>
        ))}
        {isTyping && (
          <ListItem>
            <Typography variant="body2" color="text.secondary">
              {recipientName} is typing...
            </Typography>
          </ListItem>
        )}
        <div ref={messagesEndRef} />
      </List>
      
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex' }}>
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onInput={handleTyping}
        />
        <IconButton onClick={handleSend} color="primary">
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};
```

#### API Endpoints
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:userId` - Get conversation with user
- `POST /api/messages` - Send message (fallback for REST)
- `PUT /api/messages/:id/read` - Mark as read

#### Acceptance Criteria
- Real-time message delivery works
- Typing indicators functional
- Read receipts working
- Messages persist in database
- Online status displayed
- Chat history loads correctly

---

### Task 2.3: Notification System
**Branch:** `feature/2.3-notifications`  
**Estimated Time:** 4 days  
**Assignee:** TBD

#### Subtasks
- [ ] Design notification schema
- [ ] Create notification service
- [ ] Build notification endpoints
- [ ] Create notification UI component
- [ ] Implement real-time notifications
- [ ] Add notification preferences
- [ ] Write tests

#### Technical Specifications

**Notification Schema (Add to prisma/schema.prisma):**
```prisma
enum NotificationType {
  FOLLOW
  INVITATION_RECEIVED
  INVITATION_ACCEPTED
  TEAM_INVITE
  MESSAGE
  TEAM_MESSAGE
}

model Notification {
  id          String           @id @default(uuid())
  userId      String
  type        NotificationType
  title       String
  message     String
  link        String?
  isRead      Boolean          @default(false)
  readAt      DateTime?
  metadata    Json?
  createdAt   DateTime         @default(now())
  
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
```

**Notification Service (backend/src/services/notification.service.ts):**
```typescript
import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) {
    const notification = await prisma.notification.create({
      data
    });
    
    // Emit via Socket.io
    // socketServer.getIO().to(`user:${data.userId}`).emit('notification:new', notification);
    
    return notification;
  }
  
  async getUserNotifications(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };
    
    if (options?.unreadOnly) {
      where.isRead = false;
    }
    
    return await prisma.notification.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() }
    });
  }
  
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }
  
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    });
  }
  
  // Helper methods for common notifications
  async notifyFollow(followerId: string, followingId: string) {
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { firstName: true, lastName: true }
    });
    
    return this.createNotification({
      userId: followingId,
      type: 'FOLLOW',
      title: 'New Follower',
      message: `${follower?.firstName} ${follower?.lastName} started following you`,
      link: `/profile/${followerId}`
    });
  }
  
  async notifyInvitation(invitationId: string, senderId: string, receiverId: string) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true }
    });
    
    return this.createNotification({
      userId: receiverId,
      type: 'INVITATION_RECEIVED',
      title: 'New Invitation',
      message: `${sender?.firstName} ${sender?.lastName} sent you an invitation`,
      link: `/invitations/${invitationId}`
    });
  }
}
```

**Notification Bell Component (frontend/src/components/Notifications/NotificationBell.tsx):**
```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Divider
} from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { notificationApi } from '../../services/api/notification.api';
import { socketService } from '../../services/socket.service';

export const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();
  
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getNotifications
  });
  
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 30000 // Refresh every 30s
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    }
  });
  
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    }
  });
  
  React.useEffect(() => {
    socketService.onNewNotification((notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });
  }, [queryClient]);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Notifications</Typography>
          <Button
            size="small"
            onClick={() => markAllAsReadMutation.mutate()}
          >
            Mark all read
          </Button>
        </Box>
        <Divider />
        
        {notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={() => {
                markAsReadMutation.mutate(notif.id);
                handleClose();
              }}
              sx={{ bgcolor: notif.isRead ? 'transparent' : 'action.hover' }}
            >
              <Box>
                <Typography variant="subtitle2">{notif.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {notif.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2">No notifications</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
```

#### API Endpoints
- `GET /api