'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';


export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 向Sentry报告错误
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-2xl font-bold mb-4">发生错误</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          {/* Replace with standard button if component doesn't exist */}
          <button 
            onClick={reset} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            尝试恢复
          </button>
        </div>
      </body>
    </html>
  );
}