(() => {
  "use strict";

  /*
   * ============================================================
   * PA-OS
   * Portfolio Screenshot / Preview / Local Storage / OCR
   * ============================================================
   */

  const SCREENSHOT_KEY = "portfolio_image";

  const PREVIOUS_SCREENSHOT_KEY = "paos_screenshot_v1";


  /*
   * ------------------------------------------------------------
   * Utility
   * ------------------------------------------------------------
   */

  function $(id) {
    return document.getElementById(id);
  }


  function setText(id, text) {
    const element = $(id);

    if (element) {
      element.textContent = text;
    }
  }


  /*
   * ------------------------------------------------------------
   * Preview
   * ------------------------------------------------------------
   */

  function showPreviewFromDataURL(dataURL) {

    const preview = $("preview");

    if (!preview) {
      console.warn("PA-OS: #preview not found");
      return;
    }

    preview.innerHTML = "";

    const image = document.createElement("img");

    image.src = dataURL;

    image.alt = "Portfolio screenshot preview";

    image.style.maxWidth = "100%";
    image.style.width = "100%";
    image.style.height = "auto";
    image.style.display = "block";
    image.style.borderRadius = "12px";

    preview.appendChild(image);
  }


  /*
   * ------------------------------------------------------------
   * Local Storage
   * ------------------------------------------------------------
   */

  function savePortfolioImage(dataURL) {

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


  function loadSavedPortfolioImage() {

    try {

      let dataURL =
        localStorage.getItem(SCREENSHOT_KEY);

      /*
       * Backward compatibility.
       *
       * If an older version saved the screenshot
       * under paos_screenshot_v1, migrate it.
       */

      if (!dataURL) {

        dataURL =
          localStorage.getItem(
            PREVIOUS_SCREENSHOT_KEY
          );

        if (dataURL) {

          try {

            localStorage.setItem(
              SCREENSHOT_KEY,
              dataURL
            );

          } catch (error) {

            console.warn(
              "PA-OS: old screenshot migration failed",
              error
            );
          }
        }
      }

      return dataURL || null;

    } catch (error) {

      console.error(
        "PA-OS: localStorage read failed",
        error
      );

      return null;
    }
  }


  /*
   * ------------------------------------------------------------
   * File -> Data URL
   * ------------------------------------------------------------
   */

  function readFileAsDataURL(file) {

    return new Promise((resolve, reject) => {

      if (!file) {

        reject(
          new Error("No file selected.")
        );

        return;
      }


      const reader = new FileReader();


      reader.onload = () => {

        if (
          typeof reader.result !== "string"
        ) {

          reject(
            new Error(
              "FileReader returned invalid data."
            )
          );

          return;
        }

        resolve(reader.result);
      };


      reader.onerror = () => {

        reject(
          reader.error ||
          new Error("FileReader failed.")
        );
      };


      reader.readAsDataURL(file);

    });
  }


  /*
   * ------------------------------------------------------------
   * Optional image compression
   *
   * If canvas processing fails,
   * the original data URL is used.
   * ------------------------------------------------------------
   */

  function resizeImageDataURL(
    dataURL,
    maxWidth = 2000
  ) {

    return new Promise((resolve) => {

      const image = new Image();


      image.onload = () => {

        try {

          const originalWidth =
            image.naturalWidth ||
            image.width;

          const originalHeight =
            image.naturalHeight ||
            image.height;


          if (
            !originalWidth ||
            !originalHeight
          ) {

            resolve(dataURL);

            return;
          }


          /*
           * Don't enlarge images.
           */

          const scale =
            Math.min(
              1,
              maxWidth / originalWidth
            );


          const width =
            Math.max(
              1,
              Math.round(
                originalWidth * scale
              )
            );


          const height =
            Math.max(
              1,
              Math.round(
                originalHeight * scale
              )
            );


          const canvas =
            document.createElement("canvas");


          canvas.width = width;
          canvas.height = height;


          const context =
            canvas.getContext("2d");


          if (!context) {

            resolve(dataURL);

            return;
          }


          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );


          let result;

          try {

            result =
              canvas.toDataURL(
                "image/jpeg",
                0.9
              );

          } catch (error) {

            console.warn(
              "PA-OS: canvas conversion failed",
              error
            );

            resolve(dataURL);

            return;
          }


          resolve(result || dataURL);

        } catch (error) {

          console.warn(
            "PA-OS: image processing failed",
            error
          );

          resolve(dataURL);
        }
      };


      image.onerror = () => {

        /*
         * Do NOT fail the import.
         * Use the original FileReader result.
         */

        resolve(dataURL);
      };


      image.src = dataURL;

    });
  }


  /*
   * ------------------------------------------------------------
   * Main file handler
   * ------------------------------------------------------------
   */

  async function handleFileInput(file) {

    if (!file) {
      return;
    }


    setText(
      "import-status",
      "Reading image..."
    );


    setText(
      "modal-status",
      "Reading image..."
    );


    try {

      /*
       * STEP 1
       * FileReader
       */

      const originalDataURL =
        await readFileAsDataURL(file);


      /*
       * STEP 2
       * Resize if possible.
       * Original remains fallback.
       */

      const finalDataURL =
        await resizeImageDataURL(
          originalDataURL
        );


      /*
       * STEP 3
       * Save
       */

      const saved =
        savePortfolioImage(
          finalDataURL
        );


      if (!saved) {

        /*
         * Even if localStorage is full,
         * still show the preview.
         */

        showPreviewFromDataURL(
          finalDataURL
        );

        setText(
          "import-status",
          "Image loaded. Local save failed."
        );

        setText(
          "modal-status",
          "Image loaded."
        );

        return;
      }


      /*
       * STEP 4
       * Preview
       */

      showPreviewFromDataURL(
        finalDataURL
      );


      /*
       * STEP 5
       * Status
       */

      setText(
        "import-status",
        "Image saved. Ready for OCR."
      );


      setText(
        "modal-status",
        "Image saved. Ready for OCR."
      );


      /*
       * STEP 6
       * Close modal automatically.
       */

      closeImportModal();

    } catch (error) {

      console.error(
        "PA-OS: portfolio image import failed",
        error
      );


      setText(
        "import-status",
        "Failed to read image."
      );


      setText(
        "modal-status",
        "Failed to read image."
      );

    }
  }


  /*
   * ------------------------------------------------------------
   * Import modal
   * ------------------------------------------------------------
   */

  function openImportModal() {

    const modal =
      $("import-modal");

    if (!modal) {
      return;
    }


    modal.setAttribute(
      "aria-hidden",
      "false"
    );


    modal.classList.add("open");
  }


  function closeImportModal() {

    const modal =
      $("import-modal");

    if (!modal) {
      return;
    }


    modal.setAttribute(
      "aria-hidden",
      "true"
    );


    modal.classList.remove("open");
  }


  /*
   * ------------------------------------------------------------
   * Ledger
   * ------------------------------------------------------------
   */

  function renderLedger() {

    const ledger =
      $("ledger-cards");

    if (!ledger) {
      return;
    }


    /*
     * Keep the existing empty-state behavior.
     * OCR/portfolio parsing can populate this later.
     */

    ledger.innerHTML = `
      <div class="card">
        <h3>Portfolio</h3>
        <p class="muted">
          Import a portfolio screenshot to populate the ledger.
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


    screen.setAttribute(
      "aria-hidden",
      "false"
    );


    screen.classList.add("open");


    renderLedger();
  }


  function closeLedger() {

    const screen =
      $("ledger-screen");

    if (!screen) {
      return;
    }


    screen.setAttribute(
      "aria-hidden",
      "true"
    );


    screen.classList.remove("open");
  }


  /*
   * ------------------------------------------------------------
   * OCR using Tesseract.js
   * ------------------------------------------------------------
   */

  async function runOCR() {

    const status = $("ocr-status");

    if (status) {
      status.textContent = "OCR: initializing...";
    }

    // Determine the image source: prefer saved image, fall back to preview img
    let imageSrc = loadSavedPortfolioImage();

    if (!imageSrc) {
      const preview = $("preview");
      const img = preview && preview.querySelector && preview.querySelector("img");
      if (img && img.src) {
        imageSrc = img.src;
      }
    }

    if (!imageSrc) {
      setText("ocr-status", "OCR: no image available. Please upload a screenshot first.");
      return;
    }

    if (!window.Tesseract || typeof window.Tesseract.recognize !== "function") {
      setText("ocr-status", "OCR: Tesseract.js not loaded or unsupported version.");
      return;
    }

    // Create or reuse OCR result container (added dynamically so index.html is unchanged)
    let resultEl = $("ocr-result");

    if (!resultEl) {
      resultEl = document.createElement("pre");
      resultEl.id = "ocr-result";
      resultEl.className = "ocr-result muted";
      resultEl.style.whiteSpace = "pre-wrap";
      resultEl.style.maxHeight = "240px";
      resultEl.style.overflow = "auto";
      resultEl.style.marginTop = "8px";

      const statusParent = status && status.parentNode;
      if (statusParent) {
        statusParent.appendChild(resultEl);
      } else {
        const preview = $("preview");
        if (preview) preview.appendChild(resultEl);
      }
    }

    resultEl.textContent = "";

    try {
      // Use Tesseract.recognize with logger to report progress
      const res = await Tesseract.recognize(
        imageSrc,
        "eng",
        {
          logger: (m) => {
            // m: { status, progress }
            try {
              if (!status) return;

              if (m && typeof m.progress === "number") {
                const percent = Math.round(m.progress * 100);
                status.textContent = `OCR: ${m.status || "progress"} — ${percent}%`;
              } else if (m && m.status) {
                status.textContent = `OCR: ${m.status}`;
              }
            } catch (e) {
              // ignore logger errors
            }
          }
        }
      );

      const text = (res && res.data && res.data.text) ? res.data.text : "";

      setText("ocr-status", "OCR: complete");

      resultEl.textContent = text || "(no text recognized)";

    } catch (error) {
      console.error("PA-OS: OCR failed", error);
      setText("ocr-status", "OCR: failed. See console for details.");
      resultEl.textContent = "";
    }
  }


  /*
   * ------------------------------------------------------------
   * Initialize
   * ------------------------------------------------------------
   */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      console.log(
        "PA-OS: initializing..."
      );


      /*
       * --------------------------------------------------------
       * Get DOM elements
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
       * IMPORTANT:
       * File input must exist.
       * --------------------------------------------------------
       */

      if (!input) {

        console.error(
          "PA-OS ERROR: #portfolio-input was not found."
        );

      } else {

        console.log(
          "PA-OS: #portfolio-input found."
        );


        /*
         * ------------------------------------------------------
         * SINGLE CHANGE HANDLER
         * ------------------------------------------------------
         */

        input.addEventListener(
          "change",
          async (event) => {

            console.log(
              "PA-OS: portfolio-input change fired."
            );


            const file =
              event.target.files &&
              event.target.files[0];


            if (!file) {

              console.log(
                "PA-OS: no file selected."
              );

              return;
            }


            console.log(
              "PA-OS: selected file:",
              file.name,
              file.type,
              file.size
            );


            await handleFileInput(file);


            /*
             * Clear the input.
             *
             * This allows the user to select
             * the exact same image again.
             */

            try {

              event.target.value = "";

            } catch (error) {

              console.warn(
                "PA-OS: unable to clear file input.",
                error
              );
            }

          },
          false
        );
      }


      /*
       * --------------------------------------------------------
       * MAIN "Choose or Take Photo" BUTTON
       * --------------------------------------------------------
       */

      if (chooseButton) {

        chooseButton.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            console.log(
              "PA-OS: Choose or Take Photo clicked."
            );


            if (!input) {

              console.error(
                "PA-OS: cannot open picker because #portfolio-input is missing."
              );

              return;
            }


            /*
             * This call happens directly inside
             * the user click event.
             *
             * This is important for iPhone Safari.
             */

            input.click();

          },
          false
        );

      } else {

        console.error(
          "PA-OS ERROR: #choose-photo-btn was not found."
        );
      }


      /*
       * --------------------------------------------------------
       * MODAL "Select Screenshot"
       * --------------------------------------------------------
       */

      if (modalSelectButton) {

        modalSelectButton.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            console.log(
              "PA-OS: modal Select Screenshot clicked."
            );


            if (!input) {

              console.error(
                "PA-OS: #portfolio-input missing."
              );

              return;
            }


            input.click();

          },
          false
        );
      }


      /*
       * --------------------------------------------------------
       * IMPORT MODAL OPEN
       * --------------------------------------------------------
       */

      if (openImportButton) {

        openImportButton.addEventListener(
          "click",
          () => {

            openImportModal();

          }
        );
      }


      /*
       * --------------------------------------------------------
       * IMPORT MODAL CLOSE
       * --------------------------------------------------------
       */

      if (closeModalButton) {

        closeModalButton.addEventListener(
          "click",
          () => {

            closeImportModal();

          }
        );
      }


      /*
       * --------------------------------------------------------
       * LEDGER OPEN
       * --------------------------------------------------------
       */

      if (openLedgerButton) {

        openLedgerButton.addEventListener(
          "click",
          () => {

            openLedger();

          }
        );
      }


      /*
       * --------------------------------------------------------
       * LEDGER CLOSE
       * --------------------------------------------------------
       */

      if (closeLedgerButton) {

        closeLedgerButton.addEventListener(
          "click",
          () => {

            closeLedger();

          }
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
          () => {

            runOCR();

          }
        );
      }


      /*
       * --------------------------------------------------------
       * Load previously saved screenshot
       * --------------------------------------------------------
       */

      const savedImage =
        loadSavedPortfolioImage();


      if (savedImage) {

        console.log(
          "PA-OS: saved portfolio image found."
        );


        showPreviewFromDataURL(
          savedImage
        );


        setText(
          "import-status",
          "Saved image loaded. Ready for OCR."
        );

      } else {

        console.log(
          "PA-OS: no saved portfolio image."
        );
      }


      /*
       * --------------------------------------------------------
       * Initial modal behavior
       *
       * Do not force it open if a screenshot already exists.
       * --------------------------------------------------------
       */

      if (!savedImage) {

        /*
         * Small delay so the page finishes rendering first.
         */

        setTimeout(
          () => {

            openImportModal();

          },
          150
        );
      }


      /*
       * --------------------------------------------------------
       * Initial ledger
       * --------------------------------------------------------
       */

      renderLedger();


      console.log(
        "PA-OS: initialization complete."
      );

    }
  }
  );

})();
