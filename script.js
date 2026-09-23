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
      console.error("PA-OS: #preview not found");
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
          new Error("No file selected.")
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
              "Invalid image data."
            )
          );

          return;
        }

        resolve(reader.result);
      };


      reader.onerror = () => {

        reject(
          reader.error ||
          new Error(
            "Could not read image."
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

      const img = new Image();


      img.onload = () => {

        try {

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
            Math.max(
              1,
              Math.round(width * scale)
            );


          const newHeight =
            Math.max(
              1,
              Math.round(height * scale)
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

        } catch (error) {

          console.warn(
            "PA-OS: image processing failed",
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
      "画像を読み込んでいます..."
    );

    setText(
      "modal-status",
      "画像を読み込んでいます..."
    );


    try {

      /*
       * Read original
       */

      const original =
        await readFile(file);


      /*
       * Resize
       */

      const image =
        await resizeImage(
          original
        );


      /*
       * Save
       */

      const saved =
        saveImage(image);


      /*
       * Preview
       */

      showPreview(image);


      /*
       * Status
       */

      if (saved) {

        setText(
          "import-status",
          "画像を保存しました。OCRを実行できます。"
        );

        setText(
          "modal-status",
          "画像を保存しました。"
        );

      } else {

        setText(
          "import-status",
          "画像を読み込みました。"
        );

        setText(
          "modal-status",
          "画像を読み込みました。"
        );
      }


      /*
       * Close modal
       */

      closeImportModal();


    } catch (error) {

      console.error(
        "PA-OS: image import failed",
        error
      );


      setText(
        "import-status",
        "画像の読み込みに失敗しました。"
      );


      setText(
        "modal-status",
        "画像の読み込みに失敗しました。"
      );
    }
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
        "OCR実行中...";
    }


    if (status) {

      status.textContent =
        "OCR: 準備中...";
    }


    /*
     * Get saved image
     */

    let image =
      loadImage();


    /*
     * Fallback to preview
     */

    if (!image) {

      const preview =
        $("preview");

      const img =
        preview &&
        preview.querySelector("img");


      if (img && img.src) {

        image =
          img.src;
      }
    }


    /*
     * No image
     */

    if (!image) {

      setText(
        "ocr-status",
        "OCR: 写真がありません。先に写真を選択してください。"
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Run OCR";
      }


      return;
    }


    /*
     * Check Tesseract
     */

    if (
      !window.Tesseract ||
      typeof window.Tesseract.recognize !== "function"
    ) {

      setText(
        "ocr-status",
        "OCR: Tesseract.jsを読み込めませんでした。"
      );


      console.error(
        "PA-OS: Tesseract.js unavailable."
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Run OCR";
      }


      return;
    }


    try {

      /*
       * Start
       */

      setText(
        "ocr-status",
        "OCR: 日本語データを読み込んでいます..."
      );


      const response =
        await Tesseract.recognize(
          image,
          "jpn",
          {

            logger: (message) => {

              if (!status) {
                return;
              }


              if (
                message &&
                typeof message.progress === "number"
              ) {

                const percent =
                  Math.round(
                    message.progress * 100
                  );


                let state =
                  message.status ||
                  "processing";


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
                    "初期化";

                } else if (
                  state ===
                  "loading language traineddata"
                ) {

                  state =
                    "日本語データ読み込み";

                } else if (
                  state ===
                  "recognizing text"
                ) {

                  state =
                    "文字認識";
                }


                status.textContent =
                  `OCR: ${state} — ${percent}%`;
              }
            }
          }
        );


      /*
       * Result
       */

      const text =
        response &&
        response.data &&
        typeof response.data.text === "string"
          ? response.data.text.trim()
          : "";


      /*
       * Complete
       */

      setText(
        "ocr-status",
        "OCR: 完了"
      );


      if (result) {

        result.textContent =
          text ||
          "文字を認識できませんでした。";
      }


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
          "";
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
       * --------------------------------------------------------
       * Elements
       * --------------------------------------------------------
       */

      const input =
        $("portfolio-input");


      const chooseButton =
        $("choose-photo-btn");


      const modalSelectButton =
        $("modal-select-photo");


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
       * --------------------------------------------------------
       * File input
       *
       * IMPORTANT:
       * We DO NOT use input.click().
       *
       * The HTML label opens the iPhone photo picker.
       * --------------------------------------------------------
       */

      if (!input) {

        console.error(
          "PA-OS ERROR: #portfolio-input not found."
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
             * Allow same photo to be selected again.
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
       * --------------------------------------------------------
       * Choose button
       *
       * The HTML <label> already opens the input.
       *
       * DO NOT call input.click() here.
       * --------------------------------------------------------
       */

      if (chooseButton) {

        console.log(
          "PA-OS: Choose button ready."
        );
      }


      /*
       * --------------------------------------------------------
       * Modal select button
       *
       * Also a label.
       * No JavaScript click handler needed.
       * --------------------------------------------------------
       */

      if (modalSelectButton) {

        console.log(
          "PA-OS: Modal photo selector ready."
        );
      }


      /*
       * --------------------------------------------------------
       * Import modal
       * --------------------------------------------------------
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


      /*
       * --------------------------------------------------------
       * Close modal
       * --------------------------------------------------------
       */

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
       * --------------------------------------------------------
       * Ledger
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * OCR
       * --------------------------------------------------------
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
       * --------------------------------------------------------
       * Load saved image
       * --------------------------------------------------------
       */

      const saved =
        loadImage();


      if (saved) {

        showPreview(
          saved
        );


        setText(
          "import-status",
          "保存済みの写真を読み込みました。"
        );
      }


      /*
       * --------------------------------------------------------
       * Ledger
       * --------------------------------------------------------
       */

      renderLedger();


      /*
       * --------------------------------------------------------
       * Initial modal
       *
       * Only show when there is no saved image.
       * --------------------------------------------------------
       */

      if (!saved) {

        setTimeout(
          openImportModal,
          200
        );
      }


      console.log(
        "PA-OS: initialization complete."
      );
    }
  );

})();
