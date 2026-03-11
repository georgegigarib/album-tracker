import { Form, ListGroup, Button, Dropdown } from 'react-bootstrap';
import { BsPlusLg, BsXLg } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import { ALL_INSTRUMENTS, getInstrumentIcon } from '../utils/instruments';

export default function InstrumentChecklist({ progress, onToggle, onAdd, onRemove }) {
  const { t } = useTranslation('instruments');
  if (!progress) return null;

  const usedKeys = Object.keys(progress);
  const availableKeys = Object.keys(ALL_INSTRUMENTS).filter((k) => !usedKeys.includes(k));

  return (
    <div>
      <ListGroup variant="flush">
        {Object.entries(progress).map(([key, item]) => {
          const Icon = getInstrumentIcon(key);
          return (
          <ListGroup.Item
            key={key}
            className="d-flex align-items-center gap-2 px-0 py-2 border-0"
          >
            <Form.Check
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggle(key)}
              id={`instrument-${key}`}
              className="m-0"
            />
            <Icon size={16} className={item.completed ? 'opacity-50' : 'text-primary'} />
            <span
              className={`flex-grow-1 ${item.completed ? 'text-decoration-line-through opacity-50' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onToggle(key)}
            >
              {t(key)}
            </span>
            {onRemove && (
              <Button
                size="sm"
                variant="link"
                className="p-0 opacity-25 btn-hover-danger"
                onClick={() => onRemove(key)}
                title={t('removeInstrument')}
              >
                <BsXLg size={10} />
              </Button>
            )}
          </ListGroup.Item>
          );
        })}
      </ListGroup>

      {onAdd && availableKeys.length > 0 && (
        <Dropdown className="mt-2">
          <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100 d-flex align-items-center justify-content-center gap-1">
            <BsPlusLg size={10} />
            {t('addInstrument')}
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ maxHeight: 200, overflowY: 'auto' }} className="w-100 z-10">
            {availableKeys.map((key) => {
              const Icon = getInstrumentIcon(key);
              return (
              <Dropdown.Item key={key} onClick={() => onAdd(key)} className="d-flex align-items-center gap-2">
                <Icon size={14} /> {t(key)}
              </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </div>
  );
}
