'use client';

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { JoinForm } from '../components/JoinForm';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { initSession } = useStore();

  useEffect(() => {
    initSession();
  }, [initSession]);

  return <JoinForm />;
}
