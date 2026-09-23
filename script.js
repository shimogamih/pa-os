(() => {
  "use strict";

  /*
   * ============================================================
   * PA-OS
   * Portfolio Screenshot / Preview / OCR
   * ============================================================
   */

  const SCREENSHOT_KEY = "portfolio_image";

  const $ = (id) => document.getElementById(id);


  /*
   * ============================================================
   * TEXT
   * ============================================================
   */

  function setText(id, text) {
    const el = $(id);

    if (el) {
      el.textContent = text;
    }
  }


  /*
   * ============================================================
   * IMPORT MODAL
   * ============================================================
   */

  function openImportModal() {
    const modal = $("import-modal");

    if (!modal) {
      return;
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }


  function closeImportModal() {
    const modal = $("import-modal");

    if (!modal) {
      return;
    }

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }


  /*
   * ============================================================
   * PREVIEW
   * ============================================================
   */

  function showPreview(dataURL) {
    const preview = $("preview");

    if (!preview) {
      return;
    }

    preview.innerHTML = "";

    const img = document.createElement("img");

    img.src = dataURL;
    img.alt = "Portfolio screenshot";

    img.style.display = "block";
    img.style.width = "100%";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "12px";
    img.style.marginTop = "12px";

    preview.appendChild(img);
  }


  /*
   * ============================================================
   * LOCAL STORAGE
   * ============================================================
   */

  function saveImage(dataURL) {
    try {

      localStorage.setItem(
        SCREENSHOT_KEY,
        dataURL
      );

      return true;

    } catch (error) {

      console.error(
        "PA-OS: localStorage save failed",
        error
      );

      return false;
    }
  }


  function loadImage() {
    try {

      return localStorage.getItem(
        SCREENSHOT_KEY
      );

    } catch (error) {

      console.error(
        "PA-OS: localStorage read failed",
        error
      );

      return null;
    }
  }


  /*
   * ============================================================
   * FILE READER
   * ============================================================
   */

  function readFile(file) {

    return new Promise((resolve, reject) => {

      if (!file) {

        reject(
          new Error(
            "ファイルがありません。"
          )
        );

        return;
      }


      if (
        !file.type ||
        !file.type.startsWith("image/")
      ) {

        reject(
          new Error(
            "画像ファイルではありません。"
          )
        );

        return;
      }


      const reader =
        new FileReader();


      reader.onload = () => {

        if (
          typeof reader.result !== "string"
        ) {

          reject(
            new Error(
              "画像データを取得できませんでした。"
            )
          );

          return;
        }

        resolve(
          reader.result
        );
      };


      reader.onerror = () => {

        reject(
          reader.error ||
          new Error(
            "画像を読み込めませんでした。"
          )
        );
      };


      reader.readAsDataURL(file);

    });
  }


  /*
   * ============================================================
   * IMAGE RESIZE
   * ============================================================
   */

  function resizeImage(
    dataURL,
    maxWidth = 2000
  ) {

    return new Promise((resolve) => {

      const img =
        new Image();


      img.onload = () => {

        try {

          const width =
            img.naturalWidth ||
            img.width;

          const height =
            img.naturalHeight ||
            img.height;


          if (!width || !height) {

            resolve(
              dataURL
            );

            return;
          }


          const scale =
            Math.min(
              1,
              maxWidth / width
            );


          const newWidth =
            Math.max(
              1,
              Math.round(
                width * scale
              )
            );


          const newHeight =
            Math.max(
              1,
              Math.round(
                height * scale
              )
            );


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            newWidth;

          canvas.height =
            newHeight;


          const ctx =
            canvas.getContext(
              "2d"
            );


          if (!ctx) {

            resolve(
              dataURL
            );

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
                0.92
              )
            );

          } catch (error) {

            console.warn(
              "PA-OS: resize failed",
              error
            );

            resolve(
              dataURL
            );
          }

        } catch (error) {

          console.warn(
            "PA-OS: image processing failed",
            error
          );

          resolve(
            dataURL
          );
        }
      };


      img.onerror = () => {

        resolve(
          dataURL
        );
      };


      img.src =
        dataURL;

    });
  }


  /*
   * ============================================================
   * HANDLE PHOTO
   * ============================================================
   */

  async function handlePhoto(file) {

    if (!file) {
      return;
    }


    setText(
      "import-status",
      "📥 写真を読み込んでいます..."
    );


    setText(
      "modal-status",
      "📥 写真を読み込んでいます..."
    );


    try {

      /*
       * ① 元画像を読み込む
       */

      const original =
        await readFile(
          file
        );


      /*
       * ② 保存用にサイズ調整
       */

      const image =
        await resizeImage(
          original,
          2000
        );


      /*
       * ③ 保存
       */

      const saved =
        saveImage(
          image
        );


      /*
       * ④ プレビュー
       */

      showPreview(
        image
      );


      /*
       * ⑤ ステータス
       */

      if (saved) {

        setText(
          "import-status",
          "✅ 写真を読み込み、保存しました。"
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

        setText(
          "modal-status",
          "写真を読み込みました。"
        );
      }


      /*
       * ⑥ モーダルを閉じる
       */

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


  /*
   * ============================================================
   * OCR IMAGE PREPARATION
   *
   * ポートフォリオ画面は
   * 「暗い背景＋白文字」の場合があるため、
   * OCR専用画像を作る。
   * ============================================================
   */

  function prepareOCRImage(
    dataURL
  ) {

    return new Promise((resolve) => {

      const img =
        new Image();


      img.onload = () => {

        try {

          /*
           * 2倍拡大
           */

          const scale =
            2;


          const width =
            Math.max(
              1,
              Math.round(
                img.naturalWidth * scale
              )
            );


          const height =
            Math.max(
              1,
              Math.round(
                img.naturalHeight * scale
              )
            );


          const canvas =
            document.createElement(
              "canvas"
            );


          canvas.width =
            width;

          canvas.height =
            height;


          const ctx =
            canvas.getContext(
              "2d"
            );


          if (!ctx) {

            resolve(
              dataURL
            );

            return;
          }


          /*
           * 高品質拡大
           */

          ctx.imageSmoothingEnabled =
            true;

          ctx.imageSmoothingQuality =
            "high";


          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );


          /*
           * 画像データ
           */

          const imageData =
            ctx.getImageData(
              0,
              0,
              width,
              height
            );


          const data =
            imageData.data;


          /*
           * 平均明るさを調べる
           */

          let brightnessTotal =
            0;

          const pixelCount =
            data.length / 4;


          for (
            let i = 0;
            i < data.length;
            i += 4
          ) {

            const r =
              data[i];

            const g =
              data[i + 1];

            const b =
              data[i + 2];


            const gray =
              (
                0.299 * r +
                0.587 * g +
                0.114 * b
              );


            brightnessTotal +=
              gray;
          }


          const averageBrightness =
            brightnessTotal /
            pixelCount;


          /*
           * 暗い画像なら反転する。
           *
           * 白文字＋黒背景
           * ↓
           * 黒文字＋白背景
           *
           * Tesseractが読みやすくなる。
           */

          const shouldInvert =
            averageBrightness < 128;


          /*
           * コントラスト調整
           */

          for (
            let i = 0;
            i < data.length;
            i += 4
          ) {

            const r =
              data[i];

            const g =
              data[i + 1];

            const b =
              data[i + 2];


            let gray =
              (
                0.299 * r +
                0.587 * g +
                0.114 * b
              );


            /*
             * コントラスト
             */

            gray =
              (
                (gray - 128) *
                1.45
              ) + 128;


            gray =
              Math.max(
                0,
                Math.min(
                  255,
                  gray
                )
              );


            /*
             * 暗い画面なら反転
             */

            if (shouldInvert) {

              gray =
                255 - gray;
            }


            data[i] =
              gray;

            data[i + 1] =
              gray;

            data[i + 2] =
              gray;
          }


          ctx.putImageData(
            imageData,
            0,
            0
          );


          resolve(
            canvas.toDataURL(
              "image/png"
            )
          );


        } catch (error) {

          console.warn(
            "PA-OS: OCR image preparation failed",
            error
          );

          resolve(
            dataURL
          );
        }
      };


      img.onerror = () => {

        resolve(
          dataURL
        );
      };


      img.src =
        dataURL;
    });
  }


  /*
   * ============================================================
   * OCR
   * ============================================================
   */

  async function runOCR() {

    const button =
      $("ocr-btn");


    const status =
      $("ocr-status");


    const result =
      $("ocr-result");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "OCR解析中...";
    }


    setText(
      "ocr-status",
      "OCR: 準備しています..."
    );


    try {

      /*
       * 保存画像を取得
       */

      let image =
        loadImage();


      /*
       * 保存画像がなければ
       * プレビュー画像を使う
       */

      if (!image) {

        const preview =
          $("preview");


        const img =
          preview &&
          preview.querySelector(
            "img"
          );


        if (
          img &&
          img.src
        ) {

          image =
            img.src;
        }
      }


      /*
       * 写真がない
       */

      if (!image) {

        throw new Error(
          "ポートフォリオ写真がありません。"
        );
      }


      /*
       * Tesseract確認
       */

      if (
        !window.Tesseract ||
        typeof window.Tesseract.recognize !==
          "function"
      ) {

        throw new Error(
          "Tesseract.jsを読み込めませんでした。"
        );
      }


      /*
       * OCR用画像作成
       */

      setText(
        "ocr-status",
        "OCR: 画像を補正しています..."
      );


      const processedImage =
        await prepareOCRImage(
          image
        );


      /*
       * OCR開始
       */

      setText(
        "ocr-status",
        "OCR: 日本語・数字を認識しています..."
      );


      /*
       * 日本語＋英数字
       */

      const response =
        await Tesseract.recognize(
          processedImage,
          "jpn+eng",
          {

            logger: (message) => {

              if (
                !message ||
                typeof message.progress !==
                  "number"
              ) {

                return;
              }


              const percent =
                Math.round(
                  message.progress * 100
                );


              let state =
                message.status ||
                "processing";


              /*
               * 表示を日本語化
               */

              if (
                state ===
                "loading tesseract core"
              ) {

                state =
                  "OCRエンジン読み込み";

              } else if (
                state ===
                "initializing tesseract"
              ) {

                state =
                  "OCR初期化";

              } else if (
                state ===
                "loading language traineddata"
              ) {

                state =
                  "日本語・英語データ読み込み";

              } else if (
                state ===
                "recognizing text"
              ) {

                state =
                  "文字認識";
              }


              if (status) {

                status.textContent =
                  `OCR: ${state} — ${percent}%`;
              }
            },


            /*
             * 画面全体を文章として認識
             */

            tessedit_pageseg_mode:
              "6",


            /*
             * 空白を保持
             */

            preserve_interword_spaces:
              "1"
          }
        );


      /*
       * OCRテキスト取得
       */

      const text =
        response &&
        response.data &&
        typeof response.data.text ===
          "string"
          ? response.data.text.trim()
          : "";


      /*
       * 結果表示
       */

      if (result) {

        result.textContent =
          text ||
          "文字を認識できませんでした。";
      }


      setText(
        "ocr-status",
        "OCR: 完了"
      );


      console.log(
        "PA-OS OCR result:",
        text
      );


    } catch (error) {

      console.error(
        "PA-OS: OCR failed",
        error
      );


      setText(
        "ocr-status",
        "OCR: エラーが発生しました。"
      );


      if (result) {

        result.textContent =
          error.message ||
          "OCRに失敗しました。";
      }


    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Run OCR";
      }
    }
  }


  /*
   * ============================================================
   * LEDGER
   * ============================================================
   */

  function renderLedger() {

    const ledger =
      $("ledger-cards");


    if (!ledger) {
      return;
    }


    ledger.innerHTML = `
      <div class="card">
        <h3>Portfolio</h3>
        <p class="muted">
          ポートフォリオ写真を読み込むと、
          ここに台帳データを表示します。
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


    if (!screen) {
      return;
    }


    screen.classList.add(
      "open"
    );


    screen.setAttribute(
      "aria-hidden",
      "false"
    );


    renderLedger();
  }


  function closeLedger() {

    const screen =
      $("ledger-screen");


    if (!screen) {
      return;
    }


    screen.classList.remove(
      "open"
    );


    screen.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  /*
   * ============================================================
   * INITIALIZE
   * ============================================================
   */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      console.log(
        "PA-OS: initialization started."
      );


      /*
       * Elements
       */

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


      const ocrButton =
        $("ocr-btn");


      /*
       * ========================================================
       * PHOTO INPUT
       * ========================================================
       */

      if (!input) {

        console.error(
          "PA-OS: #portfolio-input not found."
        );

      } else {

        input.addEventListener(
          "change",
          async (event) => {

            console.log(
              "PA-OS: photo selected."
            );


            const file =
              event.target.files &&
              event.target.files[0];


            if (!file) {
              return;
            }


            await handlePhoto(
              file
            );


            /*
             * 同じ写真をもう一度選択可能にする
             */

            try {

              event.target.value =
                "";

            } catch (error) {

              console.warn(
                "PA-OS: input reset failed",
                error
              );
            }
          }
        );
      }


      /*
       * ========================================================
       * IMPORT MODAL
       * ========================================================
       */

      if (openImportButton) {

        openImportButton.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            openImportModal();
          }
        );
      }


      if (closeModalButton) {

        closeModalButton.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            closeImportModal();
          }
        );
      }


      /*
       * ========================================================
       * LEDGER
       * ========================================================
       */

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


      /*
       * ========================================================
       * OCR BUTTON
       * ========================================================
       */

      if (ocrButton) {

        ocrButton.addEventListener(
          "click",
          runOCR
        );


        console.log(
          "PA-OS: OCR button ready."
        );
      }


      /*
       * ========================================================
       * SAVED IMAGE
       * ========================================================
       */

      const saved =
        loadImage();


      if (saved) {

        showPreview(
          saved
        );


        setText(
          "import-status",
          "✅ 保存済みの写真を読み込みました。"
        );

      } else {

        /*
         * 初回だけ取込画面を表示
         */

        setTimeout(
          openImportModal,
          300
        );
      }


      /*
       * ========================================================
       * LEDGER
       * ========================================================
       */

      renderLedger();


      console.log(
        "PA-OS: initialization complete."
      );
    }
  );

})();
