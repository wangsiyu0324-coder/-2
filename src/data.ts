export interface Song {
  year: number;
  title: string;
  artist: string;
  cover: string;
  distance: string; // e.g. "10 Light Years"
  audioUrl: string;
}

export const SONGS_DATA: Song[] = [
  {
    year: 2026,
    title: "Stellar Horizon",
    artist: "The Void",
    cover: "https://picsum.photos/seed/2026/400/400",
    distance: "0 Light Years (Earth)",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    year: 2020,
    title: "Blinding Lights",
    artist: "The Weeknd",
    cover: "https://picsum.photos/seed/2020/400/400",
    distance: "6 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    year: 2015,
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    cover: "https://picsum.photos/seed/2015/400/400",
    distance: "11 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    year: 2010,
    title: "Rolling in the Deep",
    artist: "Adele",
    cover: "https://picsum.photos/seed/2010/400/400",
    distance: "16 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    year: 2000,
    title: "Stan",
    artist: "Eminem",
    cover: "https://picsum.photos/seed/2000/400/400",
    distance: "26 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
  },
  {
    year: 1991,
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    cover: "https://picsum.photos/seed/1991/400/400",
    distance: "35 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
  },
  {
    year: 1983,
    title: "Billie Jean",
    artist: "Michael Jackson",
    cover: "https://picsum.photos/seed/1983/400/400",
    distance: "43 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"
  },
  {
    year: 1977,
    title: "Stayin' Alive",
    artist: "Bee Gees",
    cover: "https://picsum.photos/seed/1977/400/400",
    distance: "49 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
  },
  {
    year: 1969,
    title: "Space Oddity",
    artist: "David Bowie",
    cover: "https://picsum.photos/seed/1969/400/400",
    distance: "57 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
  },
  {
    year: 1958,
    title: "Johnny B. Goode",
    artist: "Chuck Berry",
    cover: "https://picsum.photos/seed/1958/400/400",
    distance: "68 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
  },
  {
    year: 1942,
    title: "White Christmas",
    artist: "Bing Crosby",
    cover: "https://picsum.photos/seed/1942/400/400",
    distance: "84 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3"
  },
  {
    year: 1939,
    title: "Over the Rainbow",
    artist: "Judy Garland",
    cover: "https://picsum.photos/seed/1939/400/400",
    distance: "87 Light Years",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3"
  }
];
