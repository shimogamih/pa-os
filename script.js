"use strict";

/*
============================================================
PA-OS
Portfolio AI Guild
Prototype
============================================================
*/

/* =========================
   SAMPLE PORTFOLIO DATA

   後からここを
   実際のポートフォリオデータ、
   株価API、
   OCRデータに接続する。
========================= */

const portfolio = [

  {
    name: "日本精工",
    code: "6471",
    role: "DEFENSE",
    roleJa: "防御",
    icon: "🛡️",
    score: 91,
    stability: 90,
    growth: 74,
    dividend: 82,
    value: 79,
    strength: "安定性が高く、ポートフォリオの防御役として機能。",
    weakness: "景気循環の影響を受ける可能性があります。",
    adviceTitle: "継続保有",
    advice: "現時点では急いで売買する必要はありません。"
  },

  {
    name: "四国電力",
    code: "9507",
    role: "DEFENSE",
    roleJa: "防御",
    icon: "🏰",
    score: 86,
    stability: 88,
    growth: 62,
    dividend: 84,
    value: 81,
    strength: "ディフェンシブ性と配当面が魅力。",
    weakness: "金利や燃料価格など外部要因に注意。",
    adviceTitle: "継続保有",
    advice: "防御役としてポートフォリオに有効です。"
  },

  {
    name: "ケーズホールディングス",
    code: "8282",
    role: "SUPPORT",
    roleJa: "支援",
    icon: "📖",
    score: 84,
    stability: 82,
    growth: 68,
    dividend: 88,
    value: 76,
    strength: "配当と安定性による継続戦力。",
    weakness: "小売環境の変化に注意。",
    adviceTitle: "押し目待ち",
    advice: "急いで追いかけず、価格位置を見ながら判断。"
  },

  {
    name: "アドソル日進",
    code: "3837",
    role: "MAGIC",
    roleJa: "魔法",
    icon: "🔮",
    score: 78,
    stability: 71,
    growth: 84,
    dividend: 65,
    value: 69,
    strength: "成長性がポートフォリオの攻撃力を補います。",
    weakness: "成長期待が剥落した場合の値動きに注意。",
    adviceTitle: "様子見",
    advice: "成長力は魅力ですが、価格位置を確認。"
  },

  {
    name: "三谷産業",
    code: "8285",
    role: "SUPPORT",
    roleJa: "支援",
    icon: "🏮",
    score: 76,
    stability: 79,
    growth: 65,
    dividend: 72,
    value: 81,
    strength: "割安性と分散効果。",
    weakness: "大きな成長材料が必要。",
    adviceTitle: "継続保有",
    advice: "ギルドの補助役として機能。"
  },

  {
    name: "ヨドコウ",
    code: "5451",
    role: "ATTACK",
    roleJa: "攻撃",
    icon: "🏹",
    score: 73,
    stability: 69,
    growth: 73,
    dividend: 76,
    value: 72,
    strength: "景気回復局面での上昇余地。",
    weakness: "景気敏感性が高め。",
    adviceTitle: "押し目待ち",
    advice: "価格が下がった局面で再評価。"
  },

  {
    name: "メンタルヘルステクノロジーズ",
    code: "9218",
    role: "MAGIC",
    roleJa: "魔法",
    icon: "✨",
    score: 69,
    stability: 57,
    growth: 82,
    dividend: 42,
    value: 64,
    strength: "成長性が高く、将来戦力候補。",
    weakness: "安定性が低く値動きが大きい。",
    adviceTitle: "様子見",
    advice: "成長枠として保有状況を確認。"
  },

  {
    name: "Polaris Holdings",
    code: "3010",
    role: "ATTACK",
    roleJa: "攻撃",
    icon: "⚔️",
    score: 67,
    stability: 55,
    growth: 76,
    dividend: 38,
    value: 71,
    strength: "景気回復時の上昇余地。",
    weakness: "変動が大きい。",
    adviceTitle: "慎重",
    advice: "リスク管理を優先。"
  },

  {
    name: "S ゴールド ETF",
    code: "314A",
    role: "SPECIAL",
    roleJa: "特殊",
    icon: "💰",
    score: 88,
    stability: 91,
    growth: 55,
    dividend: 0,
    value: 83,
    strength: "株式市場と異なる値動きによる分散効果。",
    weakness: "インカム目的には向きません。",
    adviceTitle: "継続",
    advice: "リスク分散役として有効。"
  }

];


/* =========================
   DOM
========================= */

const startScreen =
  document.getElementById("start-screen");

const dashboardScreen =
  document.getElementById("dashboard-screen");

const detailScreen =
  document.getElementById("detail-screen");

const membersScreen =
  document.getElementById("members-screen");


/* =========================
   SCREEN SWITCH
========================= */

function showScreen(screen) {

  document
    .querySelectorAll(".screen")
    .forEach(item => {

      item.classList.remove("active");

    });

  screen.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   RENDER PARTY
========================= */

function renderParty() {

  const party =
    document.getElementById("party");

  if (!party) return;

  party.innerHTML = "";

  portfolio
    .slice(0, 6)
    .forEach((member, index) => {

      const card =
        document.createElement("div");

      card.className =
        "member-card";

      card.innerHTML = `

        <div class="member-score">
          ${member.score}
        </div>

        <div class="member-icon">
          ${member.icon}
        </div>

        <div class="member-role">
          ${member.role}
        </div>

        <div class="member-name">
          ${member.name}
        </div>

      `;

      card.addEventListener(
        "click",
        () => openDetail(member)
      );

      party.appendChild(card);

    });
}


/* =========================
   RENDER HOLDINGS
========================= */

function renderHoldings() {

  const list =
    document.getElementById("holdings-list");

  if (!list) return;

  list.innerHTML = "";

  portfolio.forEach(member => {

    const row =
      document.createElement("div");

    row.className =
      "holding-row";

    row.innerHTML = `

      <div class="holding-icon">
        ${member.icon}
      </div>

      <div class="holding-info">

        <strong>
          ${member.name}
        </strong>

        <span>
          ${member.code} · ${member.roleJa}
        </span>

      </div>

      <div class="holding-score">
        ${member.score}
      </div>

    `;

    row.addEventListener(
      "click",
      () => openDetail(member)
    );

    list.appendChild(row);

  });
}


/* =========================
   RENDER ALL MEMBERS
========================= */

function renderAllMembers() {

  const list =
    document.getElementById(
      "all-members-list"
    );

  if (!list) return;

  list.innerHTML = "";

  portfolio.forEach(member => {

    const row =
      document.createElement("div");

    row.className =
      "holding-row";

    row.innerHTML = `

      <div class="holding-icon">
        ${member.icon}
      </div>

      <div class="holding-info">

        <strong>
          ${member.name}
        </strong>

        <span>
          ${member.code} · ${member.roleJa}
        </span>

      </div>

      <div class="holding-score">
        ${member.score}
      </div>

    `;

    row.addEventListener(
      "click",
      () => openDetail(member)
    );

    list.appendChild(row);

  });
}


/* =========================
   DETAIL
========================= */

function openDetail(member) {

  document.getElementById(
    "detail-icon"
  ).textContent = member.icon;

  document.getElementById(
    "detail-role"
  ).textContent = member.role;

  document.getElementById(
    "detail-name"
  ).textContent = member.name;

  document.getElementById(
    "detail-code"
  ).textContent = member.code;

  document.getElementById(
    "detail-score"
  ).textContent = member.score;

  document.getElementById(
    "detail-stability"
  ).textContent = member.stability;

  document.getElementById(
    "detail-growth"
  ).textContent = member.growth;

  document.getElementById(
    "detail-dividend"
  ).textContent = member.dividend;

  document.getElementById(
    "detail-value"
  ).textContent = member.value;

  document.getElementById(
    "detail-strength"
  ).textContent = member.strength;

  document.getElementById(
    "detail-weakness"
  ).textContent = member.weakness;

  document.getElementById(
    "detail-advice-title"
  ).textContent = member.adviceTitle;

  document.getElementById(
    "detail-advice"
  ).textContent = member.advice;

  showScreen(detailScreen);
}


/* =========================
   BUTTONS
========================= */

document
  .getElementById("launch-btn")
  .addEventListener(
    "click",
    () => {

      renderParty();
      renderHoldings();

      showScreen(
        dashboardScreen
      );

    }
  );


document
  .getElementById("show-all-btn")
  .addEventListener(
    "click",
    () => {

      renderAllMembers();

      showScreen(
        membersScreen
      );

    }
  );


document
  .getElementById("candidate-btn")
  .addEventListener(
    "click",
    () => {

      alert(
        "買い候補機能は、実際の株価データ接続後に自動判定します。"
      );

    }
  );


document
  .getElementById("back-start-btn")
  .addEventListener(
    "click",
    () => {

      showScreen(
        startScreen
      );

    }
  );


document
  .getElementById("detail-back-btn")
  .addEventListener(
    "click",
    () => {

      showScreen(
        dashboardScreen
      );

    }
  );


document
  .getElementById("members-back-btn")
  .addEventListener(
    "click",
    () => {

      showScreen(
        dashboardScreen
      );

    }
  );


/* =========================
   INITIALIZE
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "PA-OS initialized."
    );

  }
);
