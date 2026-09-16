export function formatValue(value: number, unit: string) {
  if (unit === '분') return value >= 60 ? `${Math.floor(value / 60)}시간 ${value % 60 ? `${value % 60}분` : ''}`.trim() : `${value}분`;
  return `${value.toLocaleString()}${unit}`;
}

export function formatMinutes(minutes: number) {
  return formatValue(Math.max(0, Math.round(minutes)), '분');
}

export function rideFromMinutes(minutes: number) {
  const km = Math.max(0, Number((minutes / 5).toFixed(1)));
  const pace = km > 0 ? minutes / km : 0;
  return { km, minutes, pace };
}

export function walkFromSteps(steps: number) {
  return {
    steps,
    km: Number((steps / 1350).toFixed(1)),
    minutes: Math.round(steps / 110),
  };
}

export function stayFromVisits(visits: number) {
  return { visits, minutes: visits * 85 };
}
