const PHOTOS = {
  study: [
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=60',
  ],
  reading: [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=60',
  ],
  writing: [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1471100340844-8b6e5d0c0b0b?auto=format&fit=crop&w=400&q=60',
  ],
  drawing: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=400&q=60',
  ],
  place: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=60',
  ],
  walk: [
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
  ],
  ride: [
    'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=800&q=60',
  ],
  morning: [
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=400&q=60',
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=400&q=60',
  ],
} as const;

export function recapUri(kind: keyof typeof PHOTOS, slot = 0) {
  const list = PHOTOS[kind];
  return list[slot % list.length];
}
