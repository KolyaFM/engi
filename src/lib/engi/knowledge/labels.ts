export function pluralObjects(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${count} объектов`;
  if (rem > 1 && rem < 5) return `${count} объекта`;
  if (rem === 1) return `${count} объект`;
  return `${count} объектов`;
}

export function pluralSubtags(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `+${count} подтегов`;
  if (rem === 1) return `+${count} подтег`;
  if (rem > 1 && rem < 5) return `+${count} подтега`;
  return `+${count} подтегов`;
}

