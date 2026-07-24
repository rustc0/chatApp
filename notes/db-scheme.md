# App db scheme - beta

```
            	       users
            	 ┌───────────────┐
            	 │ id            │
            	 │ username      │
            	 │ email         │
            	 │ password_hash │
            	 │ bio           │
            	 │ avatar_url    │
            	 │ created_at    │
            	 │ updated_at    │
            	 └──────┬────────┘
            	        │
         ┌──────────────┴──────────────┐
         │                             │
         │                             │
         ▼                             ▼
      sessions                    room_members
 ┌────────────────┐         ┌────────────────────┐
 │ id             │         │ room_id (PK, FK)   │
 │ user_id (FK)   │         │ user_id (PK, FK)   │
 │ token_hash     │         │ role               │
 │ expires_at     │         │ joined_at          │
 │ last_used_at   │         └─────────┬──────────┘
 │ created_at     │                   │
 └────────────────┘                   │
                                  	  ▼
                             		rooms					 messages
                    		  ┌──────────────────┐		┌─────────────────┐
                    		  │ id               │		| id              |
                    		  │ name             │		| room_id (FK)    |
                    		  │ type             │		| sender_id (FK)  |
                    		  │ owner_id (FK)    │──────| content         |
                    		  │ created_at       │		| created_at      |
                    		  │ updated_at       │		└─────────────────┘
                    		  └──────────────────┘
                    		           
```
---

## users: stores each registred user.

### Referenced by:
- sessions.user_id
- room_members.user_id
- rooms.owner_id
- messages.sender_id
---
## sessions: stores active login sessions using hashed refresh tokens.

### Belongs to:
- **1 user**
---
## room_members: Junction table connecting users and rooms.

### Purpose:
- **Defines who belong to each room**
- **Stores each member's role**
- **Powers the user's sidebar (rooms they're in)**

### Belongs to:
- **1 user**
- **1 room**
---
## rooms: represents chat rooms in the app.

### Referenced by:
- room_members.room_id
- messages.room_id

**NB: room type can be public, prvate or dm.**

---

## messages: stores messages of a room.

### Belongs to:
- **1 room**
- **1 user (sender)**

---

## Overall Relationships:

```
User
├── Sessions
├── Owns Rooms
├── Joins Rooms (through RoomMembers)
└── Sends Messages

Room
├── Has Members
└── Contains Messages

RoomMember
└── Connects Users ↔ Rooms

Message
└── Connects a User to a Room at a specific time
```