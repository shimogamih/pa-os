document.addEventListener("DOMContentLoaded", function () {

  const KEY = "pa_os_portfolio_ledger";

  const addButton = document.getElementById("add-stock-btn");
  const clearButton = document.getElementById("clear-form-btn");
  const reloadButton = document.getElementById("reload-btn");
  const deleteAllButton = document.getElementById("delete-all-btn");

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

  function render() {

    const data = load();

    document.getElementById("total-holdings").textContent =
      data.length;

    let total = 0;

    data.forEach(item => {
      total += Number(item.shares) * Number(item.cost);
    });

    document.getElementById("total-cost").textContent =
      "¥" + total.toLocaleString("ja-JP");

    const list = document.getElementById("holdings-list");

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
          ¥${Number(item.cost).toLocaleString("ja-JP")}<br>

          投資元本：
          ¥${(
            Number(item.shares) *
            Number(item.cost)
          ).toLocaleString("ja-JP")}
        </div>

      </div>
    `).join("");
  }


  // 銘柄追加
  addButton.addEventListener("click", function () {

    const name =
      document.getElementById("stock-name").value.trim();

    const code =
      document.getElementById("stock-code").value.trim();

    const shares =
      document.getElementById("stock-shares").value;

    const cost =
      document.getElementById("stock-cost").value;

    if (!name || !code || !shares || !cost) {
      alert("4項目すべて入力してください");
      return;
    }

    const data = load();

    data.push({
      name: name,
      code: code,
      shares: Number(shares),
      cost: Number(cost)
    });

    try {
      save(data);

      // 保存確認
      const check = load();

      if (check.length !== data.length) {
        alert("保存確認に失敗しました");
        return;
      }

      document.getElementById("save-status").innerHTML =
        '<p class="success">✓ ' +
        name +
        ' を保存しました</p>';

      document.getElementById("stock-name").value = "";
      document.getElementById("stock-code").value = "";
      document.getElementById("stock-shares").value = "";
      document.getElementById("stock-cost").value = "";

      render();

    } catch (error) {

      alert("保存できませんでした");

      console.error(error);
    }

  });


  // 入力クリア
  clearButton.addEventListener("click", function () {

    document.getElementById("stock-name").value = "";
    document.getElementById("stock-code").value = "";
    document.getElementById("stock-shares").value = "";
    document.getElementById("stock-cost").value = "";

  });


  // 再読み込み
  reloadButton.addEventListener("click", function () {
    render();
  });


  // 全削除
  deleteAllButton.addEventListener("click", function () {

    if (!confirm("全銘柄を削除しますか？")) {
      return;
    }

    localStorage.removeItem(KEY);

    render();

    document.getElementById("test-status").textContent =
      "台帳を削除しました";
  });


  // 個別削除
  window.deleteStock = function (index) {

    const data = load();

    data.splice(index, 1);

    save(data);

    render();
  };


  // 起動時表示
  render();

});
