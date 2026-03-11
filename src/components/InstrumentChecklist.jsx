import { Form, ListGroup, Button, Dropdown } from 'react-bootstrap';
import { BsPlusLg, BsXLg } from 'react-icons/bs';
import { ALL_INSTRUMENTS } from '../utils/instruments';

export default function InstrumentChecklist({ progress, onToggle, onAdd, onRemove }) {
  if (!progress) return null;

  const usedKeys = Object.keys(progress);
  const availableKeys = Object.keys(ALL_INSTRUMENTS).filter((k) => !usedKeys.includes(k));

  return (
    <div>
      <ListGroup variant="flush">
        {Object.entries(progress).map(([key, item]) => (
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
            <span
              className={`flex-grow-1 ${item.completed ? 'text-decoration-line-through opacity-50' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onToggle(key)}
            >
              {item.label}
            </span>
            {onRemove && (
              <Button
                size="sm"
                variant="link"
                className="p-0 opacity-25 btn-hover-danger"
                onClick={() => onRemove(key)}
                title="Quitar instrumento"
              >
                <BsXLg size={10} />
              </Button>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>

      {onAdd && availableKeys.length > 0 && (
        <Dropdown className="mt-2">
          <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100 d-flex align-items-center justify-content-center gap-1">
            <BsPlusLg size={10} />
            Agregar instrumento
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ maxHeight: 200, overflowY: 'auto' }} className="w-100 z-10">
            {availableKeys.map((key) => (
              <Dropdown.Item key={key} onClick={() => onAdd(key)}>
                {ALL_INSTRUMENTS[key]}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </div>
  );
}
