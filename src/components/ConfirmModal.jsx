import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function ConfirmModal({ show, title, message, confirmLabel, confirmVariant, onConfirm, onCancel }) {
  const { t } = useTranslation('components');
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || t('confirmModal.defaultTitle')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message || t('confirmModal.defaultMessage')}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>{t('common:cancel')}</Button>
        <Button variant={confirmVariant || 'danger'} onClick={onConfirm}>
          {confirmLabel || t('confirmModal.defaultTitle')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
