import { Modal, Button } from 'react-bootstrap';

export default function ConfirmModal({ show, title, message, confirmLabel, confirmVariant, onConfirm, onCancel }) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || 'Confirmar'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message || '¿Estás seguro?'}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant={confirmVariant || 'danger'} onClick={onConfirm}>
          {confirmLabel || 'Confirmar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
