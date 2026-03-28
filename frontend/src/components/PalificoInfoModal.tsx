interface PalificoInfoModalProps {
  onClose: () => void;
  lockedFaceValue: number;
}

export default function PalificoInfoModal({ onClose, lockedFaceValue: _lockedFaceValue }: PalificoInfoModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/10 border-b border-white/20 p-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Palifico Mode Active</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 text-white">
          <div className="mb-4">
            <p className="text-lg mb-2">
              <strong>Palifico mode</strong> was activated when a player started the bidding with <strong>one die</strong>.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-lg p-4 mb-4">
            <p className="font-semibold text-white mb-2">Rules in Palifico Mode</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-white/90">
              <li>Ones lose their wild status and are <strong>NOT counted</strong></li>
              <li>Only exact matches count (no wild ones)</li>
              <li>Palifico mode lasts until the round ends</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-white font-bold rounded-lg transition-colors btn-3d-accent"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
