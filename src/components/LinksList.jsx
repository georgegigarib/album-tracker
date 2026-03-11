import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, InputGroup, Button, ListGroup } from 'react-bootstrap';
import { BsPlusLg, BsTrash, BsLink45Deg, BsBoxArrowUpRight } from 'react-icons/bs';

export default function LinksList({ links, onAdd, onDelete }) {
  const { t } = useTranslation('components');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

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
        {links.map((link) => (
          <ListGroup.Item key={link.id} className="d-flex align-items-center gap-2 px-0 py-2 border-0">
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
            <Button
              size="sm"
              variant="link"
              className="p-0 text-danger flex-shrink-0"
              onClick={() => onDelete(link.id)}
            >
              <BsTrash size={14} />
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
