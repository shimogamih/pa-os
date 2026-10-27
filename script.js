const STORAGE_KEY = "pa_os_portfolio_ledger";
let editingIndex = null;

const $ = id => document.getElementById(id);

function num(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
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
    alert("台帳を保存できませんでした。ブラウザの保存容量・設定を確認してください。");
    console.error(error);
    return false;
  }
}

function ensureExtraFields() {
  const anchor = $("stock-cost")?.parentElement;
  if (!anchor) return;

  const fields = [
    ["stock-current", "現在株価・基準価額（円）", "1250"],
    ["stock-dividend", "配当利回り（%）", "3.5"],
    ["stock-per", "PER（倍）", "15"],
    ["stock-pbr", "PBR（倍）", "1.2"],
    ["stock-equity", "自己資本比率（%）", "45"],
    ["stock-growth", "売上成長率（%）", "8"],
    ["stock-stability", "業績安定度（0〜100）", "70"],
    ["stock-risk", "リスク水準（0〜100・高いほど危険）", "30"]
  ];

  let point = anchor;

  fields.forEach(([id, label, example]) => {
    if ($(id)) {
      point = $(id).parentElement || point;
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "form-group";

    const labelEl = document.createElement("label");
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    const input = document.createElement("input");
    input.id = id;
    input.type = "number";
    input.step = "any";
    input.placeholder = `例：${example}`;

    wrapper.append(labelEl, input);
    point.insertAdjacentElement("afterend", wrapper);
    point = wrapper;
  });
}

function getFormData() {
  const name = $("stock-name")?.value.trim();

  if (!name) {
    alert("銘柄名を入力してください。");
    return null;
  }

  const item = {
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
    alert("保有数は0以上で入力してください。");
    return null;
  }

  for (const key of ["cost", "current", "dividend", "per", "pbr"]) {
    if (item[key] !== null && item[key] < 0) {
      alert("取得単価・現在値・配当利回り・PER・PBRは0以上で入力してください。");
      return null;
    }
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
    "stock-name", "stock-code", "stock-shares", "stock-cost",
    "stock-current", "stock-dividend", "stock-per", "stock-pbr",
    "stock-equity", "stock-growth", "stock-stability", "stock-risk"
  ].forEach(id => {
    if ($(id)) $(id).value = "";
  });

  editingIndex = null;

  if ($("add-stock-btn")) $("add-stock-btn").textContent = "＋ 台帳に登録";
  if ($("save-status")) $("save-status").textContent = "入力待ち";
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

  if ($("save-status")) $("save-status").textContent = "保存しました";
}

function startEdit(index) {
  const item = readLedger()[index];
  if (!item) return;

  const fields = {
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

  if ($("add-stock-btn")) $("add-stock-btn").textContent = "変更を保存";
  if ($("save-status")) $("save-status").textContent = "編集中";

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

function analyzeStock(stock) {
  let score = 0;
  let availablePoints = 0;
  const details = [];

  function addScore(label, value, max, calculate) {
    if (value === null || value === undefined || value === "") {
      details.push(`${label}：データ不足`);
      return;
    }

    const v = Number(value);

    if (!Number.isFinite(v)) {
      details.push(`${label}：データ不足`);
      return;
    }

    const points = Math.max(0, Math.min(max, calculate(v)));

    score += points;
    availablePoints += max;
    details.push(`${label}：${points.toFixed(1)} / ${max}点`);
  }

  addScore("配当利回り", num(stock.dividend), 20,
    v => v >= 4 ? 20 : v >= 3 ? 16 : v >= 2 ? 12 : v >= 1 ? 7 : 2);

  addScore("自己資本比率", num(stock.equity), 20,
    v => v >= 70 ? 20 : v >= 50 ? 17 : v >= 40 ? 14 : v >= 30 ? 10 : v >= 20 ? 6 : 2);

  addScore("売上成長率", num(stock.growth), 15,
    v => v >= 20 ? 15 : v >= 10 ? 12 : v >= 5 ? 9 : v >= 0 ? 6 : 1);

  addScore("PER", num(stock.per), 8,
    v => v <= 0 ? 0 : v <= 10 ? 8 : v <= 15 ? 7 : v <= 20 ? 5 : v <= 30 ? 3 : 1);

  addScore("PBR", num(stock.pbr), 7,
    v => v <= 0 ? 0 : v <= 1 ? 7 : v <= 1.5 ? 6 : v <= 2 ? 4 : v <= 3 ? 2 : 1);

  addScore("業績安定度", num(stock.stability), 15,
    v => v * 0.15);

  const current = num(stock.current);
  const cost = num(stock.cost);

  const pricePosition =
    current !== null && cost !== null && cost > 0
      ? current / cost * 100
      : null;

  addScore("取得価格との位置", pricePosition, 10,
    v => v >= 80 && v <= 120 ? 10 :
         v >= 60 && v <= 140 ? 7 :
         v >= 40 && v <= 160 ? 4 : 1);

  addScore("リスク評価", num(stock.risk), 5,
    v => (100 - v) * 0.05);

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

function render() {
  const data = readLedger();
  const list = $("holdings-list");

  let totalCost = 0;
  let totalValue = 0;
  let totalProfit = 0;
  let costCount = 0;
  let valueCount = 0;
  let profitCount = 0;

  if (list) {
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = "<p>まだ銘柄が登録されていません。</p>";
    }

    data.forEach((stock, index) => {
      const shares = num(stock.shares);
      const cost = num(stock.cost);
      const current = num(stock.current);

      const value =
        shares !== null && current !== null
          ? shares * current
          : null;

      const costTotal =
        shares !== null && cost !== null
          ? shares * cost
          : null;

      const profit =
        value !== null && costTotal !== null
          ? value - costTotal
          : null;

      const profitRate =
        costTotal !== null && costTotal > 0 && profit !== null
          ? profit / costTotal * 100
          : null;

      if (costTotal !== null) {
        totalCost += costTotal;
        costCount++;
      }

      if (value !== null) {
        totalValue += value;
        valueCount++;
      }

      if (profit !== null) {
        totalProfit += profit;
        profitCount++;
      }

      const analysis = analyzeStock(stock);

      const profitClass =
        profit === null ? "" :
        profit >= 0 ? "positive" : "negative";

      const card = document.createElement("div");
      card.className = "holding";

      card.innerHTML = `
        <div class="holding-header">
          <div>
            <div class="holding-name">${escapeHtml(stock.name || "名称未設定")}</div>
            <div class="holding-code">${escapeHtml(stock.code || "コード未入力")}</div>
          </div>
          <div class="analysis-score">
            評価 ${analysis.score.toFixed(1)} / ${analysis.availablePoints}点
            <br><small>採点可能分（最大100点）</small>
          </div>
        </div>

        <div class="holding-info">
          保有数：${shares ?? "未入力"}<br>
          取得単価：${money(cost)}<br>
          現在値：${money(current)}<br>
          投資元本：${money(costTotal)}<br>
          評価額：${money(value)}<br>
          含み損益：
          <span class="${profitClass}">${signedMoney(profit)}</span><br>
          損益率：
          ${profitRate === null ? "未計算" :
            `${profitRate >= 0 ? "+" : ""}${profitRate.toFixed(2)}%`}
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
      button.addEventListener("click", () =>
        startEdit(Number(button.dataset.edit))
      );
    });

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", () =>
        deleteHolding(Number(button.dataset.delete))
      );
    });
  }

  if ($("total-holdings")) {
    $("total-holdings").textContent = data.length;
  }

  if ($("total-cost")) {
    $("total-cost").textContent = money(totalCost);
  }

  const result = $("ai-analysis-result");

  if (result) {
    const profitRate =
      totalCost > 0 && profitCount === data.length && data.length > 0
        ? totalProfit / totalCost * 100
        : null;

    result.innerHTML = `
      <h3>PA-OS ポートフォリオ分析</h3>
      <p>登録銘柄数：${data.length}</p>
      <p>投資元本合計：${money(totalCost)}
        ${costCount < data.length ? "（一部未入力）" : ""}
      </p>
      <p>現在評価額合計：
        ${valueCount ? money(totalValue) : "現在値を入力してください"}
        ${valueCount < data.length ? "（一部未入力）" : ""}
      </p>
      <p>含み損益合計：
        ${profitCount ? signedMoney(totalProfit) : "必要なデータが不足しています"}
        ${profitCount < data.length ? "（計算可能な銘柄分）" : ""}
      </p>
      <p>損益率：
        ${profitRate === null
          ? "全銘柄のデータがそろうと計算できます"
          : `${profitRate >= 0 ? "+" : ""}${profitRate.toFixed(2)}%`}
      </p>
      <p>評価は入力データに基づく暫定ルール評価です。
        未入力項目は採点せず、将来の利益を保証するものではありません。
      </p>
    `;
  }

  if ($("test-status")) {
    $("test-status").textContent = "✓ PA-OS起動完了";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ensureExtraFields();

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
