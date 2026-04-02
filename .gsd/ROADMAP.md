# Project Name: Syncro (Collaborative DJ App)

## Project Overview
A real-time web application where users can join virtual, ephemeral rooms ("clubs") to listen to music synchronously. The core mechanic is a "Round-Robin DJ Queue" where users add songs to a central playlist, and the system automatically alternates playback between different users to ensure fairness.

## Tech Stack
- **Architecture:** Monorepo (NPM Workspaces)
- **Frontend (`packages/frontend`):** Next.js (React), Tailwind CSS
- **Backend (`packages/api`):** Node.js with Express and Socket.io
- **Media Player:** YouTube IFrame Player API (Free, open access)
- **State Management:** Zustand (Frontend)

## Core Mechanics
1. **Ephemeral Rooms:** Rooms exist only as long as people are in them. When the last person leaves, the room and its queue are destroyed.
2. **Guest Access:** Users enter a nickname to join a room. No formal authentication is required for the MVP.
3. **Round-Robin Queue:**
   - The queue is organized by *Users*.
   - When a song finishes, the system picks the next song from the *next user* in the rotation.
   - If User A adds 5 songs and User B adds 1 song, the playback order will be: A1 -> B1 -> A2 -> A3 -> A4 -> A5.
   - If the queue is empty, the player stops until a new song is added.

## Roadmap & Implementation Phases

### Phase 1: Monorepo Scaffold
- [ ] Initialize NPM workspaces root.
- [ ] Create `frontend` workspace: Next.js project with Tailwind CSS.
- [ ] Create `api` workspace: Node.js + Express backend.
- [ ] Set up Socket.io server (backend) and client (frontend).

### Phase 2: Core Room & User State (Backend)
- [ ] Implement socket logic for users joining with a nickname.
- [ ] Implement Room creation and joining logic (ephemeral state in memory).
- [ ] Implement room cleanup logic (destroy room when user count hits 0).
- [ ] Implement the Round-Robin Queue data structure.
- [ ] Create socket events: `join_room`, `leave_room`, `add_song`, `queue_update`.

### Phase 3: Player Synchronization
- [ ] Integrate YouTube IFrame Player API on the frontend.
- [ ] **Lock Player UI:** Initialize the YouTube player with `controls: 0`, `disablekb: 1`, and `fs: 0`. Use CSS (`pointer-events: none`) to completely block users from interacting with the video (preventing manual pause/seek).
- [ ] Implement YouTube Data API search feature on the frontend so users can find songs.
- [ ] **Master Clock (Server-side):** The server tracks `currentSongStartTimestamp`. The server is the absolute source of truth for time.
- [ ] **Continuous Sync (Client-side):** 
  - On `now_playing` event, client calculates offset: `seekTime = Date.now() - serverStartTimestamp`.
  - If a user falls behind (e.g., due to an ad or buffering), the `onStateChange` listener detects when they return to `PLAYING` state and automatically forces a `seekTo(serverTime)` to catch them up.
- [ ] **Ad Mitigation Strategy:** If a user gets served an ad, the server's clock *does not stop*. Once their ad finishes, the client immediately seeks into the middle of the song to align with the rest of the room.
- [ ] Handle late-joiners: Sync them to the correct timestamp immediately upon joining.

### Phase 4: UI/UX Implementation
- [ ] **Landing Page:** Input fields for Nickname and Room Code, plus a "Create Room" button.
- [ ] **Room UI:** Central YouTube player, "Now Playing" metadata.
- [ ] **Participant List:** Display users currently in the room.
- [ ] **Visual Queue:** Display upcoming songs, indicating who queued what and the rotation order.

### Phase 5: Edge Cases & Polish
- [ ] Handle user disconnections (remove from rotation).
- [ ] Handle song playback errors (auto-skip if a video is unavailable).
- [ ] Implement basic text chat within the room.