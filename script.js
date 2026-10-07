(() => {
  "use strict";

  const LEDGER_KEY = "pa_os_portfolio_ledger";

  function $(id) {
    return document.getElementById(id);
  }

  function loadLedger() {
    try {
      const data = localStorage.getItem(LEDGER_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("PA-OS: 読み込みエラー", error);
      return [];
    }
  }

  function saveLedger(data) {
    try {
      localStorage.setItem(
        LEDGER_KEY,
        JSON.stringify(data)
      );
      return true;
    } catch (error) {
      console.error("PA-OS: 保存エラー", error);
      return false;
    }
  }

  function money(value) {
    return "¥" + Number(value).toLocaleString("ja-JP");
  }

  function render() {

    const ledger = loadLedger();
    const list = $("holdings-list");

    if (!list) return;

    if ($("total-holdings")) {
      $("total-holdings").textContent = ledger.length;
    }

    let total = 0;

    ledger.forEach(item => {
      total +=
        Number(item.shares) *
        Number(item.cost);
    });

    if ($("total-cost")) {
      $("total-cost").textContent = money(total);
    }

    if (!ledger.length) {

      list.innerHTML = `
        <div class="empty">
          まだ銘柄が登録されていません。
        </div>
      `;

      return;
    }

    list.innerHTML = "";

    ledger.forEach((item, index) => {

      const div =
        document.createElement("div");

      div.className = "holding";

      div.innerHTML = `
        <div class="holding-header">

          <div>
            <div class="holding-name">
              ${item.name}
            </div>

            <div class="holding-code">
              ${item.code}
            </div>
          </div>

          <button
            type="button"
            class="danger"
            data-index="${index}"
          >
            削除
          </button>

        </div>

        <div class="holding-info">

          保有株数：
          ${Number(item.shares).toLocaleString()} 株<br>

          取得単価：
          ${money(item.cost)}<br>

          投資元本：
          ${money(
            Number(item.shares) *
            Number(item.cost)
          )}

        </div>
      `;

      list.appendChild(div);
    });

    list
      .querySelectorAll("[data-index]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(button.dataset.index);

            const data =
              loadLedger();

            data.splice(index, 1);

            saveLedger(data);

            render();
          }
        );

      });
  }


  // =========================
  // 銘柄追加
  // =========================

  function addStock() {

    const name =
      $("stock-name").value.trim();

    const code =
      $("stock-code").value.trim();

    const shares =
      Number($("stock-shares").value);

    const cost =
      Number($("stock-cost").value);

    if (!name) {
      alert("銘柄名を入力してください");
      return;
    }

    if (!code) {
      alert("銘柄コードを入力してください");
      return;
    }

    if (!shares || shares <= 0) {
      alert("保有株数を入力してください");
      return;
    }

    if (!cost || cost <= 0) {
      alert("取得単価を入力してください");
      return;
    }

    const ledger =
      loadLedger();

    ledger.push({

      name,
      code,
      shares,
      cost,

      createdAt:
        new Date().toISOString()

    });

    if (!saveLedger(ledger)) {
      alert("保存に失敗しました");
      return;
    }

    $("stock-name").value = "";
    $("stock-code").value = "";
    $("stock-shares").value = "";
    $("stock-cost").value = "";

    $("save-status").innerHTML = `
      <p class="success">
        ✓ ${name} を保存しました
      </p>
    `;

    render();
  }


  // =========================
  // 入力クリア
  // =========================

  function clearForm() {

    $("stock-name").value = "";
    $("stock-code").value = "";
    $("stock-shares").value = "";
    $("stock-cost").value = "";

  }


  // =========================
  // 全削除
  // =========================

  function deleteAll() {

    if (!confirm("全銘柄を削除しますか？")) {
      return;
    }

    localStorage.removeItem(LEDGER_KEY);

    render();
  }


  // =========================
  // AI分析
  // =========================

  function runAIAnalysis() {

    const ledger = loadLedger();

    const result =
      $("ai-analysis-result");

    if (!result) return;

    if (!ledger.length) {

      result.innerHTML = `
        <p class="subtitle">
          先に銘柄を登録してください。
        </p>
      `;

      return;
    }

    let totalCost = 0;

    ledger.forEach(item => {

      totalCost +=
        Number(item.shares) *
        Number(item.cost);

    });

    result.innerHTML = `

      <div class="holding" style="margin-top:16px;">

        <div class="gold">
          PA-OS 分析準備完了
        </div>

        <div class="holding-info">

          登録銘柄：
          ${ledger.length} 銘柄<br>

          投資元本：
          ${money(totalCost)}<br><br>

          <strong>
            AI分析対象
          </strong>

          <br>

          ${ledger.map(item => `
            ・${item.name}
            （${item.code}）
          `).join("<br>")}

        </div>

      </div>

    `;

  }


  // =========================
  // 起動
  // =========================

  function start() {

    console.log("PA-OS 起動");

    const addButton =
      $("add-stock-btn");

    if (addButton) {

      addButton.addEventListener(
        "click",
        addStock
      );

    }

    const clearButton =
      $("clear-form-btn");

    if (clearButton) {

      clearButton.addEventListener(
        "click",
        clearForm
      );

    }

    const reloadButton =
      $("reload-btn");

    if (reloadButton) {

      reloadButton.addEventListener(
        "click",
        render
      );

    }

    const deleteAllButton =
      $("delete-all-btn");

    if (deleteAllButton) {

      deleteAllButton.addEventListener(
        "click",
        deleteAll
      );

    }

    const aiButton =
      $("ai-analysis-btn");

    if (aiButton) {

      aiButton.addEventListener(
        "click",
        runAIAnalysis
      );

    }

    render();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();

  }

})();
