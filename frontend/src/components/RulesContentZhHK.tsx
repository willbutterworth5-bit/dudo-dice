import type { ReactNode } from 'react';

export function RulesContentZhHK() {
  return (
    <div className="space-y-6">
      <p className="text-white/70 text-base">騙子骰係一款虛張聲勢嘅骰子遊戲，最後手上仍有骰子嘅玩家即為勝利者。</p>
      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">勝利條件</h3>
        <p className="text-lg text-white/85">
          最後仍持有骰子嘅玩家贏得遊戲！
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">基本玩法</h3>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li>每位玩家起始有 5 粒骰子（對其他玩家保密）</li>
          <li>玩家輪流出注：「有 X 粒骰子係 Y 點」</li>
          <li>么點（1點）係萬能骰，可計入任何點數（Palifico 模式除外）</li>
          <li>你可以加注，或者挑戰上一位玩家嘅出注</li>
          <li>加注時可以增加骰子數量、提高點數，或兩者同時改變——但至少要改變其中一項</li>
          <li>被挑戰時，所有骰子會被翻開並計算</li>
          <li>挑戰輸嘅一方失去一粒骰子</li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">么點出注特別規則</h3>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li>
            <strong>出注么點：</strong>出注么點（點數 = 1）時，數量必須超過當前出注數量嘅一半——具體係至少 ⌊當前數量 ÷ 2⌋ + 1。
            <br />
            <span className="text-white/60 italic">例子：「5 個四點」→ 最少「3 個么點」（2.5 取下整，加 1）；「4 個四點」→ 最少「3 個么點」（2 加 1）</span>
          </li>
          <li>
            <strong>由么點轉回其他點數：</strong>出注非么點（2–6）時，數量必須係當前么點出注數量嘅兩倍。
            <br />
            <span className="text-white/60 italic">例子：當前出注係「3 個么點」，下一注必須至少係「6 個二點」（3 的兩倍）</span>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Palifico 規則</h3>
        <p className="text-lg mb-2 text-white/85">
          當玩家以<strong>一粒骰子</strong>（數量 = 1）開始出注時，會啟動 Palifico 模式：
        </p>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li>該回合所有後續出注必須沿用第一注嘅相同點數</li>
          <li>么點失去萬能骰效果，<strong>唔會計算在內</strong>（只有完全吻合的點數才計算）</li>
          <li>Palifico 模式持續至回合結束（即有人叫挑戰）</li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-3 text-white">Calza 規則 <span className="text-base font-normal text-white/50">（可選）</span></h3>
        <p className="text-lg mb-2 text-white/85">
          除咗用 <strong>Dudo</strong> 挑戰，玩家亦可叫 <strong>Calza</strong>——聲稱桌面骰子數量與出注完全相符。
        </p>
        <ul className="list-disc list-outside space-y-2 text-lg pl-5 text-white/85">
          <li><strong>猜中</strong>（完全相符）：叫牌者獲得一粒骰子，最多回復到起始數量</li>
          <li><strong>猜錯</strong>：叫牌者照舊失去一粒骰子</li>
          <li>若叫牌者因 Calza 失敗而被淘汰（失去最後一粒骰子），由出注者開始下一回合</li>
          <li>Calza 可在任何出注後叫出，包括 Palifico 模式期間</li>
        </ul>
      </section>
    </div>
  );
}

export function FaqContentZhHK() {
  const faqs: { q: string; a: ReactNode }[] = [
    {
      q: '騙子骰係咩嚟？',
      a: (
        <p>騙子骰（Liar's Dice）係一款源自南美洲嘅虛張聲勢骰子遊戲，又稱 Dudo 或 Cacho。遊戲起源於安第斯山脈，並於 1993 年 Richard Borg 發行桌遊後廣泛流傳至全球。</p>
      ),
    },
    {
      q: '「Dudo」係咩意思？',
      a: (
        <p>Dudo 係西班牙語，意思係<em>「我唔信」</em>。叫 Dudo 即係挑戰上一位玩家嘅出注——所有骰子會被翻開並計算。如果出注係錯，出注者失去一粒骰子；如果係對，挑戰者失去一粒骰子。</p>
      ),
    },
    {
      q: '難度級別係點分？',
      a: (
        <>
          <p className="mb-2">共有三個 AI 難度設定：</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li><strong>容易</strong> — AI 出注保守，常常叫挑戰。適合新手學習。</li>
            <li><strong>中等</strong> — 均衡對局。AI 偶爾虛張，判讀桌面能力合理。</li>
            <li><strong>困難</strong> — AI 追蹤骰子數量、策略性虛張，精準挑戰。在困難模式獲勝可解鎖<strong>困難模式</strong>成就。</li>
          </ul>
        </>
      ),
    },
    {
      q: 'Elo 評分系統係點運作？',
      a: (
        <>
          <p className="mb-2">Elo 係用於有 3 位或以上真人玩家參與嘅線上多人排名賽評分，追蹤你嘅技術水準。</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li>所有玩家起始評分為 <strong>1500</strong>。</li>
            <li>每場排名賽後，評分會根據你嘅排名及對手水平調整。</li>
            <li>擊敗高評分玩家可獲得更多 Elo；輸給低評分玩家則失去更多。</li>
            <li>只有 2 位真人玩家嘅遊戲一律係<strong>休閒賽</strong>，唔影響 Elo。</li>
            <li>機械人唔計入 Elo 計算。</li>
            <li>若你在排名賽中斷線，且 60 秒內未重新連線，將以最後名次計算失敗。</li>
            <li>首 10 場排名賽評分標示為<strong>暫定</strong>，待穩定後才確定。</li>
          </ul>
        </>
      ),
    },
    {
      q: '成就係點運作？',
      a: (
        <>
          <p className="mb-2">達成特定里程碑即可解鎖成就，適用於單人或多人模式。成就會儲存到你的本地個人檔案。</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li><strong>首次出賽</strong> — 玩第一場遊戲</li>
            <li><strong>首次勝利</strong> — 贏得第一場遊戲</li>
            <li><strong>Dudo！</strong> — 成功叫 Dudo</li>
            <li><strong>最後抵抗</strong> — 以 1 粒骰子贏得遊戲</li>
            <li><strong>無懈可擊</strong> — 全程不失一粒骰子贏得遊戲</li>
            <li><strong>Calza！</strong> — 成功叫 Calza</li>
            <li><strong>神射手</strong> — 一場遊戲內成功叫 5 次 Dudo</li>
            <li><strong>困難模式</strong> — 在困難難度下勝出</li>
            <li><strong>連勝</strong> — 連贏 3 場遊戲</li>
            <li><strong>冠軍</strong> — 贏得 10 場遊戲</li>
            <li><strong>Dudo 大師</strong> — 累計成功叫 25 次 Dudo</li>
            <li><strong>老將</strong> — 累計進行 50 場遊戲</li>
          </ul>
          <p className="mt-2 text-white/60 text-sm">解鎖新成就時會顯示提示通知。</p>
        </>
      ),
    },
    {
      q: '么點係咪永遠係萬能骰？',
      a: (
        <>
          <p className="mb-2">係——正常玩法下，么點可計入任何點數。例如有人出注「4 個五點」，計算時會包括所有五點<em>加上</em>所有么點。</p>
          <p>唯一例外係 <strong>Palifico 模式</strong>：當一位只剩 1 粒骰子嘅玩家開始出注時，么點喺整個回合失去萬能骰效果，只計算實際么點。</p>
        </>
      ),
    },
    {
      q: '可以離線玩嗎？',
      a: (
        <p>可以！單人模式讓你對戰 1 至 5 個 AI 對手，頁面載入後無需網絡連接。你的統計數據和成就會儲存在瀏覽器本地。</p>
      ),
    },
    {
      q: '個人檔案會儲存嗎？',
      a: (
        <>
          <p className="mb-2">你的個人檔案（名稱、頭像、統計數據、成就及 Elo 評分）預設儲存在瀏覽器的本地儲存中。資料在不同session間均可保留，但與你的裝置及瀏覽器綁定——清除瀏覽器資料會重置檔案。</p>
          <p>如要保護並跨裝置同步個人檔案，可免費以電郵建立帳戶。在個人檔案頁面點擊<strong>登入 / 建立帳戶</strong>，用電郵註冊後點擊確認連結，登入後資料會自動同步。</p>
        </>
      ),
    },
    {
      q: '點樣加入朋友嘅遊戲？',
      a: (
        <>
          <p className="mb-2">私人房間主人可分享 4 個字母嘅房間代碼。朋友可在線上頁面嘅<strong>加入房間</strong>標籤輸入代碼，或瀏覽 <code className="bg-white/10 px-1 rounded text-sm">dudodice.com/online/join/代碼</code>。</p>
          <p>公開房間會顯示在<strong>瀏覽</strong>標籤——任何人均可直接加入。</p>
        </>
      ),
    },
    {
      q: '提早離開遊戲會點？',
      a: (
        <>
          <p className="mb-2">若你斷線，會開始 60 秒計時。如及時重新連線，可無縫重返遊戲。若未能重連：</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li>AI 會接管你的骰子並繼續出賽</li>
            <li>在<strong>排名賽</strong>中，你的評分會以最後名次計算扣分</li>
            <li>在<strong>休閒賽</strong>中，評分不受影響</li>
          </ul>
        </>
      ),
    },
    {
      q: 'Perudo / 撒謊骰子可以幾多人玩？',
      a: (
        <p>Perudo 和撒謊骰子適合 2–6 名玩家。在 Dudo Dice 中，單人模式可對抗 1–5 個 AI 對手，線上多人模式支援同一房間 2–6 名真實玩家。隨著玩家陸續被淘汰，遊戲節奏加快，最後對決時緊張感達到頂峰。</p>
      ),
    },
    {
      q: 'Perudo 中的 Palifico 係咩？',
      a: (
        <p>Palifico 係當任何玩家只剩一顆骰子時觸發的特殊回合。該玩家開始叫牌並設定點數，本回合所有後續叫牌必須使用相同點數。此外，Palifico 期間么點失去萬能效果，只算作 1 點。</p>
      ),
    },
    {
      q: '撒謊骰子中的 Calza 係咩？',
      a: (
        <p>Calza 係一個可選叫法，可代替叫 Dudo 來挑戰。你不是聲稱叫牌太高，而是聲稱數量完全正確。若猜對，你可以取回一顆骰子（最多恢復至起始數量）。若猜錯，照常失去一顆骰子。可在單人模式設定中啟用或停用 Calza。</p>
      ),
    },
    {
      q: 'Perudo、撒謊骰子、Dudo 同 Cacho 有咩分別？',
      a: (
        <p>這四個名稱指的是同一個遊戲，有些微地區差異。<em>撒謊骰子（Liar's Dice）</em>是北美常用的英文名稱。<em>Perudo</em> 是 1993 年 Richard Borg 出版的商業桌遊，讓此遊戲風靡全球。<em>Dudo</em>（西班牙語「我懷疑」）是南美洲通用的叫法和遊戲名稱。<em>Cacho</em> 則是智利及鄰近安第斯國家使用的名稱。</p>
      ),
    },
    {
      q: '撒謊骰子 / Perudo 最佳策略係咩？',
      a: (
        <>
          <p className="mb-2">關鍵在於概率：桌上共 N 顆骰子時，每個點數平均出現約 N÷6 次，加上所有么點作為萬能牌。在合理範圍內叫牌以保持可信度，或稍微虛張聲勢。</p>
          <ul className="list-disc list-outside space-y-1 pl-5">
            <li>當叫牌遠超統計可能時，果斷挑戰</li>
            <li>留意他人叫牌的積極程度——異常大膽的叫牌往往暗示虛張聲勢</li>
            <li>Palifico 回合中，開牌點數至關重要，因為所有人都必須跟隨</li>
          </ul>
        </>
      ),
    },
    {
      q: '撒謊骰子每位玩家起始有幾多顆骰子？',
      a: (
        <p>在經典 Perudo 中，每位玩家起始有 5 顆骰子。Dudo Dice 預設每人 5 顆骰子，單人模式中可調整為 1 至 7 顆。骰子越多，遊戲時間越長，在淘汰壓力來臨前有更多策略空間。</p>
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
