'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '../../../store/useStore';
import { Room } from '../../../components/Room';
import { JoinForm } from '../../../components/JoinForm';
import { useParams } from 'next/navigation';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { roomState, initSession, nickname, avatar, connect, joinRoom } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && nickname && !roomState && roomId) {
      connect();
      joinRoom(roomId, nickname, avatar);
    }
  }, [mounted, nickname, avatar, roomId, connect, joinRoom, roomState]);

  if (!mounted) return null;

  if (!roomState) {
    return <JoinForm forcedRoomId={roomId} />;
  }

  return <Room />;
}