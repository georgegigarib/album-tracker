import { useRef, useState } from 'react';
import { Button, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { BsCloudUpload, BsTrash, BsFileEarmarkMusic, BsFileEarmarkImage, BsDownload } from 'react-icons/bs';
import { formatFileSize } from '../utils/formatters';
import AudioPlayer from './AudioPlayer';

export default function FileUploader({ files, uploading, onUpload, onDelete }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList) {
    setError(null);
    for (const file of fileList) {
      try {
        await onUpload(file);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <div
        className={`border border-2 border-dashed rounded p-4 text-center mb-3 ${dragOver ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        {uploading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <>
            <BsCloudUpload size={32} className="text-muted mb-2 d-block mx-auto" />
            <p className="mb-0 text-muted">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <small className="text-muted">Audio (MP3, WAV, OGG, M4A) o imágenes (JPG, PNG, WebP)</small>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/*,image/*"
          className="d-none"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length === 0 && (
        <p className="text-muted text-center">No hay archivos subidos.</p>
      )}

      <ListGroup variant="flush">
        {files.map((file) => (
          <ListGroup.Item key={file.id} className="d-flex align-items-center gap-3 px-0">
            {file.type === 'audio' ? (
              <BsFileEarmarkMusic className="text-primary flex-shrink-0" size={20} />
            ) : (
              <BsFileEarmarkImage className="text-success flex-shrink-0" size={20} />
            )}
            <div className="flex-grow-1 overflow-hidden">
              <div className="text-truncate fw-medium">{file.name}</div>
              <small className="text-muted">{formatFileSize(file.size)}</small>
              {file.type === 'audio' && <AudioPlayer url={file.url} />}
              {file.type === 'image' && (
                <img src={file.url} alt={file.name} className="mt-1 rounded" style={{ maxHeight: 120, maxWidth: '100%' }} />
              )}
            </div>
            <div className="d-flex gap-1 flex-shrink-0">
              <Button as="a" href={file.url} target="_blank" rel="noopener" size="sm" variant="outline-primary">
                <BsDownload />
              </Button>
              <Button size="sm" variant="outline-danger" onClick={() => onDelete(file.id, file.storagePath)}>
                <BsTrash />
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
