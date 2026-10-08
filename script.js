document.addEventListener("DOMContentLoaded", function () {

  const KEY = "pa_os_portfolio_ledger";

  const $ = (id) => document.getElementById(id);

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function money(value) {
    return "¥" + Number(value || 0).toLocaleString("ja-JP");
  }

  // =========================
  // 台帳表示
  // =========================

  function render() {

    const data = load();

    const holdingsCount = $("total-holdings");
    const totalCost = $("total-cost");
    const list = $("holdings-list");

    if (!holdingsCount || !totalCost || !list) {
      return;
    }

    holdingsCount.textContent = data.length;

    let total = 0;

    data.forEach(stock => {
      total += Number(stock.shares || 0) * Number(stock.cost || 0);
    });

    totalCost.textContent = money(total);

    if (data.length === 0) {
      list.innerHTML =
        '<div class="empty">まだ銘柄が登録されていません。</div>';
      return;
    }

    list.innerHTML = data.map((stock, index) => {

      return `
        <div class="holding">

          <div class="holding-header">

            <div>
              <div class="holding-name">
                ${escapeHtml(stock.name)}
              </div>

              <div class="holding-code">
                ${escapeHtml(stock.code)}
              </div>
            </div>

            <button
              type="button"
              class="danger"
              data-delete="${index}"
            >
              削除
            </button>

          </div>

          <div class="holding-info">

            保有株数：
            ${Number(stock.shares).toLocaleString()} 株<br>

            取得単価：
            ${money(stock.cost)}<br>

            投資元本：
            ${money(
              Number(stock.shares) * Number(stock.cost)
            )}

          </div>

        </div>
      `;

    }).join("");

    document.querySelectorAll("[data-delete]").forEach(button => {

      button.addEventListener("click", function () {

        const index = Number(this.dataset.delete);

        const current = load();

        current.splice(index, 1);

        save(current);

        render();

      });

    });

  }


  // =========================
  // HTML安全処理
  // =========================

  function escapeHtml(value) {

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  // =========================
  // 銘柄追加
  // =========================

  const addButton = $("add-stock-btn");

  if (addButton) {

    addButton.addEventListener("click", function () {

      const name = $("stock-name").value.trim();
      const code = $("stock-code").value.trim();
      const shares = Number($("stock-shares").value);
      const cost = Number($("stock-cost").value);

      if (!name || !code || !shares || !cost) {

        alert("銘柄名・コード・株数・取得単価をすべて入力してください。");

        return;
      }

      const data = load();

      data.push({
        name: name,
        code: code,
        shares: shares,
        cost: cost,
        createdAt: new Date().toISOString()
      });

      save(data);

      $("stock-name").value = "";
      $("stock-code").value = "";
      $("stock-shares").value = "";
      $("stock-cost").value = "";

      $("save-status").innerHTML =
        `<p class="success">✓ ${escapeHtml(name)} を保存しました</p>`;

      render();

    });

  }


  // =========================
  // 入力クリア
  // =========================

  const clearButton = $("clear-form-btn");

  if (clearButton) {

    clearButton.addEventListener("click", function () {

      $("stock-name").value = "";
      $("stock-code").value = "";
      $("stock-shares").value = "";
      $("stock-cost").value = "";

    });

  }


  // =========================
  // 再読み込み
  // =========================

  const reloadButton = $("reload-btn");

  if (reloadButton) {

    reloadButton.addEventListener("click", function () {

      render();

      $("test-status").textContent =
        "✓ 台帳を再読み込みしました";

    });

  }


  // =========================
  // 全削除
  // =========================

  const deleteAllButton = $("delete-all-btn");

  if (deleteAllButton) {

    deleteAllButton.addEventListener("click", function () {

      if (!confirm("全銘柄を削除しますか？")) {
        return;
      }

      localStorage.removeItem(KEY);

      render();

      $("test-status").textContent =
        "✓ 台帳を削除しました";

    });

  }


  // =========================
  // PA-OS AI分析
  // =========================

  const aiButton = $("ai-analysis-btn");

  if (aiButton) {

    aiButton.addEventListener("click", function () {

      const data = load();

      const result = $("ai-analysis-result");

      if (!result) {
        return;
      }

      if (data.length === 0) {

        result.innerHTML = `
          <div class="holding">
            <div class="gold">
              ⚔️ PA-OS分析エンジン
            </div>

            <div class="holding-info">
              先に保有銘柄を登録してください。
            </div>
          </div>
        `;

        return;
      }


      let html = `
        <div class="holding">

          <div
            class="gold"
            style="
              font-size:20px;
              font-weight:bold;
            "
          >
            ⚔️ PA-OS分析エンジン
          </div>

          <div
            class="holding-info"
            style="margin-top:8px;"
          >
            分析対象：${data.length}銘柄
          </div>
      `;


      data.forEach(stock => {

        html += `

          <div
            style="
              margin-top:18px;
              padding-top:16px;
              border-top:1px solid #293449;
            "
          >

            <div
              style="
                font-size:18px;
                font-weight:bold;
              "
            >
              ${escapeHtml(stock.name)}

              <span class="holding-code">
                ${escapeHtml(stock.code)}
              </span>
            </div>


            <div
              style="
                margin-top:10px;
                font-size:24px;
                color:#d4af37;
                font-weight:bold;
              "
            >
              評価：分析準備完了
            </div>


            <div
              class="holding-info"
              style="margin-top:12px;"
            >

              配当　　— / 20点<br>
              財務　　— / 20点<br>
              成長性　— / 15点<br>
              割安度　— / 15点<br>
              安定性　— / 15点<br>
              株価位置— / 10点<br>
              リスク　— / 5点

            </div>


            <div
              style="
                margin-top:14px;
                color:#8f9aad;
              "
            >
              🌐 最新Web情報を取得すると、
              PA-OS独自ルールで100点評価します。
            </div>

          </div>

        `;

      });


      html += `</div>`;

      result.innerHTML = html;

    });

  }


  // =========================
  // 起動
  // =========================

  render();

  if ($("test-status")) {

    $("test-status").textContent =
      "✓ PA-OS起動完了";

  }

});
