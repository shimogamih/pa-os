const STORAGE_KEY = "pa_os_portfolio_ledger";
let editingIndex = null;

const $ = id => document.getElementById(id);

function num(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function readLedger() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveLedger(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    alert("保存できませんでした。ブラウザの設定を確認してください。");
    console.error(error);
    return false;
  }
}

function getType() {
  return $("stock-type")?.value || "stock";
}

function isFund(item) {
  return item.type === "fund";
}

/*
  株・ETF：
  保有数 × 1株あたりの価格

  投資信託：
  保有口数 ÷ 10,000 × 1万口あたりの基準価額
*/

function calculateAmounts(item) {
  const shares = num(item.shares);
  const cost = num(item.cost);
  const current = num(item.current);
  const divisor = isFund(item) ? 10000 : 1;

  const costTotal =
    shares !== null && cost !== null
      ? shares / divisor * cost
      : null;

  const value =
    shares !== null && current !== null
      ? shares / divisor * current
      : null;

  const profit =
    costTotal !== null && value !== null
      ? value - costTotal
      : null;

  const profitRate =
    costTotal !== null && costTotal > 0 && profit !== null
      ? profit / costTotal * 100
      : null;

  return { costTotal, value, profit, profitRate };
}

function getFormData() {
  const name = $("stock-name")?.value.trim();

  if (!name) {
    alert("銘柄名を入力してください。");
    return null;
  }

  const item = {
    type: getType(),
    name,
    code: $("stock-code")?.value.trim() || "",
    shares: num($("stock-shares")?.value),
    cost: num($("stock-cost")?.value),
    current: num($("stock-current")?.value),
    dividend: num($("stock-dividend")?.value),
    per: num($("stock-per")?.value),
    pbr: num($("stock-pbr")?.value),
    equity: num($("stock-equity")?.value),
    growth: num($("stock-growth")?.value),
    stability: num($("stock-stability")?.value),
    risk: num($("stock-risk")?.value),
    updatedAt: new Date().toISOString()
  };

  if (item.shares !== null && item.shares < 0) {
    alert("保有数・口数は0以上で入力してください。");
    return null;
  }

  if (
    (item.cost !== null && item.cost < 0) ||
    (item.current !== null && item.current < 0)
  ) {
    alert("取得単価・現在値は0以上で入力してください。");
    return null;
  }

  if (item.dividend !== null && item.dividend < 0) {
    alert("配当利回りは0以上で入力してください。");
    return null;
  }

  for (const [label, value] of [
    ["自己資本比率", item.equity],
    ["業績安定度", item.stability],
    ["リスク水準", item.risk]
  ]) {
    if (value !== null && (value < 0 || value > 100)) {
      alert(`${label}は0〜100で入力してください。`);
      return null;
    }
  }

  return item;
}

function resetForm() {
  [
    "stock-name",
    "stock-code",
    "stock-shares",
    "stock-cost",
    "stock-current",
    "stock-dividend",
    "stock-per",
    "stock-pbr",
    "stock-equity",
    "stock-growth",
    "stock-stability",
    "stock-risk"
  ].forEach(id => {
    if ($(id)) $(id).value = "";
  });

  if ($("stock-type")) $("stock-type").value = "stock";

  editingIndex = null;

  if ($("add-stock-btn")) {
    $("add-stock-btn").textContent = "＋ 台帳に登録";
  }

  if ($("save-status")) {
    $("save-status").textContent = "入力待ち";
  }
}

function saveHolding() {
  const item = getFormData();
  if (!item) return;

  const data = readLedger();

  if (editingIndex === null) {
    item.createdAt = new Date().toISOString();
    data.push(item);
  } else {
    const old = data[editingIndex];

    if (!old) {
      editingIndex = null;
      alert("編集対象が見つかりません。");
      return;
    }

    data[editingIndex] = {
      ...old,
      ...item,
      createdAt: old.createdAt || item.createdAt
    };
  }

  if (!saveLedger(data)) return;

  resetForm();
  render();

  if ($("save-status")) {
    $("save-status").textContent = "保存しました";
  }
}

function startEdit(index) {
  const item = readLedger()[index];
  if (!item) return;

  const fields = {
    "stock-type": item.type || "stock",
    "stock-name": item.name,
    "stock-code": item.code,
    "stock-shares": item.shares,
    "stock-cost": item.cost,
    "stock-current": item.current,
    "stock-dividend": item.dividend,
    "stock-per": item.per,
    "stock-pbr": item.pbr,
    "stock-equity": item.equity,
    "stock-growth": item.growth,
    "stock-stability": item.stability,
    "stock-risk": item.risk
  };

  Object.entries(fields).forEach(([id, value]) => {
    if ($(id)) $(id).value = value ?? "";
  });

  editingIndex = index;

  if ($("add-stock-btn")) {
    $("add-stock-btn").textContent = "変更を保存";
  }

  if ($("save-status")) {
    $("save-status").textContent = "編集中";
  }

  $("stock-name")?.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function deleteHolding(index) {
  const data = readLedger();
  if (!data[index]) return;

  if (!confirm(`${data[index].name} を削除しますか？`)) return;

  data.splice(index, 1);

  if (!saveLedger(data)) return;

  if (editingIndex === index) {
    resetForm();
  } else if (editingIndex !== null && editingIndex > index) {
    editingIndex--;
  }

  render();
}

function analyzeStock(item) {
  let score = 0;
  let availablePoints = 0;
  const details = [];

  function addScore(label, value, max, calculate) {
    if (value === null || value === undefined || value === "") {
      details.push(`${label}：データ不足`);
      return;
    }

    const points = Math.max(
      0,
      Math.min(max, calculate(Number(value)))
    );

    score += points;
    availablePoints += max;

    details.push(`${label}：${points.toFixed(1)} / ${max}点`);
  }

  if (isFund(item)) {
    addScore(
      "成長性",
      num(item.growth),
      25,
      v => v >= 20 ? 25 :
           v >= 10 ? 21 :
           v >= 5 ? 17 :
           v >= 0 ? 12 : 3
    );

    addScore(
      "運用安定度",
      num(item.stability),
      25,
      v => v * 0.25
    );

    addScore(
      "リスク評価",
      num(item.risk),
      25,
      v => (100 - v) * 0.25
    );

    const current = num(item.current);
    const cost = num(item.cost);

    const pricePosition =
      current !== null && cost !== null && cost > 0
        ? current / cost * 100
        : null;

    addScore(
      "取得価格との位置",
      pricePosition,
      25,
      v => v >= 80 && v <= 120 ? 25 :
           v >= 60 && v <= 140 ? 18 :
           v >= 40 && v <= 160 ? 10 : 3
    );
  } else {
    addScore(
      "配当利回り",
      num(item.dividend),
      20,
      v => v >= 4 ? 20 :
           v >= 3 ? 16 :
           v >= 2 ? 12 :
           v >= 1 ? 7 : 2
    );

    addScore(
      "自己資本比率",
      num(item.equity),
      20,
      v => v >= 70 ? 20 :
           v >= 50 ? 17 :
           v >= 40 ? 14 :
           v >= 30 ? 10 :
           v >= 20 ? 6 : 2
    );

    addScore(
      "成長性",
      num(item.growth),
      15,
      v => v >= 20 ? 15 :
           v >= 10 ? 12 :
           v >= 5 ? 9 :
           v >= 0 ? 6 : 1
    );

    addScore(
      "PER",
      num(item.per),
      8,
      v => v <= 0 ? 0 :
           v <= 10 ? 8 :
           v <= 15 ? 7 :
           v <= 20 ? 5 :
           v <= 30 ? 3 : 1
    );

    addScore(
      "PBR",
      num(item.pbr),
      7,
      v => v <= 0 ? 0 :
           v <= 1 ? 7 :
           v <= 1.5 ? 6 :
           v <= 2 ? 4 :
           v <= 3 ? 2 : 1
    );

    addScore(
      "業績安定度",
      num(item.stability),
      15,
      v => v * 0.15
    );

    const current = num(item.current);
    const cost = num(item.cost);

    const pricePosition =
      current !== null && cost !== null && cost > 0
        ? current / cost * 100
        : null;

    addScore(
      "取得価格との位置",
      pricePosition,
      10,
      v => v >= 80 && v <= 120 ? 10 :
           v >= 60 && v <= 140 ? 7 :
           v >= 40 && v <= 160 ? 4 : 1
    );

    addScore(
      "リスク評価",
      num(item.risk),
      5,
      v => (100 - v) * 0.05
    );
  }

  return {
    score: Math.round(score * 10) / 10,
    availablePoints,
    details
  };
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "未入力";
  }

  return Number(value).toLocaleString("ja-JP", {
    maximumFractionDigits: 2
  }) + "円";
}

function signedMoney(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "未計算";
  }

  const n = Number(value);
  return `${n > 0 ? "+" : ""}${money(n)}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function typeLabel(item) {
  if (item.type === "fund") return "投資信託";
  if (item.type === "etf") return "ETF";
  return "株式";
}

function render() {
  const data = readLedger();
  const list = $("holdings-list");

  let totalCost = 0;
  let totalValue = 0;
  let profitTotal = 0;

  let costCount = 0;
  let valueCount = 0;
  let profitCount = 0;

  if (list) {
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = "<p>まだ銘柄が登録されていません。</p>";
    }

    data.forEach((item, index) => {
      const amounts = calculateAmounts(item);
      const analysis = analyzeStock(item);

      const shares = num(item.shares);
      const cost = num(item.cost);
      const current = num(item.current);

      if (amounts.costTotal !== null) {
        totalCost += amounts.costTotal;
        costCount++;
      }

      if (amounts.value !== null) {
        totalValue += amounts.value;
        valueCount++;
      }

      if (amounts.profit !== null) {
        profitTotal += amounts.profit;
        profitCount++;
      }

      const profitClass =
        amounts.profit === null ? "" :
        amounts.profit >= 0 ? "positive" : "negative";

      const unitLabel = isFund(item) ? "口" : "株・口";
      const priceLabel = isFund(item)
        ? "1万口あたり基準価額"
        : "単価";

      const card = document.createElement("div");
      card.className = "holding";

      card.innerHTML = `
        <div class="holding-header">
          <div>
            <div class="holding-name">
              ${escapeHtml(item.name || "名称未設定")}
            </div>
            <div class="holding-code">
              ${escapeHtml(typeLabel(item))}
              ${item.code ? " / " + escapeHtml(item.code) : ""}
            </div>
          </div>
          <div class="analysis-score">
            評価 ${analysis.score.toFixed(1)}点
            <br>
            <small>採点可能 ${analysis.availablePoints}点分</small>
          </div>
        </div>

        <div class="holding-info">
          保有数：${shares === null ? "未入力" : shares.toLocaleString("ja-JP") + unitLabel}
          <br>
          取得${priceLabel}：${money(cost)}
          <br>
          現在${priceLabel}：${money(current)}
          <br>
          投資元本：${money(amounts.costTotal)}
          <br>
          評価額：${money(amounts.value)}
          <br>
          含み損益：
          <span class="${profitClass}">
            ${signedMoney(amounts.profit)}
          </span>
          <br>
          損益率：
          ${amounts.profitRate === null
            ? "未計算"
            : `${amounts.profitRate >= 0 ? "+" : ""}${amounts.profitRate.toFixed(2)}%`}
        </div>

        <div class="holding-info">
          ${analysis.details.map(escapeHtml).join("<br>")}
        </div>

        <div class="holding-actions">
          <button type="button" data-edit="${index}">編集</button>
          <button type="button" data-delete="${index}">削除</button>
        </div>
      `;

      list.appendChild(card);
    });

    list.querySelectorAll("[data-edit]").forEach(button => {
      button.addEventListener("click", () => {
        startEdit(Number(button.dataset.edit));
      });
    });

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", () => {
        deleteHolding(Number(button.dataset.delete));
      });
    });
  }

  if ($("total-holdings")) {
    $("total-holdings").textContent = data.length;
  }

  if ($("total-cost")) {
    $("total-cost").textContent = money(totalCost);
  }

  if ($("portfolio-value")) {
    $("portfolio-value").textContent =
      valueCount ? money(totalValue) : "未入力";
  }

  if ($("open-pl")) {
    $("open-pl").textContent =
      profitCount ? signedMoney(profitTotal) : "未計算";
  }

  if ($("portfolio-return")) {
    $("portfolio-return").textContent =
      totalCost > 0 && profitCount === data.length && data.length > 0
        ? `${profitTotal / totalCost >= 0 ? "+" : ""}${(profitTotal / totalCost * 100).toFixed(2)}%`
        : "未計算";
  }

  if ($("data-status")) {
    $("data-status").textContent =
      `登録 ${data.length}件 / 取得額計算 ${costCount}件 / 評価額計算 ${valueCount}件`;
  }

  const result = $("ai-analysis-result");

  if (result) {
    const profitRate =
      totalCost > 0 && profitCount === data.length && data.length > 0
        ? profitTotal / totalCost * 100
        : null;

    result.innerHTML = `
      <h3>PA-OS ポートフォリオ分析</h3>
      <p>登録銘柄数：${data.length}</p>
      <p>投資元本合計：${money(totalCost)}${costCount < data.length ? "（一部未入力）" : ""}</p>
      <p>現在評価額合計：${valueCount ? money(totalValue) : "現在値を入力してください"}${valueCount < data.length ? "（一部未入力）" : ""}</p>
      <p>含み損益合計：${profitCount ? signedMoney(profitTotal) : "計算に必要なデータがありません"}${profitCount < data.length ? "（計算可能な銘柄分）" : ""}</p>
      <p>損益率：${profitRate === null ? "全銘柄のデータがそろうと計算できます" : `${profitRate >= 0 ? "+" : ""}${profitRate.toFixed(2)}%`}</p>
      <p>投資信託は「保有口数」と「1万口あたりの基準価額」を入力して計算します。</p>
      <p>評価は入力データに基づく暫定評価です。将来の利益を保証するものではありません。</p>
    `;
  }

  if ($("test-status")) {
    $("test-status").textContent = "✓ PA-OS起動完了";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("add-stock-btn")?.addEventListener("click", saveHolding);
  $("clear-form-btn")?.addEventListener("click", resetForm);
  $("reload-btn")?.addEventListener("click", render);

  $("delete-all-btn")?.addEventListener("click", () => {
    if (!confirm("登録済みの台帳をすべて削除しますか？この操作は取り消せません。")) {
      return;
    }

    if (!saveLedger([])) return;

    resetForm();
    render();
  });

  $("ai-analysis-btn")?.addEventListener("click", render);

  render();
});
