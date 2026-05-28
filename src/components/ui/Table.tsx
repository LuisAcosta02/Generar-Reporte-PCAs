import React from 'react';

export const Table = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className="overflow-x-auto">
    <table className={`min-w-full divide-y divide-gray-200 border rounded-lg text-sm ${className}`}>
      {children}
    </table>
  </div>
);

export const Thead = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

export const Tbody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);

export const Th = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <td className={`px-4 py-2 ${className}`}>
    {children}
  </td>
);
