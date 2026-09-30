import Button from '../atoms/Button.jsx'
import Icon from '../atoms/Icon.jsx'
import Modal from './Modal.jsx'

export default function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', loading, error, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} locked={loading}>
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
          <Icon name="alert" size={22} />
        </span>
        <p className="text-sm text-fg">{message}</p>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-brand">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="danger" icon="trash" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
