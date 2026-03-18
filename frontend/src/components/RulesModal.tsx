interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/10 border-b border-white/20 p-6 flex justify-between items-center shrink-0 rounded-t-2xl">
          <h2 className="text-3xl font-bold text-white">Game Rules</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white/70 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto scrollbar-indigo">
          <section>
            <h3 className="text-2xl font-semibold mb-3 text-white">Objective</h3>
            <p className="text-lg text-white/85">
              Be the last player with dice remaining. Players take turns bidding on the total number of dice showing a particular face value across all players' dice.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3 text-white">Basic Gameplay</h3>
            <ul className="list-disc list-inside space-y-2 text-lg ml-4 text-white/85">
              <li>Each player starts with 5 dice (hidden from others)</li>
              <li>Players take turns making bids: "X dice showing face value Y"</li>
              <li>Ones (1s) are wild and count as any face value (except in Palifico mode)</li>
              <li>You can either raise the bid or challenge the previous bid</li>
              <li>If challenged, all dice are revealed and counted</li>
              <li>The loser of a challenge loses one die</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3 text-white">Special Ones Bidding Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-lg ml-4 text-white/85">
              <li>
                <strong>Bidding with ones:</strong> When bidding ones (face value = 1), the quantity can be half the current bid, rounded up.
                <br />
                <span className="text-white/60 italic">Example: If current bid is "5 fours", you can bid "3 ones" (half of 5, rounded up)</span>
              </li>
              <li>
                <strong>Bidding back from ones:</strong> When bidding back to a non-one value (2-6), the quantity must be doubled.
                <br />
                <span className="text-white/60 italic">Example: If current bid is "3 ones", next bid must be at least "6 twos" (double of 3)</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3 text-white">Palifico Rule</h3>
            <p className="text-lg mb-2 text-white/85">
              When a player starts the bidding with <strong>one die</strong> (quantity = 1), Palifico mode is activated:
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg ml-4 text-white/85">
              <li>All subsequent bids in that round must use the same face value as the initial bid</li>
              <li>Ones lose their wild status and are <strong>NOT counted</strong> (only exact matches count)</li>
              <li>Palifico mode lasts until the round ends (when a challenge occurs)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3 text-white">Calza Rule <span className="text-base font-normal text-white/50">(optional)</span></h3>
            <p className="text-lg mb-2 text-white/85">
              Instead of challenging a bid with <strong>Dudo</strong>, a player may call <strong>Calza</strong> — claiming the exact count on the table matches the bid precisely.
            </p>
            <ul className="list-disc list-inside space-y-2 text-lg ml-4 text-white/85">
              <li><strong>If correct</strong> (exact match): the caller gains one die back, up to the starting amount</li>
              <li><strong>If wrong</strong>: the caller loses one die as normal</li>
              <li>If the caller is eliminated (loses their last die on a failed Calza), the bidder starts the next round</li>
              <li>Calza can be called on any bid, including during Palifico mode</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-3 text-white">Winning</h3>
            <p className="text-lg text-white/85">
              The last player with dice remaining wins the game!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
