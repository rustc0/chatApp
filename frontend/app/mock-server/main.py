from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# import httpx

app = FastAPI()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"]
)

@app.get("/api/direct-messages")
async def get_direct_messages():
	await asyncio.sleep(1)
	# raise Exception("Simulated error for testing purposes")
	return [
		{
			"id": "dm-1",
			"username": "amine",
			"lastMessage": "Did you finish the layout?",
			"timestamp": "10:42",
			"status": "online",
		},
		{
			"id": "dm-2",
			"username": "youssef",
			"lastMessage": "I will push the backend changes soon.",
			"timestamp": "09:18",
			"status": "online",
		},
		{
			"id": "dm-3",
			"username": "sara",
			"lastMessage": "That component structure looks good.",
			"timestamp": "Yesterday",
			"status": "offline",
		},
		{
			"id": "dm-4",
			"username": "adam",
			"lastMessage": "See you tomorrow.",
			"timestamp": "Yesterday",
			"status": "offline",
		},
	]


@app.get ("/api/rooms")
async def get_rooms():
	await asyncio.sleep(1)
	# raise Exception("Simulated error for testing purposes")
	return [
		{
			"id": "0",
			"name": "general",
		},
		{
			"id": "1",
			"name": "development",

		},
		{
			"id": "2",
			"name": "design",
		},
	]

@app.get("/api/rooms/{room_id}/chat")
async def get_room_messages(room_id: int):
	await asyncio.sleep(1)
	# raise Exception("Simulated error for testing purposes")
	rooms = []
	rooms.append( [
		{
		"id": "msg-1",
		"username": "amine-general",
		"content": "Hey, how's it going?",
		"timestamp": "10:42",
		},
		{
			"id": "msg-2",
			"username": "youssef-gen",
			"content": "I'm good, thanks! How about you?",
			"timestamp": "10:43",
		},
		{
			"id": "msg-3",
			"username": "amine-general",
			"content": "I'm doing well. Just working on the project. lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
			"timestamp": "10:44",
		},
		{
			"id": "msg-4",
			"username": "youssef-gen",
			"content": "That's great to hear! Let's catch up later.",
			"timestamp": "10:45",
		},
		{
			"id": "msg-5",
			"username": "amine-general",
			"content": "Sure, talk to you later!",
			"timestamp": "10:46",
		}
	] )

	rooms.append( [
		{
		"id": "msg-1",
		"username": "amine-dev",
		"content": "Hey, how's it going?",
		"timestamp": "10:42",
		},
		{
			"id": "msg-2",
			"username": "youssef-dev",
			"content": "I'm good, thanks! How about you?",
			"timestamp": "10:43",
		},
		{
			"id": "msg-3",
			"username": "amine-dev",
			"content": "I'm doing well. Just working on the project. lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
			"timestamp": "10:44",
		},
		{
			"id": "msg-4",
			"username": "youssef-dev",
			"content": "That's great to hear! Let's catch up later.",
			"timestamp": "10:45",
		},
		{
			"id": "msg-5",
			"username": "amine-dev",
			"content": "Sure, talk to you later!",
			"timestamp": "10:46",
		}
	] )

	rooms.append( [
		{
		"id": "msg-1",
		"username": "amine-design",
		"content": "Hey, how's it going?",
		"timestamp": "10:42",
		},
		{
			"id": "msg-2",
			"username": "youssef-design",
			"content": "I'm good, thanks! How about you?",
			"timestamp": "10:43",
		},
		{
			"id": "msg-3",
			"username": "amine-design",
			"content": "I'm doing well. Just working on the project. lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
			"timestamp": "10:44",
		},
		{
			"id": "msg-4",
			"username": "youssef-design",
			"content": "That's great to hear! Let's catch up later.",
			"timestamp": "10:45",
		},
		{
			"id": "msg-5",
			"username": "amine-design",
			"content": "Sure, talk to you later!",
			"timestamp": "10:46",
		}
	] )

	if room_id == 1:
		return []
		# raise Exception("Simulated error for testing purposes")


	return rooms[room_id]

@app.get("/api/rooms/{room_id}/members")
async def get_room_members(room_id: int):
	await asyncio.sleep(1)
	# raise Exception("Simulated error for testing purposes")
	members = []
	members.append( [
		{
			"username": "amine-general",
			"status": "online",
		},
		{
			"username": "youssef-gen",
			"status": "online",
		},
		{
			"username": "sara-gen",
			"status": "offline",
		},
		{
			"username": "adam-gen",
			"status": "offline",
		}
	] )

	members.append([])

	members.append([	
		{
			"username": "amine-des",
			"status": "online",
		},
		{
			"username": "youssef-des",
			"status": "online",
		},
		{
			"username": "sara-des",
			"status": "offline",
		},
		{
			"username": "adam-des",
			"status": "offline",
		}
	])
	return members[room_id]