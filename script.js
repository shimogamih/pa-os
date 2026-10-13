
document.addEventListener("DOMContentLoaded", function () {
  const KEY = "pa_os_portfolio_ledger";
  const $ = id => document.getElementById(id);

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function num(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function money(value) {
    return "¥" + Math.round(value).toLocaleString("ja-JP");
  }

  function fmt(value, suffix = "") {
    return value === null || value === undefined
      ? "データ不足"
      : value.toLocaleString("ja-JP") + suffix;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function costOf(stock) {
    return Number(stock.shares || 0) * Number(stock.cost || 0);
  }

  function currentOf(stock) {
    return num(stock.current);
  }

  function valueOf(stock) {
    const current = currentOf(stock);
    if (current === null) return null;
    return Number(stock.shares || 0) * current;
  }

  function profitOf(stock) {
    const value = valueOf(stock);
    if (value === null) return null;
    return value - costOf(stock);
  }

  function pctOf(stock) {
    const profit = profitOf(stock);
    const cost = costOf(stock);
    if (profit === null || cost <= 0) return null;
    return profit / cost * 100;
  }

  function render() {
    const data = load();

    if ($("total-holdings")) {
      $("total-holdings").textContent = data.length;
    }

    const totalCost = data.reduce((sum, stock) => sum + costOf(stock), 0);

    if ($("total-cost")) {
      $("total-cost").textContent = money(totalCost);
    }

    const list = $("holdings-list");
    if (!list) return;

    if (!data.length) {
      list.innerHTML = '<div class="empty">まだ銘柄が登録されていません。</div>';
      return;
    }

    list.innerHTML = data.map((stock, index) => {
      const value = valueOf(stock);
      const profit = profitOf(stock);
      const pct = pctOf(stock);

      const profitClass = profit === null
        ? ""
        : profit >= 0 ? "positive" : "negative";

      return `
        <div class="holding">
          <div class="holding-header">
            <div>
              <div class="holding-name">${escapeHtml(stock.name)}</div>
              <div class="holding-code">${escapeHtml(stock.code)}</div>
            </div>
            <button type="button" class="danger" data-delete="${index}">
              削除
            </button>
          </div>

          <div class="holding-info">
            保有株数・口数：${fmt(Number(stock.shares || 0))}<br>
            取得単価：${money(stock.cost)}<br>
            投資元本：${money(costOf(stock))}<br>
            現在株価・基準価額：
            ${currentOf(stock) === null ? "未入力" : money(currentOf(stock))}<br>
            評価額：${value === null ? "データ不足" : money(value)}<br>
            含み損益：
            <span class="${profitClass}">
              ${profit === null ? "データ不足" : (profit > 0 ? "+" : "") + money(profit)}
            </span><br>
            損益率：
            <span class="${profitClass}">
              ${pct === null ? "データ不足" : (pct > 0 ? "+" : "") + pct.toFixed(2) + "%"}
            </span><br>
            配当利回り：${fmt(num(stock.dividend), "%")}<br>
            PER：${fmt(num(stock.per))}<br>
            PBR：${fmt(num(stock.pbr))}<br>
            自己資本比率：${fmt(num(stock.equity), "%")}<br>
            売上成長率：${fmt(num(stock.growth), "%")}
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", function () {
        const index = Number(this.dataset.delete);
        const current = load();
        if (index < 0 || index >= current.length) return;
        current.splice(index, 1);
        save(current);
        render();
      });
    });
  }

  function clearForm() {
    [
      "stock-name", "stock-code", "stock-shares", "stock-cost",
      "stock-current", "stock-dividend", "stock-per", "stock-pbr",
      "stock-equity", "stock-growth"
    ].forEach(id => {
      if ($(id)) $(id).value = "";
    });
  }

  const addButton = $("add-stock-btn");

  if (addButton) {
    addButton.addEventListener("click", function () {
      const name = $("stock-name").value.trim();
      const code = $("stock-code").value.trim();
      const shares = num($("stock-shares").value);
      const cost = num($("stock-cost").value);

      if (!name || !code || shares === null || shares <= 0 ||
          cost === null || cost <= 0) {
        alert("銘柄名・コード・正の株数・取得単価を入力してください。");
        return;
      }

      const data = load();

      data.push({
        name,
        code,
        shares,
        cost,
        current: num($("stock-current").value),
        dividend: num($("stock-dividend").value),
        per: num($("stock-per").value),
        pbr: num($("stock-pbr").value),
        equity: num($("stock-equity").value),
        growth: num($("stock-growth").value),
        createdAt: new Date().toISOString()
      });

      try {
        save(data);
        clearForm();

        if ($("save-status")) {
          $("save-status").innerHTML =
            `<p class="success">✓ ${escapeHtml(name)} を保存しました。</p>`;
        }

        render();
      } catch (e) {
        alert("保存に失敗しました。ブラウザの空き容量を確認してください。");
      }
    });
  }

  if ($("clear-form-btn")) {
    $("clear-form-btn").addEventListener("click", clearForm);
  }

  if ($("reload-btn")) {
    $("reload-btn").addEventListener("click", function () {
      render();
      if ($("test-status")) {
        $("test-status").textContent = "✓ 台帳を再読み込みしました";
      }
    });
  }

  if ($("delete-all-btn")) {
    $("delete-all-btn").addEventListener("click", function () {
      if (!confirm("登録した全銘柄を削除しますか？この操作は取り消せません。")) {
        return;
      }

      localStorage.removeItem(KEY);
      render();

      if ($("test-status")) {
        $("test-status").textContent = "✓ 台帳を削除しました";
      }
    });
  }

  // 未入力データを推測せず、項目ごとに採点する
  function scoreItem(value, max, calculator) {
    if (value === null || value === undefined) {
      return { score: null, max };
    }

    return {
      score: Math.max(0, Math.min(max, calculator(value))),
      max
    };
  }

  function analyzeStock(stock) {
    const dividend = num(stock.dividend);
    const per = num(stock.per);
    const pbr = num(stock.pbr);
    const equity = num(stock.equity);
    const growth = num(stock.growth);
    const current = currentOf(stock);
    const cost = num(stock.cost);

    const scores = [
      scoreItem(dividend, 20, v =>
        v >= 4 ? 20 : v >= 3 ? 16 : v >= 2 ? 12 : v >= 1 ? 7 : 2
      ),
      scoreItem(equity, 20, v =>
        v >= 70 ? 20 : v >= 50 ? 17 : v >= 40 ? 14 :
        v >= 30 ? 10 : v >= 20 ? 6 : 2
      ),
      scoreItem(growth, 15, v =>
        v >= 20 ? 15 : v >= 10 ? 12 : v >= 5 ? 9 :
        v >= 0 ? 6 : 1
      ),
      scoreItem(per, 8, v =>
        v <= 10 ? 8 : v <= 15 ? 7 : v <= 20 ? 5 :
        v <= 30 ? 3 : 1
      ),
      scoreItem(pbr, 7, v =>
        v <= 0.7 ? 7 : v <= 1 ? 6 : v <= 1.5 ? 5 :
        v <= 2 ? 3 : 1
      ),
      scoreItem(current !== null && cost > 0
        ? current / cost * 100 : null, 15, v =>
        v >= 90 && v <= 110 ? 15 :
        v >= 80 && v <= 120 ? 12 :
        v >= 70 && v <= 130 ? 8 : 4
      )
    ];

    const knownScore = scores.reduce(
      (sum, item) => sum + (item.score === null ? 0 : item.score), 0
    );

    const knownMax = scores.reduce(
      (sum, item) => sum + (item.score === null ? 0 : item.max), 0
    );

    const missing = scores.filter(item => item.score === null).length;

    return { knownScore, knownMax, missing };
  }

  if ($("ai-analysis-btn")) {
    $("ai-analysis-btn").addEventListener("click", function () {
      const data = load();
      const result = $("ai-analysis-result");
      if (!result) return;

      if (!data.length) {
        result.innerHTML =
          '<div class="empty">先に保有銘柄を登録してください。</div>';
        return;
      }

      const totalCost = data.reduce((sum, stock) => sum + costOf(stock), 0);
      let totalValue = 0;
      let knownValueCount = 0;
      let totalProfit = 0;

      data.forEach(stock => {
        const value = valueOf(stock);
        const profit = profitOf(stock);

        if (value !== null) {
          totalValue += value;
          knownValueCount++;
        }

        if (profit !== null) totalProfit += profit;
      });

      const allValuesKnown = knownValueCount === data.length;
      const totalPct = totalCost > 0 && allValuesKnown
        ? totalProfit / totalCost * 100
        : null;

      let html = `
        <div class="holding">
          <div class="gold"><strong>⚔ PA-OS 分析レポート</strong></div>
          <div class="holding-info">
            分析対象：${data.length}銘柄<br>
            投資元本：${money(totalCost)}<br>
            評価額：${allValuesKnown ? money(totalValue) : "一部データ不足"}<br>
            含み損益：
            <span class="${totalProfit >= 0 ? "positive" : "negative"}">
              ${allValuesKnown ? (totalProfit > 0 ? "+" : "") + money(totalProfit) : "一部データ不足"}
            </span><br>
            損益率：
            ${totalPct === null ? "データ不足" : (totalPct > 0 ? "+" : "") + totalPct.toFixed(2) + "%"}
          </div>
        </div>
      `;

      data.forEach(stock => {
        const analysis = analyzeStock(stock);
        const profit = profitOf(stock);
        const pct = pctOf(stock);

        html += `
          <div class="holding">
            <div class="holding-name">
              ${escapeHtml(stock.name)}
              <span class="holding-code">${escapeHtml(stock.code)}</span>
            </div>

            <div class="analysis-score">
              ${analysis.knownMax === 0
                ? "評価：データ不足"
                : `暫定評価：${analysis.knownScore}点 / ${analysis.knownMax}点`}
            </div>

            <div class="bar">
              <div class="bar-fill"
                style="width:${analysis.knownMax
                  ? analysis.knownScore / analysis.knownMax * 100
                  : 0}%"></div>
            </div>

            <div class="holding-info">
              評価額：${valueOf(stock) === null ? "データ不足" : money(valueOf(stock))}<br>
              含み損益：${profit === null ? "データ不足" : money(profit)}<br>
              損益率：${pct === null ? "データ不足" : pct.toFixed(2) + "%"}<br>
              配当利回り：${fmt(num(stock.dividend), "%")}<br>
              PER：${fmt(num(stock.per))}<br>
              PBR：${fmt(num(stock.pbr))}<br>
              自己資本比率：${fmt(num(stock.equity), "%")}<br>
              売上成長率：${fmt(num(stock.growth), "%")}
            </div>

            <p class="warning">
              ${analysis.missing
                ? `未入力の評価項目が${analysis.missing}個あります。`
                : "入力済み項目のルールベース評価です。"}
              実際の財務分析や最新市場データの取得は行っていません。
            </p>
          </div>
        `;
      });

      result.innerHTML = html;
    });
  }

  render();

  if ($("test-status")) {
    $("test-status").textContent = "✓ PA-OS起動完了";
  }
});
