'use client';

import { useStore } from '../store/useStore';
import { JoinForm } from '../components/JoinForm';
import { Room } from '../components/Room';

export default function Home() {
  const { roomState } = useStore();

  // Simple router based on global state
  if (roomState) {
    return <Room />;
  }

  return <JoinForm />;
}
