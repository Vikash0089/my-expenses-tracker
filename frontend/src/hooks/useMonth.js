import { useState } from 'react';

export default function useMonth(initial) {
  const now = new Date();
  return useState(initial || { year: now.getFullYear(), month: now.getMonth() + 1 });
}
