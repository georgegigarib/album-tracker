import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, InputGroup, Button, ListGroup } from 'react-bootstrap';
import { BsPlusLg, BsTrash, BsLink45Deg, BsBoxArrowUpRight, BsPlayCircleFill, BsChevronUp, BsStarFill, BsStar } from 'react-icons/bs';
import { getGoogleDriveFileId } from '../utils/formatters';
import DriveAudioPlayer from './DriveAudioPlayer';

export default function LinksList({ links, onAdd, onDelete, onSetLatestDemo }) {
  const { t } = useTranslation('components');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [expandedPlayers, setExpandedPlayers] = useState({});

  function togglePlayer(id) {
    setExpandedPlayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!url.trim()) return;
    const linkTitle = title.trim() || url.trim();
    let linkUrl = url.trim();
    if (!/^https?:\/\//i.test(linkUrl)) linkUrl = 'https://' + linkUrl;
    onAdd(linkTitle, linkUrl);
    setTitle('');
    setUrl('');
  }

  return (
    <div>
      <Form onSubmit={handleAdd} className="mb-3">
        <Form.Control
          size="sm"
          placeholder={t('linksList.namePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2"
        />
        <InputGroup size="sm">
          <InputGroup.Text><BsLink45Deg /></InputGroup.Text>
          <Form.Control
            placeholder={t('linksList.urlPlaceholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={!url.trim()}>
            <BsPlusLg />
          </Button>
        </InputGroup>
      </Form>

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
