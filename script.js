
const STORAGE_KEY = "pa_os_portfolio_ledger";
let editingIndex = null;

const $ = (id) => document.getElementById(id);

function num(value) {
  if (value === null || value === undefined || value === "") return null;
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureExtraFields() {
  const form = $("stock-growth")?.closest("form")
    || $("stock-growth")?.parentElement?.parentElement;

  if (!form) return;

  if (!$("stock-stability")) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <label for="stock-stability">業績安定度（0〜100）</label>
      <input id="stock-stability" type="number" min="0" max="100"
        placeholder="例：70">
    `;
    $("stock-growth").parentElement.after(wrapper);
  }

  if (!$("stock-risk")) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <label for="stock-risk">リスク水準（0〜100・高いほど危険）</label>
      <input id="stock-risk" type="number" min="0" max="100"
        placeholder="例：30">
    `;
    $("stock-stability").parentElement.after(wrapper);
  }
}

function getFormData() {
  const name = $("stock-name")?.value.trim();
  if (!name) {
    alert("銘柄名を入力してください。");
    return null;
  }

  const stability = num($("stock-stability")?.value);
  const risk = num($("stock-risk")?.value);

  if (stability !== null && (stability < 0 || stability > 100)) {
    alert("業績安定度は0〜100で入力してください。");
    return null;
  }

  if (risk !== null && (risk < 0 || risk > 100)) {
    alert("リスク水準は0〜100で入力してください。");
    return null;
  }

  return {
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
    stability,
    risk,
    updatedAt: new Date().toISOString()
  };
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

  saveLedger(data);
  resetForm();
  render();
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
  saveLedger(data);

  if (editingIndex === index) {
    resetForm();
  } else if (editingIndex !== null && editingIndex > index) {
    editingIndex--;
  }

  render();
}

function analyzeStock(stock) {
  let score = 0;
  let maxScore = 0;
  const details = [];

  function addScore(label, value, max, calculate) {
    if (value === null || value === undefined || value === "") {
      details.push(`${label}：データ不足`);
      return;
    }

    const points = Math.max(0, Math.min(max, calculate(Number(value))));
    score += points;
    maxScore += max;
    details.push(`${label}：${points.toFixed(1)} / ${max}点`);
  }

  addScore("配当利回り", stock.dividend, 20,
    v => v >= 4 ? 20 : v >= 3 ? 16 : v >= 2 ? 12 : v >= 1 ? 7 : 2);

  addScore("自己資本比率", stock.equity, 20,
    v => v >= 70 ? 20 : v >= 50 ? 17 : v >= 40 ? 14 : v >= 30 ? 10 : v >= 20 ? 6 : 2);

  addScore("成長率", stock.growth, 15,
    v => v >= 20 ? 15 : v >= 10 ? 12 : v >= 5 ? 9 : v >= 0 ? 6 : 1);

  addScore("PER", stock.per, 8,
    v => v <= 0 ? 0 : v <= 10 ? 8 : v <= 15 ? 7 : v <= 20 ? 5 : v <= 30 ? 3 : 1);

  addScore("PBR", stock.pbr, 7,
    v => v <= 0 ? 0 : v <= 1 ? 7 : v <= 1.5 ? 6 : v <= 2 ? 4 : v <= 3 ? 2 : 1);

  addScore("業績安定度", stock.stability, 15,
    v => v * 0.15);

  addScore("取得価格との比較", 
    stock.current !== null && stock.cost !== null && stock.cost > 0
      ? (stock.current / stock.cost) * 100
      : null,
    10,
    v => v >= 80 && v <= 120 ? 10 : v >= 60 && v <= 140 ? 7 : v >= 40 && v <= 160 ? 4 : 1);

  addScore("リスク評価", stock.risk, 5,
    v => (100 - v) * 0.05);

  return {
    score: Math.round(score * 10) / 10,
    maxScore,
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

function render() {
  const data = readLedger();
  const list = $("holdings-list");

  if (list) {
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = "<p>まだ銘柄が登録されていません。</p>";
    }

    data.forEach((stock, index) => {
      const shares = num(stock.shares);
      const cost = num(stock.cost);
      const current = num(stock.current);

      const value = shares !== null && current !== null
        ? shares * current
        : null;

      const costTotal = shares !== null && cost !== null
        ? shares * cost
        : null;

      const profit = value !== null && costTotal !== null
        ? value - costTotal
        : null;

      const analysis = analyzeStock(stock);

      const card = document.createElement("div");
      card.className = "holding";

      const profitClass = profit === null
        ? ""
        : profit >= 0 ? "positive" : "negative";

      card.innerHTML = `
        <div class="holding-header">
          <div>
            <div class="holding-name">${escapeHtml(stock.name || "名称未設定")}</div>
            <div class="holding-code">${escapeHtml(stock.code || "コード未入力")}</div>
          </div>
          <div class="analysis-score">
            評価 ${analysis.score} / ${analysis.maxScore}点
          </div>
        </div>
        <div class="holding-info">
          保有数：${shares ?? "未入力"}<br>
          取得単価：${money(cost)}<br>
          現在値：${money(current)}<br>
          評価額：${money(value)}<br>
          含み損益：
          <span class="${profitClass}">${profit === null ? "未計算" : money(profit)}</span>
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

  const totalCost = data.reduce((sum, stock) => {
    const shares = num(stock.shares);
    const cost = num(stock.cost);
    return shares !== null && cost !== null ? sum + shares * cost : sum;
  }, 0);

  const totalValue = data.reduce((sum, stock) => {
    const shares = num(stock.shares);
    const current = num(stock.current);
    return shares !== null && current !== null
      ? sum + shares * current
      : sum;
  }, 0);

  if ($("total-holdings")) $("total-holdings").textContent = data.length;
  if ($("total-cost")) $("total-cost").textContent = money(totalCost);

  const result = $("ai-analysis-result");
  if (result) {
    const hasCurrent = data.some(s => num(s.current) !== null);
    const totalProfit = totalValue - totalCost;

    result.innerHTML = `
      <h3>PA-OS ポートフォリオ分析</h3>
      <p>登録銘柄数：${data.length}</p>
      <p>取得総額：${money(totalCost)}</p>
      <p>現在評価額：${hasCurrent ? money(totalValue) : "現在値を入力してください"}</p>
      <p>損益概算：${hasCurrent ? money(totalProfit) : "現在値が不足しています"}</p>
      <p>評価は入力データに基づく暫定スコアです。投資判断を保証するものではありません。</p>
    `;
  }

  if ($("test-status")) {
    $("test-status").textContent = "✓ PA-OS起動完了";
  }
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

document.addEventListener("DOMContentLoaded", () => {
  ensureExtraFields();

  $("add-stock-btn")?.addEventListener("click", saveHolding);
  $("clear-form-btn")?.addEventListener("click", resetForm);
  $("reload-btn")?.addEventListener("click", render);

  $("delete-all-btn")?.addEventListener("click", () => {
    if (!confirm("登録済みの台帳をすべて削除しますか？この操作は取り消せません。")) {
      return;
    }

    saveLedger([]);
    resetForm();
    render();
  });

  $("ai-analysis-btn")?.addEventListener("click", render);

  render();
});
