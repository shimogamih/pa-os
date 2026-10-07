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
      console.error(error);
      return [];
    }
  }

  function saveLedger(data) {
    localStorage.setItem(
      LEDGER_KEY,
      JSON.stringify(data)
    );
  }

  function money(value) {
    return "¥" + Number(value).toLocaleString("ja-JP");
  }

  function render() {

    const ledger = loadLedger();
    const list = $("holdings-list");

    $("total-holdings").textContent =
      ledger.length;

    let total = 0;

    ledger.forEach(item => {
      total +=
        Number(item.shares) *
        Number(item.cost);
    });

    $("total-cost").textContent =
      money(total);

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


  function addStock() {

    console.log(
      "PA-OS: 銘柄追加ボタンが押されました"
    );

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

      name: name,

      code: code,

      shares: shares,

      cost: cost,

      createdAt:
        new Date().toISOString()

    });


    saveLedger(ledger);


    $("stock-name").value = "";
    $("stock-code").value = "";
    $("stock-shares").value = "";
    $("stock-cost").value = "";


    $("save-status").innerHTML = `
      <p class="success">
        ✓ ${name} を登録しました。
      </p>
    `;


    render();


    console.log(
      "PA-OS: 登録完了",
      ledger
    );
  }


  document.addEventListener(
    "DOMContentLoaded",
    () => {

      console.log(
        "PA-OS: JavaScript起動"
      );


      const button =
        $("add-stock-btn");


      if (!button) {

        console.error(
          "PA-OS ERROR: add-stock-btn が見つかりません"
        );

        return;
      }


      button.addEventListener(
        "click",
        addStock
      );


      const clearButton =
        $("clear-form-btn");


      if (clearButton) {

        clearButton.addEventListener(
          "click",
          () => {

            $("stock-name").value = "";
            $("stock-code").value = "";
            $("stock-shares").value = "";
            $("stock-cost").value = "";
          }
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
          () => {

            if (
              confirm(
                "全銘柄を削除しますか？"
              )
            ) {

              localStorage.removeItem(
                LEDGER_KEY
              );

              render();
            }
          }
        );
      }


      render();
    }
  );

})();
