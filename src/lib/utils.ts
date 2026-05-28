/**
 * Simple utility function to join class names together.
 * Avoids extra complex dependency overhead if not needed but serves the exact function signature.
 */
export function cn(...inputs: Array<string | boolean | undefined | null>) {
  return inputs.filter(Boolean).join(" ");
}

export function getAutomaticFase(level: string, grade: string): string {
  const g = String(grade).trim().toUpperCase();
  const lvl = String(level).trim().toUpperCase();
  if (lvl === 'SD') {
    if (g === 'I' || g === 'II' || g === '1' || g === '2') return 'Fase A';
    if (g === 'III' || g === 'IV' || g === '3' || g === '4') return 'Fase B';
    if (g === 'V' || g === 'VI' || g === '5' || g === '6') return 'Fase C';
    return 'Fase B'; // default
  }
  if (lvl === 'SMP') {
    return 'Fase D';
  }
  if (lvl === 'SMA') {
    if (g === 'X' || g === '10') return 'Fase E';
    if (g === 'XI' || g === 'XII' || g === '11' || g === '12') return 'Fase F';
    return 'Fase E';
  }
  return '';
}

