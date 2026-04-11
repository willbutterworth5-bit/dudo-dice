import type { ReactNode } from 'react';

export function RulesContent() {
  return (
    <div className="space-y-6">
      <p className="text-white/70 text-base">Liar's Dice (also known as Perudo or Dudo) is a bluffing dice game where the last player with dice remaining wins.</p>
      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Winning</h3>
        <p className="text-lg text-white/85">
          The last player with dice remaining wins the game!
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
            <strong>Bidding with ones:</strong> When bidding ones (face value = 1), the quantity must be more than half the current bid — specifically, at least ⌊current ÷ 2⌋ + 1.
            <br />
            <span className="text-white/60 italic">Examples: "5 fours" → minimum "3 ones" (floor of 2.5, +1); "4 fours" → minimum "3 ones" (floor of 2, +1)</span>
          </li>
          <li>
            <strong>Bidding back from ones:</strong> When bidding back to a non-one value (2–6), the quantity must be doubled.
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

    </div>
  );
}

export function FaqContent() {
  const faqs: { q: string; a: ReactNode }[] = [
    {
      q: 'What is Perudo?',
      a: (
        <p>Perudo is the original South American liar's dice game that Dudo Dice is based on. It's also known as Dudo, Cacho, or simply Liar's Dice. The game originated in the Andes and was popularised globally after Richard Borg's 1993 board game release.</p>
      ),
    },
    {
      q: 'What does "Dudo" mean?',
      a: (
        <p>Dudo means <em>"I doubt it"</em> in Spanish. Calling Dudo challenges the previous player's bid — all dice are revealed and counted. If the bid was wrong, the bidder loses a die. If it was correct, the challenger loses a die.</p>
      ),
    },
    {
      q: 'What are the difficulty levels?',
      a: (
        <>
          <p className="mb-2">There are three AI difficulty settings:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Easy</strong> — The AI makes conservative bids and challenges frequently. Great for learning the game.</li>
            <li><strong>Medium</strong> — Balanced play. The AI bluffs occasionally and reads the table reasonably well.</li>
            <li><strong>Hard</strong> — The AI tracks dice counts, bluffs strategically, and challenges with precision. Winning on Hard earns the <strong>Hard Mode</strong> achievement.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'How does the Elo rating system work?',
      a: (
        <>
          <p className="mb-2">Elo is a competitive rating for online multiplayer matches with 3 or more human players. It tracks your skill level over time.</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>All players start at <strong>1500</strong>.</li>
            <li>After each ranked match, ratings adjust based on where you finished and who you beat.</li>
            <li>Beating a higher-rated player earns more Elo; losing to a lower-rated player costs more.</li>
            <li>Games with only 2 human players are always <strong>casual</strong> — no Elo changes.</li>
            <li>Bots do not affect Elo calculations.</li>
            <li>If you disconnect from a ranked match and don't reconnect within 60 seconds, it counts as a last-place loss.</li>
            <li>Your rating is marked <strong>provisional</strong> for the first 10 ranked games while it settles.</li>
          </ul>
        </>
      ),
    },
    {
      q: 'How do achievements work?',
      a: (
        <>
          <p className="mb-2">Achievements are earned by hitting specific milestones in single-player or multiplayer games. They're saved locally to your profile.</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>First Roll</strong> — Play your first game</li>
            <li><strong>First Win</strong> — Win your first game</li>
            <li><strong>Dudo!</strong> — Make a successful Dudo call</li>
            <li><strong>Last Stand</strong> — Win a game from 1 die</li>
            <li><strong>Untouchable</strong> — Win without losing any dice</li>
            <li><strong>Calza!</strong> — Make a successful Calza call</li>
            <li><strong>Sharp Shooter</strong> — 5 successful Dudos in one game</li>
            <li><strong>Hard Mode</strong> — Win on Hard difficulty</li>
            <li><strong>On A Roll</strong> — Win 3 games in a row</li>
            <li><strong>Champion</strong> — Win 10 games</li>
            <li><strong>Dudo Master</strong> — Make 25 successful Dudo calls</li>
            <li><strong>Veteran</strong> — Play 50 games</li>
          </ul>
          <p className="mt-2 text-white/60 text-sm">A toast notification appears when you unlock a new achievement.</p>
        </>
      ),
    },
    {
      q: 'Are 1s always wild?',
      a: (
        <>
          <p className="mb-2">Yes — in normal play, 1s count as any face value. For example, if someone bids "4 fives", the count includes all 5s <em>plus</em> all 1s.</p>
          <p>The exception is <strong>Palifico mode</strong>: when a player with exactly 1 die starts a round, 1s lose their wild status for that entire round and only count as face value 1.</p>
        </>
      ),
    },
    {
      q: 'Can I play offline?',
      a: (
        <p>Yes! Single-player mode lets you play against 1–5 AI opponents with no internet required after the page loads. Your stats and achievements are saved locally in your browser.</p>
      ),
    },
    {
      q: 'Is my profile saved?',
      a: (
        <>
          <p className="mb-2">Your profile (name, avatar, stats, achievements, and Elo rating) is stored in your browser's local storage by default. It persists across sessions but is tied to your device and browser — clearing your browser data will reset it.</p>
          <p>To keep your profile safe and sync it across devices, create a free account with your email address. Hit <strong>Sign In / Create Account</strong> on the Profile screen, sign up with your email, then confirm the link sent to your inbox. Once signed in, your profile syncs to your account automatically.</p>
        </>
      ),
    },
    {
      q: "How do I join a friend's game?",
      a: (
        <>
          <p className="mb-2">The host of a private room can share the 4-letter room code. Your friend can enter it in the <strong>Join Room</strong> tab on the Online screen, or visit <code className="bg-white/10 px-1 rounded text-sm">dudodice.com/online/join/CODE</code>.</p>
          <p>Public rooms appear in the <strong>Browse</strong> tab — anyone can join directly.</p>
        </>
      ),
    },
    {
      q: 'What happens if I leave a game early?',
      a: (
        <>
          <p className="mb-2">If you disconnect, a 60-second timer starts. If you reconnect in time, you rejoin seamlessly. If not:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>An AI takes over your dice and continues playing</li>
            <li>In a <strong>ranked match</strong>, your rating takes a last-place loss penalty</li>
            <li>In a <strong>casual match</strong>, no rating is affected</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {faqs.map(({ q, a }, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold text-lg mb-2">{q}</h3>
          <div className="text-white/80 text-base leading-relaxed">{a}</div>
        </div>
      ))}
    </div>
  );
}
