'use client';

import { LogOut } from 'lucide-react';
import { abmeldenAction } from '@/lib/actions/konto';

export function AbmeldenButton() {
  return (
    <form action={abmeldenAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand/50 transition-colors hover:text-red-600"
      >
        <LogOut className="h-3.5 w-3.5" />
        Abmelden
      </button>
    </form>
  );
}
