import { useTranslation } from 'react-i18next';

export default function AudioPlayer({ url }) {
  const { t } = useTranslation('components');
  return (
    <audio controls preload="none" className="w-100 mt-1" style={{ height: 32 }}>
      <source src={url} />
      {t('audioPlayer.notSupported')}
    </audio>
  );
}
