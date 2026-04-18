import { useCreateRoom } from '@/features/room/model/use-create-room'
import { RoomForm } from '@/features/room/ui/room-form'
import { Dialog } from '@/shared/ui/dialog'

type Props = {
  open: boolean
  onClose: () => void
  onCreated?: (roomId: string) => void
}

export function RoomCreateModal({ open, onClose, onCreated }: Props) {
  const createMutation = useCreateRoom()

  return (
    <Dialog
      open={open}
      onClose={() => (createMutation.isPending ? undefined : onClose())}
      ariaLabel="방 등록"
      maxWidth="max-w-xl"
      closeOnBackdrop={false}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-base font-bold tracking-[-0.02em]">방 등록</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={createMutation.isPending}
          aria-label="닫기"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--control)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      <div className="px-5 py-4">
        <RoomForm
          submitLabel="등록"
          submitting={createMutation.isPending}
          onCancel={onClose}
          onSubmit={async (payload) => {
            const created = await createMutation.mutateAsync(payload)
            onCreated?.(created.roomId)
            onClose()
          }}
        />
      </div>
    </Dialog>
  )
}
