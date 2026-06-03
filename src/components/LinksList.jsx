import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ListGroup } from 'react-bootstrap';
import { BsPlusLg, BsTrash, BsLink45Deg, BsBoxArrowUpRight, BsPlayCircleFill, BsChevronUp, BsStarFill, BsStar } from 'react-icons/bs';
import { getGoogleDriveFileId } from '../utils/formatters';
import DriveAudioPlayer from './DriveAudioPlayer';

export default function LinksList({ links, onAdd, onDelete, onSetLatestDemo }) {
  const { t } = useTranslation('components');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [urlFocused, setUrlFocused] = useState(false);
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const titleRef = useRef(null);

  function togglePlayer(id) {
    setExpandedPlayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAdd() {
    if (!url.trim()) return;
    const linkTitle = title.trim() || url.trim();
    let linkUrl = url.trim();
    if (!/^https?:\/\//i.test(linkUrl)) linkUrl = 'https://' + linkUrl;
    onAdd(linkTitle, linkUrl);
    setTitle('');
    setUrl('');
  }

  function handleUrlKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (url.trim()) {
        if (titleRef.current) titleRef.current.focus();
      }
    }
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  const canAdd = url.trim().length > 0;

  return (
    <div>
      {/* Add link form */}
      <div
        className="mb-3 rounded-2 p-2"
        style={{ border: `1px solid ${urlFocused ? 'var(--bs-primary)' : 'var(--bs-border-color)'}`, background: 'var(--app-surface)', transition: 'border-color 0.15s' }}
      >
        <div className="d-flex align-items-center gap-2">
          <BsLink45Deg style={{ color: 'var(--bs-secondary)', flexShrink: 0, opacity: 0.6 }} />
          <input
            type="text"
            placeholder={t('linksList.urlPlaceholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setUrlFocused(false)}
            className="bare-input"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--bs-body-color)',
            }}
          />
        </div>
        {url.trim() && (
          <>
            <div className="mt-2 pt-2 d-flex align-items-center gap-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
              <input
                ref={titleRef}
                type="text"
                placeholder={t('linksList.namePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="bare-input"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 13, color: 'var(--bs-body-color)', opacity: 0.8,
                }}
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                style={{
                  border: 'none', borderRadius: 20, padding: '4px 12px',
                  background: canAdd ? 'var(--bs-primary)' : 'var(--bs-border-color)',
                  color: 'white', fontSize: 12, cursor: canAdd ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              >
                <BsPlusLg size={10} /> Añadir
              </button>
            </div>
          </>
        )}
      </div>

      {links.length === 0 && (
        <p className="text-secondary text-center small py-2 mb-0">{t('linksList.empty')}</p>
      )}

      <ListGroup variant="flush">
        {links.map((link) => {
          const fileId = getGoogleDriveFileId(link.url);
          const isExpanded = !!expandedPlayers[link.id];
          return (
            <ListGroup.Item key={link.id} className="px-0 py-2 border-0">
              <div className="d-flex align-items-center gap-2">
                <BsLink45Deg className="text-primary flex-shrink-0" />
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow-1 text-truncate"
                >
                  {link.title || link.url}
                  <BsBoxArrowUpRight size={10} className="ms-1 opacity-50" />
                </a>
                {fileId && onSetLatestDemo && (
                  <Button
                    size="sm"
                    variant="link"
                    className="p-0 flex-shrink-0"
                    style={{ color: link.isLatestDemo ? '#f5a623' : 'var(--bs-secondary-color)' }}
                    title={link.isLatestDemo ? 'Quitar como demo principal' : 'Marcar como demo principal'}
                    onClick={() => onSetLatestDemo(link.isLatestDemo ? null : link.id)}
                  >
                    {link.isLatestDemo ? <BsStarFill size={14} /> : <BsStar size={14} />}
                  </Button>
                )}
                {fileId && (
                  <Button
                    size="sm"
                    variant="link"
                    className="p-0 text-success flex-shrink-0"
                    title={isExpanded ? t('linksList.hidePlayer') : t('linksList.playInApp')}
                    onClick={() => togglePlayer(link.id)}
                  >
                    {isExpanded ? <BsChevronUp size={14} /> : <BsPlayCircleFill size={16} />}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="link"
                  className="p-0 text-danger flex-shrink-0"
                  onClick={() => onDelete(link.id)}
                >
                  <BsTrash size={14} />
                </Button>
              </div>
              {fileId && isExpanded && (
                <DriveAudioPlayer fileId={fileId} />
              )}
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </div>
  );
}
