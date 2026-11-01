'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

// Fire a one-off error toast from a Server Component.
export function ErrorToast({ message }) {
  useEffect(() => {
    toast.error(message, { id: message });
  }, [message]);
  return null;
}
