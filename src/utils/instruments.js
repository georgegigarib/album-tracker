import i18n from '../i18n/i18n';
import {
  GiGuitar,
  GiGuitarBassHead,
  GiDrumKit,
  GiMicrophone,
  GiPianoKeys,
  GiSaxophone,
  GiViolin,
  GiDjembe,
  GiSoundWaves,
  GiMusicalScore,
  GiTrumpet,
  GiGuitarHead,
  GiChurch,
  GiFlute,
  GiHarp,
  GiProcessor,
} from 'react-icons/gi';
import { BsMusicNote } from 'react-icons/bs';

export const INSTRUMENT_KEYS = [
  'guitars',
  'bass',
  'drums',
  'vocals',
  'keys',
  'winds',
  'strings',
  'percussion',
  'sfx',
  'synths',
  'samples',
  'choir',
  'brass',
  'acoustic_guitar',
  'electric_guitar',
  'piano',
  'organ',
  'harmonica',
  'flute',
  'violin',
  'cello',
  'harp',
  'turntables',
  'programming',
];

export const INSTRUMENT_ICONS = {
  guitars: GiGuitar,
  bass: GiGuitarBassHead,
  drums: GiDrumKit,
  vocals: GiMicrophone,
  keys: GiPianoKeys,
  winds: GiSaxophone,
  strings: GiViolin,
  percussion: GiDjembe,
  sfx: GiSoundWaves,
  synths: GiProcessor,
  samples: GiMusicalScore,
  choir: GiMusicalScore,
  brass: GiTrumpet,
  acoustic_guitar: GiGuitar,
  electric_guitar: GiGuitarHead,
  piano: GiPianoKeys,
  organ: GiChurch,
  harmonica: GiChurch,
  flute: GiFlute,
  violin: GiViolin,
  cello: GiViolin,
  harp: GiHarp,
  turntables: GiProcessor,
  programming: GiProcessor,
};

export function getInstrumentIcon(key) {
  return INSTRUMENT_ICONS[key] || BsMusicNote;
}

export function getInstrumentLabel(key) {
  return i18n.t(`instruments:${key}`, { defaultValue: key });
}

// Object with all instrument keys - values are keys themselves
// Use getInstrumentLabel() or t() for display
export const ALL_INSTRUMENTS = Object.fromEntries(INSTRUMENT_KEYS.map((key) => [key, key]));
