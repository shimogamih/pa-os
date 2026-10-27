
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
    alert("台帳を保存できませんでした。");
    console.error(error);
    return false;
  }
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "未入力";
  return Number(value).toLocaleString("ja-JP", { maximumFractionDigits: 2 }) + "円";
}

function signedMoney(value) {
  if (value === null || !Number.isFinite(Number(value))) return "未計算";
  const n = Number(value);
  return (n > 0 ? "+" : "") + money(n);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function getFormData() {
  const name = $("stock-name").value.trim();
  if (!name) {
    alert("銘柄名を入力してください。");
    return null;
  }

  const item = {
    type: $("stock-type").value,
    name,
    code: $("stock-code").value.trim(),
    shares: num($("stock-shares").value),
    cost: num($("stock-cost").value),
    current: num($("stock-current").value),
    dividend: num($("stock-dividend").value),
    per: num($("stock-per").value),
    pbr: num($("stock-pbr").value),
    equity: num($("stock-equity").value),
    growth: num($("stock-growth").value),
    stability: num($("stock-stability").value),
    risk: num($("stock-risk").value),
    updatedAt: new Date().toISOString()
  };

  if (item.shares !== null && item.shares < 0) {
    alert("保有数は0以上にしてください。");
    return null;
  }

  for (const key of ["cost", "current", "dividend", "per", "pbr"]) {
    if (item[key] !== null && item[key] < 0) {
      alert("価格・配当利回り・PER・PBRは0以上で入力してください。");
      return null;
    }
  }

  for (const [label, value] of [
    ["自己資本比率", item.equity],
    ["業績安定度", item.stability],
    ["リスク水準", item.risk]
  ]) {
    if (value !== null && (value < 0 || value > 100)) {
      alert(label + "は0〜100で入力してください。");
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
  ].forEach(id => { if ($(id)) $(id).value = ""; });

  $("stock-type").value = "stock";
  editingIndex = null;
  $("add-stock-btn").textContent = "＋ 台帳に登録";
  $("save-status").textContent = "入力待ち";
}

function saveHolding(event) {
  if (event) event.preventDefault();

  const item = getFormData();
  if (!item) return;

  const data = readLedger();

  if (editingIndex === null) {
    item.createdAt = new Date().toISOString();
    data.push(item);
  } else {
    const old = data[editingIndex];
    if (!old) {
      alert("編集対象が見つかりません。");
      resetForm();
      return;
    }
    data[editingIndex] = {
      ...old, ...item,
      createdAt: old.createdAt || item.createdAt
    };
  }

  if (!saveLedger(data)) return;

  resetForm();
  render();
  $("save-status").textContent = "保存しました";
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
    $(id).value = value ?? "";
  });

  $("stock-type").value = ["stock", "etf", "fund"].includes(item.type)
    ? item.type : "stock";

  editingIndex = index;
  $("add-stock-btn").textContent = "変更を保存";
  $("save-status").textContent = "編集中";
  $("stock-name").scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteHolding(index) {
  const data = readLedger();
  if (!data[index]) return;
  if (!confirm(data[index].name + " を削除しますか？")) return;

  data.splice(index, 1);
  if (!saveLedger(data)) return;

  if (editingIndex === index) resetForm();
  else if (editingIndex !== null && editingIndex > index) editingIndex--;

  render();
}

function analyzeStock(stock) {
  // 投資信託には株式のPER・PBR等を適用しない
  const isFund = stock.type === "fund";
  let score = 0;
  let maxScore = 0;
  const details = [];

  function add(label, value, max, calc) {
    if (value === null || value === undefined || value === "") {
      details.push(label + "：データ不足");
      return;
    }
    const v = Number(value);
    if (!Number.isFinite(v)) {
      details.push(label + "：データ不足");
      return;
    }
    const points = Math.max(0, Math.min(max, calc(v)));
    score += points;
    maxScore += max;
    details.push(`${label}：${points.toFixed(1)} / ${max}点`);
  }

  if (isFund) {
    details.push("投資信託：株式向けPER・PBR・自己資本比率評価は対象外");
    add("取得価格との比較", num(stock.current) !== null &&
      num(stock.cost) !== null && num(stock.cost) > 0
      ? num(stock.current) / num(stock.cost) * 100 : null,
      40, v => v >= 80 && v <= 120 ? 40 : v >= 60 && v <= 140 ? 30 : 15);
    add("リターン情報", num(stock.growth), 30,
      v => v >= 15 ? 30 : v >= 8 ? 24 : v >= 0 ? 15 : 3);
    add("リスク水準", num(stock.risk), 30, v => (100 - v) * 0.3);
  } else {
    add("配当利回り", num(stock.dividend), 20,
      v => v >= 4 ? 20 : v >= 3 ? 16 : v >= 2 ? 12 : v >= 1 ? 7 : 2);
    add("自己資本比率", num(stock.equity), 20,
      v => v >= 70 ? 20 : v >= 50 ? 17 : v >= 40 ? 14 : v >= 30 ? 10 : v >= 20 ? 6 : 2);
    add("売上成長率", num(stock.growth), 15,
      v => v >= 20 ? 15 : v >= 10 ? 12 : v >= 5 ? 9 : v >= 0 ? 6 : 1);
    add("PER", num(stock.per), 8,
      v => v <= 0 ? 0 : v <= 10 ? 8 : v <= 15 ? 7 : v <= 20 ? 5 : v <= 30 ? 3 : 1);
    add("PBR", num(stock.pbr), 7,
      v => v <= 0 ? 0 : v <= 1 ? 7 : v <= 1.5 ? 6 : v <= 2 ? 4 : v <= 3 ? 2 : 1);
    add("業績安定度", num(stock.stability), 15, v => v * 0.15);
    const current = num(stock.current);
    const cost = num(stock.cost);
    add("取得価格との比較",
      current !== null && cost !== null && cost > 0 ? current / cost * 100 : null,
      10, v => v >= 80 && v <= 120 ? 10 : v >= 60 && v <= 140 ? 7 : v >= 40 && v <= 160 ? 4 : 1);
    add("リスク評価", num(stock.risk), 5, v => (100 - v) * 0.05);
  }

  return {
    score: Math.round(score * 10) / 10,
    maxScore,
    details
  };
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

  list.innerHTML = "";

  if (data.length === 0) {
    list.innerHTML = "<p>まだ資産が登録されていません。</p>";
  }

  data.forEach((stock, index) => {
    const shares = num(stock.shares);
    const cost = num(stock.cost);
    const current = num(stock.current);

    // 投資信託の口数は通常1万口単位の基準価額で表示されるため、
    // 現段階では「口数×基準価額」ではなく、入力単位に従って計算する。
    const value = shares !== null && current !== null ? shares * current : null;
    const costTotal = shares !== null && cost !== null ? shares * cost : null;
    const profit = value !== null && costTotal !== null ? value - costTotal : null;
    const rate = profit !== null && costTotal > 0 ? profit / costTotal * 100 : null;

    if (costTotal !== null) { totalCost += costTotal; costCount++; }
    if (value !== null) { totalValue += value; valueCount++; }
    if (profit !== null) { totalProfit += profit; profitCount++; }

    const analysis = analyzeStock(stock);
    const typeName = { stock: "個別株", etf: "ETF", fund: "投資信託" }[stock.type] || "個別株";
    const card = document.createElement("article");
    card.className = "holding";

    card.innerHTML = `
      <div class="holding-header">
        <div>
          <div class="holding-name">${escapeHtml(stock.name || "名称未設定")}</div>
          <div class="holding-code">${escapeHtml(typeName)} / ${escapeHtml(stock.code || "コード未入力")}</div>
        </div>
        <div class="analysis-score">評価 ${analysis.score} / ${analysis.maxScore}点</div>
      </div>
      <div class="holding-info">
        保有数・口数：${shares ?? "未入力"}<br>
        取得単価・基準価額：${money(cost)}<br>
        現在値・基準価額：${money(current)}<br>
        投資元本：${money(costTotal)}<br>
        評価額：${money(value)}<br>
        含み損益：<span class="${profit === null ? "" : profit >= 0 ? "positive" : "negative"}">${signedMoney(profit)}</span><br>
        損益率：${rate === null ? "未計算" : (rate >= 0 ? "+" : "") + rate.toFixed(2) + "%"}<br>
        配当利回り：${num(stock.dividend) === null ? "未入力" : stock.dividend + "%"}
      </div>
      <div class="holding-info">${analysis.details.map(escapeHtml).join("<br>")}</div>
      <div class="pa-actions">
        <button class="pa-btn secondary" type="button" data-edit="${index}">編集</button>
        <button class="pa-btn secondary" type="button" data-delete="${index}">削除</button>
      </div>
    `;

    list.appendChild(card);
  });

  list.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => startEdit(Number(button.dataset.edit)));
  });
  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => deleteHolding(Number(button.dataset.delete)));
  });

  $("total-holdings").textContent = data.length;
  $("total-cost").textContent = money(totalCost);
  $("portfolio-value").textContent = valueCount ? money(totalValue) : "未計算";
  $("open-pl").textContent = profitCount ? signedMoney(totalProfit) : "未計算";

  $("open-pl").className = profitCount
    ? totalProfit >= 0 ? "positive" : "negative"
    : "";

  $("portfolio-return").textContent =
    costCount === data.length && profitCount === data.length &&
    data.length > 0 && totalCost > 0
      ? (totalProfit >= 0 ? "+" : "") + (totalProfit / totalCost * 100).toFixed(2) + "%"
      : "データ不足";

  $("data-status").textContent =
    data.length === 0 ? "入力待ち" :
    valueCount < data.length ? "現在値が一部不足" : "現在値入力済み";

  $("ai-analysis-result").innerHTML = `
    <h3>ポートフォリオ分析</h3>
    <p>登録資産数：${data.length}</p>
    <p>投資元本：${money(totalCost)}${costCount < data.length ? "（一部不足）" : ""}</p>
    <p>現在評価額：${valueCount ? money(totalValue) : "現在値を入力してください"}</p>
    <p>含み損益：${profitCount ? signedMoney(totalProfit) : "計算データ不足"}</p>
    <p>100点評価は入力済みデータのみで計算します。データが不足する場合は満点を分母にせず、採点可能点を表示します。</p>
    <p>現在値は手入力です。最新株価を自動取得していません。</p>
  `;

  $("test-status").textContent = "✓ PA-OS起動完了";
}

document.addEventListener("DOMContentLoaded", () => {
  $("holding-form").addEventListener("submit", saveHolding);
  $("clear-form-btn").addEventListener("click", resetForm);
  $("reload-btn").addEventListener("click", render);
  $("ai-analysis-btn").addEventListener("click", render);

  $("delete-all-btn").addEventListener("click", () => {
    if (!confirm("台帳をすべて削除しますか？この操作は取り消せません。")) return;
    if (saveLedger([])) {
      resetForm();
      render();
    }
  });

  render();
});
