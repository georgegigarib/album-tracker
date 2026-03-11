import { Card, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import SubtaskList from './SubtaskList';
import NotesList from './NotesList';
import LinksList from './LinksList';
import InstrumentChecklist from './InstrumentChecklist';

const STAGES_WITH_INSTRUMENTS = ['recording', 'editing', 'mixing_stage'];

export default function StagePanel({
  stageKey,
  stage,
  onToggleStage,
  // Instruments
  progress,
  onToggleInstrument,
  onAddInstrument,
  onRemoveInstrument,
  // Subtasks
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  // Notes
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  // Links
  links,
  onAddLink,
  onDeleteLink,
}) {
  const { t } = useTranslation('songDetail');
  const showInstruments = STAGES_WITH_INSTRUMENTS.includes(stageKey);

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-3">
        <h5 className="mb-0">{t(`common:stages.${stageKey}`)}</h5>
        <Form.Check
          type="switch"
          id={`stage-toggle-${stageKey}`}
          label={stage?.completed ? t('completed') : t('pending')}
          checked={stage?.completed || false}
          onChange={onToggleStage}
          className="ms-auto"
        />
      </div>

      {showInstruments && progress && (
        <Card className="shadow-sm mb-3">
          <Card.Header className="fw-semibold py-2">{t('instruments')}</Card.Header>
          <Card.Body className="py-2">
            <InstrumentChecklist
              progress={progress}
              onToggle={onToggleInstrument}
              onAdd={onAddInstrument}
              onRemove={onRemoveInstrument}
            />
          </Card.Body>
        </Card>
      )}

      <Card className="shadow-sm mb-3">
        <Card.Header className="fw-semibold py-2">{t('subtasks')}</Card.Header>
        <Card.Body className="py-2">
          <SubtaskList
            subtasks={subtasks}
            onAdd={onAddSubtask}
            onToggle={onToggleSubtask}
            onDelete={onDeleteSubtask}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-3">
        <Card.Header className="fw-semibold py-2">{t('notes')}</Card.Header>
        <Card.Body className="py-2">
          <NotesList
            notes={notes}
            onAdd={onAddNote}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="fw-semibold py-2">{t('links')}</Card.Header>
        <Card.Body className="py-2">
          <LinksList
            links={links}
            onAdd={onAddLink}
            onDelete={onDeleteLink}
          />
        </Card.Body>
      </Card>
    </div>
  );
}
