'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleUnsubscribe = async () => {
      const email = searchParams.get('email');
      const userId = searchParams.get('userId');
      if (!email || !userId) {
        setStatus('error');
        setMessage('Invalid unsubscribe link. Please contact support.');
        return;
      }
      try {
        // Call an API route to update preferences (recommended for security)
        const res = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId })
        });
        const data = await res.json();
        if (data.success) {
          setStatus('success');
          setMessage('You have been unsubscribed from promotional emails. You will still receive important transactional emails.');
        } else {
          setStatus('error');
          setMessage('Failed to unsubscribe. Please try again or contact support.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred. Please contact support.');
      }
    };
    handleUnsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Unsubscribe</h1>
        {status === 'loading' && <p className="text-center">Processing your request...</p>}
        {status === 'success' && (
          <div className="text-center text-green-700">
            <p className="mb-2">{message}</p>
            <p className="text-sm text-gray-500">You can re-subscribe anytime from your preferences page.</p>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center text-red-700">
            <p className="mb-2">{message}</p>
            <p className="text-sm text-gray-500">If you believe this is a mistake, please contact support.</p>
          </div>
        )}
      </div>
    </div>
  );
} 