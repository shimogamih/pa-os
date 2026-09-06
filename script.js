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
       * Backward compatibility
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
   * Image resize
   *
   * Large screenshots are resized before OCR.
   * Original image remains fallback.
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


          resolve(
            result || dataURL
          );

        } catch (error) {

          console.warn(
            "PA-OS: image processing failed",
            error
          );

          resolve(dataURL);
        }
      };


      image.onerror = () => {

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
       * Read file
       */

      const originalDataURL =
        await readFileAsDataURL(file);


      /*
       * STEP 2
       * Resize
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

      if (saved) {

        setText(
          "import-status",
          "Image saved. Ready for OCR."
        );

        setText(
          "modal-status",
          "Image saved. Ready for OCR."
        );

      } else {

        setText(
          "import-status",
          "Image loaded. Local save failed."
        );

        setText(
          "modal-status",
          "Image loaded."
        );
      }


      /*
       * STEP 6
       * Close modal
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
   * Import Modal
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
   * ============================================================
   * OCR
   * ============================================================
   *
   * Tesseract.js v2.1.5
   *
   * Japanese + English
   *
   * Language:
   *   jpn
   *
   * NOTE:
   * The Japanese trained data is downloaded automatically
   * by Tesseract.js when recognize() is called.
   * ============================================================
   */

  async function runOCR() {

    const status =
      $("ocr-status");


    const button =
      $("ocr-btn");


    /*
     * Prevent accidental double-click
     */

    if (button) {
      button.disabled = true;
      button.textContent = "OCR Running...";
    }


    if (status) {
      status.textContent =
        "OCR: initializing...";
    }


    /*
     * ----------------------------------------------------------
     * Find image
     * ----------------------------------------------------------
     */

    let imageSrc =
      loadSavedPortfolioImage();


    /*
     * Fallback to preview image
     */

    if (!imageSrc) {

      const preview =
        $("preview");


      const image =
        preview &&
        preview.querySelector &&
        preview.querySelector("img");


      if (
        image &&
        image.src
      ) {

        imageSrc =
          image.src;
      }
    }


    /*
     * No image
     */

    if (!imageSrc) {

      setText(
        "ocr-status",
        "OCR: no image available. Please upload a screenshot first."
      );


      if (button) {
        button.disabled = false;
        button.textContent = "Run OCR";
      }


      return;
    }


    /*
     * ----------------------------------------------------------
     * Check Tesseract
     * ----------------------------------------------------------
     */

    if (
      !window.Tesseract ||
      typeof window.Tesseract.recognize !== "function"
    ) {

      setText(
        "ocr-status",
        "OCR: Tesseract.js is not loaded."
      );


      console.error(
        "PA-OS: Tesseract.js not available."
      );


      if (button) {
        button.disabled = false;
        button.textContent = "Run OCR";
      }


      return;
    }


    /*
     * ----------------------------------------------------------
     * OCR result container
     * ----------------------------------------------------------
     */

    let resultEl =
      $("ocr-result");


    if (!resultEl) {

      resultEl =
        document.createElement("pre");


      resultEl.id =
        "ocr-result";


      resultEl.className =
        "ocr-result";


      resultEl.style.whiteSpace =
        "pre-wrap";


      resultEl.style.wordBreak =
        "break-word";


      resultEl.style.maxHeight =
        "300px";


      resultEl.style.overflow =
        "auto";


      resultEl.style.marginTop =
        "12px";


      resultEl.style.padding =
        "12px";


      resultEl.style.borderRadius =
        "10px";


      resultEl.style.background =
        "rgba(0,0,0,0.25)";


      resultEl.style.border =
        "1px solid rgba(255,255,255,0.08)";


      const ocrArea =
        document.querySelector(
          ".ocr-area"
        );


      if (ocrArea) {

        ocrArea.appendChild(
          resultEl
        );

      } else if (status) {

        status.parentNode.appendChild(
          resultEl
        );
      }
    }


    resultEl.textContent =
      "";


    /*
     * ----------------------------------------------------------
     * Start OCR
     * ----------------------------------------------------------
     */

    try {

      setText(
        "ocr-status",
        "OCR: loading Japanese language data..."
      );


      /*
       * Tesseract.js v2 syntax
       *
       * Japanese OCR
       */

      const result =
        await Tesseract.recognize(
          imageSrc,
          "jpn",
          {

            logger: function(message) {

              try {

                if (!status) {
                  return;
                }


                /*
                 * Progress percentage
                 */

                if (
                  message &&
                  typeof message.progress === "number"
                ) {

                  const percent =
                    Math.round(
                      message.progress * 100
                    );


                  let currentStatus =
                    message.status ||
                    "processing";


                  /*
                   * Make status human readable
                   */

                  if (
                    currentStatus ===
                    "loading tesseract core"
                  ) {

                    currentStatus =
                      "loading OCR engine";

                  } else if (
                    currentStatus ===
                    "initializing tesseract"
                  ) {

                    currentStatus =
                      "initializing";

                  } else if (
                    currentStatus ===
                    "loading language traineddata"
                  ) {

                    currentStatus =
                      "loading Japanese data";

                  } else if (
                    currentStatus ===
                    "recognizing text"
                  ) {

                    currentStatus =
                      "recognizing text";
                  }


                  status.textContent =
                    `OCR: ${currentStatus} — ${percent}%`;
                }

              } catch (error) {

                console.warn(
                  "PA-OS: OCR logger error",
                  error
                );
              }
            }

          }
        );


      /*
       * --------------------------------------------------------
       * Extract text
       * --------------------------------------------------------
       */

      const text =
        result &&
        result.data &&
        typeof result.data.text === "string"
          ? result.data.text.trim()
          : "";


      /*
       * --------------------------------------------------------
       * Complete
       * --------------------------------------------------------
       */

      setText(
        "ocr-status",
        "OCR: complete"
      );


      if (text) {

        resultEl.textContent =
          text;

      } else {

        resultEl.textContent =
          "(No text recognized)";
      }


      console.log(
        "PA-OS: OCR completed."
      );


      console.log(
        "PA-OS: OCR text:",
        text
      );


    } catch (error) {

      console.error(
        "PA-OS: OCR failed",
        error
      );


      setText(
        "ocr-status",
        "OCR: failed. Check console for details."
      );


      resultEl.textContent =
        "";


    } finally {

      /*
       * Re-enable button
       */

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
   * Initialize
   * ============================================================
   */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      console.log(
        "PA-OS: initializing..."
      );


      /*
       * --------------------------------------------------------
       * DOM elements
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
       * File Input
       * --------------------------------------------------------
       */

      if (!input) {

        console.error(
          "PA-OS ERROR: #portfolio-input not found."
        );

      } else {

        console.log(
          "PA-OS: #portfolio-input found."
        );


        /*
         * Ensure image selection
         */

        input.setAttribute(
          "accept",
          "image/*"
        );


        /*
         * SINGLE CHANGE HANDLER
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


            /*
             * Process image
             */

            await handleFileInput(
              file
            );


            /*
             * Clear input.
             *
             * This is important because
             * iPhone Safari otherwise may not
             * fire change when the same image
             * is selected again.
             */

            try {

              event.target.value =
                "";

            } catch (error) {

              console.warn(
                "PA-OS: could not clear file input.",
                error
              );
            }

          },
          false
        );
      }


      /*
       * --------------------------------------------------------
       * MAIN PHOTO BUTTON
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
                "PA-OS: #portfolio-input missing."
              );

              return;
            }


            /*
             * Direct user gesture.
             *
             * Important for iPhone Safari.
             */

            try {

              input.click();

            } catch (error) {

              console.error(
                "PA-OS: input.click() failed.",
                error
              );
            }

          },
          false
        );

      } else {

        console.error(
          "PA-OS ERROR: #choose-photo-btn not found."
        );
      }


      /*
       * --------------------------------------------------------
       * MODAL PHOTO BUTTON
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


            try {

              input.click();

            } catch (error) {

              console.error(
                "PA-OS: modal input.click() failed.",
                error
              );
            }

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
       * ========================================================
       * OCR BUTTON
       * ========================================================
       *
       * IMPORTANT:
       * There is exactly ONE OCR click handler.
       *
       * No placeholder handler.
       * No duplicate handler.
       * ========================================================
       */

      if (ocrButton) {

        ocrButton.textContent =
          "Run OCR";


        ocrButton.addEventListener(
          "click",
          () => {

            runOCR();

          },
          false
        );


        console.log(
          "PA-OS: OCR button connected."
        );

      } else {

        console.error(
          "PA-OS ERROR: #ocr-btn not found."
        );
      }


      /*
       * --------------------------------------------------------
       * Load saved screenshot
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
       * Initial modal
       * --------------------------------------------------------
       */

      if (!savedImage) {

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


      /*
       * --------------------------------------------------------
       * Finished
       * --------------------------------------------------------
       */

      console.log(
        "PA-OS: initialization complete."
      );

    }
  );

})();
