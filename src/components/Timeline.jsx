import { BsCheckCircleFill, BsCircle } from 'react-icons/bs';
import { getStageLabel } from '../utils/formatters';

const STAGE_ORDER = ['recording', 'editing', 'mixing_stage', 'mastering'];

export default function Timeline({ stages, activeStage, onSelectStage }) {
  if (!stages) return null;

  return (
    <div className="d-flex align-items-center justify-content-center flex-wrap gap-0 my-3">
      {STAGE_ORDER.map((key, index) => {
        const stage = stages[key];
        if (!stage) return null;
        const isActive = activeStage === key;
        const isCompleted = stage.completed;

        return (
          <div key={key} className="d-flex align-items-center">
            <button
              type="button"
              className={`timeline-btn btn btn-link text-decoration-none p-2 d-flex flex-column align-items-center gap-1 ${isActive ? 'active' : ''}`}
              onClick={() => onSelectStage(key)}
              style={{ minWidth: 90 }}
            >
              {isCompleted ? (
                <BsCheckCircleFill size={24} className="text-success" />
              ) : (
                <BsCircle size={24} className={isActive ? 'text-primary' : 'text-secondary'} />
              )}
              <small className={`fw-semibold ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-secondary'}`}>
                {getStageLabel(key)}
              </small>
            </button>
            {index < STAGE_ORDER.length - 1 && (
              <div
                className={`${isCompleted ? 'bg-success' : 'bg-secondary bg-opacity-25'}`}
                style={{ width: 32, height: 2 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { STAGE_ORDER };
