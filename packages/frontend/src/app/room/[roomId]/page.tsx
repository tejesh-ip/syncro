'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { Room } from '../../../components/Room';
import { JoinForm } from '../../../components/JoinForm';
import { useParams } from 'next/navigation';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { roomState, initSession, nickname, avatar, isInitialized, connect, joinRoom } = useStore();

  // On mount, hydrate session from localStorage
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Only attempt auto-join once localStorage is fully loaded (isInitialized: true)
  useEffect(() => {
    // We only auto-join if they already have both a nickname AND an avatar from a previous session
    if (isInitialized && nickname && avatar && !roomState && roomId) {
      connect();
      joinRoom(roomId, nickname, avatar);
    }
  }, [isInitialized, nickname, avatar, roomId, connect, joinRoom, roomState]);

  // Don't render anything until we've checked localStorage to prevent UI flashing
  if (!isInitialized) return null;

  // If they are missing either a nickname or an avatar (or haven't joined a room state yet)
  // Force them to the JoinForm so they can pick their emoji and name
  if (!roomState || !nickname || !avatar) {
    return <JoinForm forcedRoomId={roomId} />;
  }

  return <Room />;
}