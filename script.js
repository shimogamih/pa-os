document.addEventListener("DOMContentLoaded", function () {

  const KEY = "pa_os_portfolio_ledger";

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
    return "¥" + Number(value).toLocaleString("ja-JP");
  }


  // =========================
  // ポートフォリオ表示
  // =========================

  function render() {

    const data = load();

    const holdingsCount =
      document.getElementById("total-holdings");

    const totalCost =
      document.getElementById("total-cost");

    const list =
      document.getElementById("holdings-list");

    if (!holdingsCount || !totalCost || !list) return;

    holdingsCount.textContent = data.length;

    let total = 0;

    data.forEach(item => {
      total +=
        Number(item.shares) *
        Number(item.cost);
    });

    totalCost.textContent = money(total);

    if (data.length === 0) {

      list.innerHTML =
        '<div class="empty">まだ銘柄が登録されていません。</div>';

      return;
    }

    list.innerHTML = data.map((item, index) => `

      <div class="holding">

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
            onclick="deleteStock(${index})"
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

      </div>

    `).join("");
  }


  // =========================
  // 銘柄追加
  // =========================

  document
    .getElementById("add-stock-btn")
    .addEventListener("click", function () {

      const name =
        document.getElementById("stock-name").value.trim();

      const code =
        document.getElementById("stock-code").value.trim();

      const shares =
        Number(document.getElementById("stock-shares").value);

      const cost =
        Number(document.getElementById("stock-cost").value);

      if (!name || !code || !shares || !cost) {

        alert("4項目すべて入力してください");

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

      document.getElementById("stock-name").value = "";
      document.getElementById("stock-code").value = "";
      document.getElementById("stock-shares").value = "";
      document.getElementById("stock-cost").value = "";

      document.getElementById("save-status").innerHTML =
        `<p class="success">✓ ${name} を保存しました</p>`;

      render();
    });


  // =========================
  // 入力クリア
  // =========================

  document
    .getElementById("clear-form-btn")
    .addEventListener("click", function () {

      document.getElementById("stock-name").value = "";
      document.getElementById("stock-code").value = "";
      document.getElementById("stock-shares").value = "";
      document.getElementById("stock-cost").value = "";

    });


  // =========================
  // 再読み込み
  // =========================

  document
    .getElementById("reload-btn")
    .addEventListener("click", function () {

      render();

      document.getElementById("test-status").textContent =
        "台帳を再読み込みしました";

    });


  // =========================
  // 全削除
  // =========================

  document
    .getElementById("delete-all-btn")
    .addEventListener("click", function () {

      if (!confirm("全銘柄を削除しますか？")) {
        return;
      }

      localStorage.removeItem(KEY);

      render();

      document.getElementById("test-status").textContent =
        "台帳を削除しました";

    });


  // =========================
  // 個別削除
  // =========================

  window.deleteStock = function (index) {

    const data = load();

    data.splice(index, 1);

    save(data);

    render();

  };


  // ==================================================
  // PA-OS 分析エンジン
  // ==================================================

  function calculateScore(stock) {

    /*
      PA-OS 100点ルール

      配当       20点
      財務       20点
      成長性     15点
      割安度     15点
      安定性     15点
      株価位置   10点
      リスク      5点

      合計      100点
    */

    const rules = {

      dividend: 20,
      financial: 20,
      growth: 15,
      valuation: 15,
      stability: 15,
      price: 10,
      risk: 5

    };

    /*
      現段階ではWeb情報をまだ取得していないため、
      ここでは「何点取れる設計なのか」を保持する。

      後からWeb検索で取得した数値を
      この項目へ入れるだけで採点できる構造。
    */

    return {

      maxScore: 100,

      categories: [

        {
          name: "配当",
          max: rules.dividend,
          score: null
        },

        {
          name: "財務",
          max: rules.financial,
          score: null
        },

        {
          name: "成長性",
          max: rules.growth,
          score: null
        },

        {
          name: "割安度",
          max: rules.valuation,
          score: null
        },

        {
          name: "安定性",
          max: rules.stability,
          score: null
        },

        {
          name: "株価位置",
          max: rules.price,
          score: null
        },

        {
          name: "リスク",
          max: rules.risk,
          score: null
        }

      ]

    };
  }


  // =========================
  // AI分析ボタン
  // =========================

  document
    .getElementById("ai-analysis-btn")
    .addEventListener("click", function () {

      const data = load();

      const result =
        document.getElementById("ai-analysis-result");

      if (!data.length) {

        result.innerHTML = `
          <p class="subtitle">
            先に銘柄を登録してください。
          </p>
        `;

        return;
      }


      let html = `

        <div class="holding" style="margin-top:16px;">

          <div class="gold"
               style="font-size:20px;">
            ⚔️ PA-OS分析エンジン
          </div>

          <div class="holding-info">

            分析対象：
            ${data.length}銘柄

          </div>

      `;


      data.forEach(stock => {

        const analysis =
          calculateScore(stock);

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
              ${stock.name}
              <span
                class="holding-code"
              >
                ${stock.code}
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
              評価：情報取得待ち
            </div>

            <div
              class="holding-info"
              style="margin-top:12px;"
            >

              配当　　— / ${analysis.categories[0].max}点<br>
              財務　　— / ${analysis.categories[1].max}点<br>
              成長性　— / ${analysis.categories[2].max}点<br>
              割安度　— / ${analysis.categories[3].max}点<br>
              安定性　— / ${analysis.categories[4].max}点<br>
              株価位置— / ${analysis.categories[5].max}点<br>
              リスク　— / ${analysis.categories[6].max}点

            </div>

            <div
              style="
                margin-top:14px;
                color:#8f9aad;
              "
            >
              🌐 最新Web情報を取得すると
              PA-OS独自ルールで100点評価します。
            </div>

          </div>

        `;

      });


      html += `</div>`;

      result.innerHTML = html;

    });


  // =========================
  // 起動
  // =========================

  render();

});
