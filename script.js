(() => {
  "use strict";

  /*
   * ============================================================
   * PA-OS
   * 手入力ポートフォリオ台帳
   * ============================================================
   */

  const LEDGER_KEY = "pa_os_portfolio_ledger";


  /*
   * ============================================================
   * ELEMENT
   * ============================================================
   */

  const $ = (id) => {
    return document.getElementById(id);
  };


  /*
   * ============================================================
   * LOAD LEDGER
   * ============================================================
   */

  function loadLedger() {

    try {

      const saved =
        localStorage.getItem(
          LEDGER_KEY
        );

      if (!saved) {
        return [];
      }

      const data =
        JSON.parse(saved);

      if (!Array.isArray(data)) {
        return [];
      }

      return data;

    } catch (error) {

      console.error(
        "PA-OS: ledger load error",
        error
      );

      return [];
    }
  }


  /*
   * ============================================================
   * SAVE LEDGER
   * ============================================================
   */

  function saveLedger(ledger) {

    try {

      localStorage.setItem(
        LEDGER_KEY,
        JSON.stringify(ledger)
      );

      return true;

    } catch (error) {

      console.error(
        "PA-OS: ledger save error",
        error
      );

      return false;
    }
  }


  /*
   * ============================================================
   * FORMAT MONEY
   * ============================================================
   */

  function formatMoney(value) {

    return new Intl.NumberFormat(
      "ja-JP",
      {
        style: "currency",
        currency: "JPY",
        maximumFractionDigits: 0
      }
    ).format(value);
  }


  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  function renderLedger() {

    const ledger =
      loadLedger();

    const list =
      $("holdings-list");

    const totalHoldings =
      $("total-holdings");

    const totalCost =
      $("total-cost");


    if (!list) {
      return;
    }


    /*
     * 銘柄数
     */

    if (totalHoldings) {

      totalHoldings.textContent =
        ledger.length;
    }


    /*
     * 投資元本
     */

    const cost =
      ledger.reduce(
        (sum, item) => {

          return sum +
            (
              Number(item.shares) *
              Number(item.cost)
            );

        },
        0
      );


    if (totalCost) {

      totalCost.textContent =
        formatMoney(cost);
    }


    /*
     * 空の場合
     */

    if (ledger.length === 0) {

      list.innerHTML = `
        <div class="empty">
          まだ銘柄が登録されていません。
        </div>
      `;

      return;
    }


    /*
     * 銘柄表示
     */

    list.innerHTML = "";


    ledger.forEach(
      (item, index) => {

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "holding";


        const investment =
          Number(item.shares) *
          Number(item.cost);


        card.innerHTML = `
          <div class="holding-header">

            <div>
              <div class="holding-name">
                ${escapeHTML(item.name)}
              </div>

              <div class="holding-code">
                ${escapeHTML(item.code)}
              </div>
            </div>

            <button
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
            ${formatMoney(Number(item.cost))}<br>

            投資元本：
            ${formatMoney(investment)}

          </div>
        `;


        list.appendChild(
          card
        );
      }
    );


    /*
     * 削除ボタン
     */

    list
      .querySelectorAll(
        "[data-index]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              const index =
                Number(
                  button.dataset.index
                );

              deleteHolding(
                index
              );
            }
          );
        }
      );
  }


  /*
   * ============================================================
   * HTML ESCAPE
   * ============================================================
   */

  function escapeHTML(value) {

    return String(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }


  /*
   * ============================================================
   * ADD HOLDING
   * ============================================================
   */

  function addHolding() {

    const name =
      $("stock-name").value.trim();

    const code =
      $("stock-code").value.trim();

    const shares =
      Number(
        $("stock-shares").value
      );

    const cost =
      Number(
        $("stock-cost").value
      );


    /*
     * 入力チェック
     */

    if (!name) {

      alert(
        "銘柄名を入力してください。"
      );

      return;
    }


    if (!code) {

      alert(
        "銘柄コードを入力してください。"
      );

      return;
    }


    if (!shares || shares <= 0) {

      alert(
        "保有株数を入力してください。"
      );

      return;
    }


    if (!cost || cost <= 0) {

      alert(
        "取得単価を入力してください。"
      );

      return;
    }


    /*
     * 台帳取得
     */

    const ledger =
      loadLedger();


    /*
     * 新しい銘柄
     */

    ledger.push({

      id:
        Date.now(),

      name:
        name,

      code:
        code,

      shares:
        shares,

      cost:
        cost,

      createdAt:
        new Date().toISOString()

    });


    /*
     * 保存
     */

    const saved =
      saveLedger(
        ledger
      );


    if (!saved) {

      alert(
        "台帳の保存に失敗しました。"
      );

      return;
    }


    /*
     * 表示更新
     */

    renderLedger();


    /*
     * 入力クリア
     */

    clearForm();


    /*
     * メッセージ
     */

    const status =
      $("save-status");


    if (status) {

      status.innerHTML =
        `<p class="success">
          ✓ ${escapeHTML(name)} を台帳に登録しました。
        </p>`;
    }


    /*
     * コンソール
     */

    console.log(
      "PA-OS: holding added",
      ledger
    );
  }


  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  function deleteHolding(index) {

    const ledger =
      loadLedger();


    if (
      index < 0 ||
      index >= ledger.length
    ) {
      return;
    }


    const name =
      ledger[index].name;


    const confirmed =
      confirm(
        `${name} を台帳から削除しますか？`
      );


    if (!confirmed) {
      return;
    }


    ledger.splice(
      index,
      1
    );


    saveLedger(
      ledger
    );


    renderLedger();


    const status =
      $("save-status");


    if (status) {

      status.innerHTML =
        `<p class="success">
          ✓ ${escapeHTML(name)} を削除しました。
        </p>`;
    }
  }


  /*
   * ============================================================
   * CLEAR FORM
   * ============================================================
   */

  function clearForm() {

    $("stock-name").value =
      "";

    $("stock-code").value =
      "";

    $("stock-shares").value =
      "";

    $("stock-cost").value =
      "";

    $("stock-name").focus();
  }


  /*
   * ============================================================
   * DELETE ALL
   * ============================================================
   */

  function deleteAll() {

    const ledger =
      loadLedger();


    if (ledger.length === 0) {

      alert(
        "削除する銘柄がありません。"
      );

      return;
    }


    const confirmed =
      confirm(
        "登録されている全銘柄を削除しますか？"
      );


    if (!confirmed) {
      return;
    }


    localStorage.removeItem(
      LEDGER_KEY
    );


    renderLedger();


    const status =
      $("test-status");


    if (status) {

      status.textContent =
        "全銘柄を削除しました。";
    }
  }


  /*
   * ============================================================
   * INIT
   * ============================================================
   */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      console.log(
        "PA-OS: manual ledger system started."
      );


      /*
       * 追加
       */

      const addButton =
        $("add-stock-btn");


      if (addButton) {

        addButton.addEventListener(
          "click",
          addHolding
        );
      }


      /*
       * 入力クリア
       */

      const clearButton =
        $("clear-form-btn");


      if (clearButton) {

        clearButton.addEventListener(
          "click",
          clearForm
        );
      }


      /*
       * 再読み込み
       */

      const reloadButton =
        $("reload-btn");


      if (reloadButton) {

        reloadButton.addEventListener(
          "click",
          () => {

            renderLedger();


            const status =
              $("test-status");


            if (status) {

              status.textContent =
                "✓ 台帳を再読み込みしました。";
            }
          }
        );
      }


      /*
       * 全削除
       */

      const deleteAllButton =
        $("delete-all-btn");


      if (deleteAllButton) {

        deleteAllButton.addEventListener(
          "click",
          deleteAll
        );
      }


      /*
       * 最初の表示
       */

      renderLedger();


      console.log(
        "PA-OS: ready."
      );
    }
  );

})();
