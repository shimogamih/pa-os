(() => {
  "use strict";

  const SCREENSHOT_KEY = "portfolio_image";

  const $ = (id) => document.getElementById(id);

  // ==============================
  // TEXT
  // ==============================

  function setText(id, text) {
    const el = $(id);
    if (el) {
      el.textContent = text;
    }
  }

  // ==============================
  // MODAL
  // ==============================

  function openImportModal() {
    const modal = $("import-modal");

    if (!modal) return;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeImportModal() {
    const modal = $("import-modal");

    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  // ==============================
  // IMAGE PREVIEW
  // ==============================

  function showPreview(dataURL) {
    const preview = $("preview");

    if (!preview) return;

    preview.innerHTML = "";

    const img = document.createElement("img");

    img.src = dataURL;
    img.alt = "Portfolio screenshot";

    preview.appendChild(img);
  }

  // ==============================
  // SAVE IMAGE
  // ==============================

  function saveImage(dataURL) {
    try {
      localStorage.setItem(
        SCREENSHOT_KEY,
        dataURL
      );

      return true;

    } catch (error) {
      console.error(
        "PA-OS: image save failed",
        error
      );

      return false;
    }
  }

  // ==============================
  // LOAD IMAGE
  // ==============================

  function loadImage() {
    try {
      return localStorage.getItem(
        SCREENSHOT_KEY
      );

    } catch (error) {
      console.error(
        "PA-OS: image load failed",
        error
      );

      return null;
    }
  }

  // ==============================
  // FILE → DATA URL
  // ==============================

  function readFile(file) {
    return new Promise((resolve, reject) => {

      if (!file) {
        reject(
          new Error("ファイルがありません")
        );
        return;
      }

      if (!file.type.startsWith("image/")) {
        reject(
          new Error("画像ファイルではありません")
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error("画像を読み込めませんでした")
        );
      };

      reader.readAsDataURL(file);
    });
  }

  // ==============================
  // IMAGE RESIZE
  // ==============================

  function resizeImage(
    dataURL,
    maxWidth = 2000
  ) {
    return new Promise((resolve) => {

      const img = new Image();

      img.onload = () => {

        const width =
          img.naturalWidth ||
          img.width;

        const height =
          img.naturalHeight ||
          img.height;

        if (!width || !height) {
          resolve(dataURL);
          return;
        }

        const scale =
          Math.min(
            1,
            maxWidth / width
          );

        const newWidth =
          Math.round(
            width * scale
          );

        const newHeight =
          Math.round(
            height * scale
          );

        const canvas =
          document.createElement("canvas");

        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          resolve(dataURL);
          return;
        }

        ctx.drawImage(
          img,
          0,
          0,
          newWidth,
          newHeight
        );

        try {

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.9
            )
          );

        } catch (error) {

          console.warn(
            "PA-OS: resize failed",
            error
          );

          resolve(dataURL);
        }
      };

      img.onerror = () => {
        resolve(dataURL);
      };

      img.src = dataURL;
    });
  }

  // ==============================
  // HANDLE PHOTO
  // ==============================

  async function handlePhoto(file) {

    setText(
      "import-status",
      "📥 写真を読み込んでいます..."
    );

    setText(
      "modal-status",
      "📥 写真を読み込んでいます..."
    );

    try {

      // ① 読み込み
      const original =
        await readFile(file);

      // ② サイズ調整
      const image =
        await resizeImage(
          original
        );

      // ③ 保存
      const saved =
        saveImage(image);

      // ④ 表示
      showPreview(image);

      // ⑤ 結果表示
      if (saved) {

        setText(
          "import-status",
          "✅ 写真を読み込みました。"
        );

        setText(
          "modal-status",
          "✅ 写真を保存しました。"
        );

      } else {

        setText(
          "import-status",
          "✅ 写真を読み込みました。"
        );
      }

      // ⑥ モーダルを閉じる
      closeImportModal();

      console.log(
        "PA-OS: photo imported successfully."
      );

    } catch (error) {

      console.error(
        "PA-OS: photo import failed",
        error
      );

      setText(
        "import-status",
        "❌ 写真の読み込みに失敗しました。"
      );

      setText(
        "modal-status",
        "❌ 写真の読み込みに失敗しました。"
      );
    }
  }

  // ==============================
  // LEDGER
  // ==============================

  function renderLedger() {

    const ledger =
      $("ledger-cards");

    if (!ledger) return;

    ledger.innerHTML = `
      <div class="card">
        <h3>Portfolio</h3>
        <p class="muted">
          写真を読み込むと、
          ここにポートフォリオ台帳を表示します。
        </p>
      </div>
    `;

    setText(
      "total-assets",
      "—"
    );

    setText(
      "total-profit",
      "—"
    );

    setText(
      "num-holdings",
      "0"
    );
  }

  function openLedger() {

    const screen =
      $("ledger-screen");

    if (!screen) return;

    screen.classList.add("open");

    screen.setAttribute(
      "aria-hidden",
      "false"
    );

    renderLedger();
  }

  function closeLedger() {

    const screen =
      $("ledger-screen");

    if (!screen) return;

    screen.classList.remove("open");

    screen.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  // ==============================
  // START
  // ==============================

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      const input =
        $("portfolio-input");

      const openImportButton =
        $("open-import");

      const closeModalButton =
        $("modal-close");

      const openLedgerButton =
        $("open-ledger");

      const closeLedgerButton =
        $("close-ledger");

      // ------------------------------
      // PHOTO INPUT
      // ------------------------------

      if (input) {

        input.addEventListener(
          "change",
          async (event) => {

            const file =
              event.target.files &&
              event.target.files[0];

            if (!file) return;

            await handlePhoto(file);

            // 同じ写真を再選択可能にする
            event.target.value = "";
          }
        );
      }

      // ------------------------------
      // OPEN MODAL
      // ------------------------------

      if (openImportButton) {

        openImportButton.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            openImportModal();
          }
        );
      }

      // ------------------------------
      // CLOSE MODAL
      // ------------------------------

      if (closeModalButton) {

        closeModalButton.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            closeImportModal();
          }
        );
      }

      // ------------------------------
      // LEDGER
      // ------------------------------

      if (openLedgerButton) {

        openLedgerButton.addEventListener(
          "click",
          openLedger
        );
      }

      if (closeLedgerButton) {

        closeLedgerButton.addEventListener(
          "click",
          closeLedger
        );
      }

      // ------------------------------
      // SAVED IMAGE
      // ------------------------------

      const saved =
        loadImage();

      if (saved) {

        showPreview(saved);

        setText(
          "import-status",
          "✅ 保存済みの写真を読み込みました。"
        );

      } else {

        setTimeout(
          openImportModal,
          300
        );
      }

      // ------------------------------
      // LEDGER
      // ------------------------------

      renderLedger();

      console.log(
        "PA-OS: ready."
      );
    }
  );

})();
