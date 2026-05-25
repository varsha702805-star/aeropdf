/* ==========================================================================
   AeroPDF - Modern & Professional Image to PDF Converter JavaScript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Dual-Mode State Variables ---
  let currentMode = 'imgToPdf'; // 'imgToPdf' or 'pdfToImg'
  let uploadedFiles = [];
  let generatedPdfBlob = null; // Holds compiled PDF or JSZip Blob
  let pdfFileName = 'document.pdf';

  // --- UI Configuration Constants ---
  const MAX_IMAGE_DIMENSION = 2048; // Max width/height to prevent out of memory issues
  const JPEG_COMPRESSION_QUALITY = 0.85; // Highly optimized visual quality vs footprint

  // --- DOM Elements ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const uploadStateSection = document.getElementById('uploadStateSection');
  const editorStateSection = document.getElementById('editorStateSection');
  
  // HTML5 Labels (for native unblockable click routing)
  const dropzone = document.getElementById('dropzone');
  const addMoreCard = document.getElementById('addMoreCard');
  const addImagesBtn = document.getElementById('addImagesBtn');
  
  // Hidden File Inputs (relocated to the bottom of index.html)
  const fileInput = document.getElementById('fileInput');
  const pdfFileInput = document.getElementById('pdfFileInput');
  
  const selectFilesBtn = document.getElementById('selectFilesBtn');
  const selectBtnIcon = document.getElementById('selectBtnIcon');
  const selectBtnText = document.getElementById('selectBtnText');
  
  // Workspace UI Panels
  const previewGrid = document.getElementById('previewGrid');
  const addMoreText = document.getElementById('addMoreText');
  const editorPanelTitle = document.getElementById('editorPanelTitle');
  const uploadZoneTitle = document.getElementById('uploadZoneTitle');
  const uploadZoneSub = document.getElementById('uploadZoneSub');
  
  // Settings Containers
  const imgToPdfSettingsCard = document.getElementById('imgToPdfSettingsCard');
  const pdfToImgSettingsCard = document.getElementById('pdfToImgSettingsCard');
  
  // Image to PDF Settings
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  const orientationGroup = document.getElementById('orientationGroup');
  const imageFitGroup = document.getElementById('imageFitGroup');
  const imageFitSelect = document.getElementById('imageFitSelect');
  
  // PDF to Image Settings
  const exportFormatSelect = document.getElementById('exportFormatSelect');
  
  // Actions & Stats
  const clearAllBtn = document.getElementById('clearAllBtn');
  const bottomBar = document.getElementById('bottomBar');
  const statsCountText = document.getElementById('statsCountText');
  const statsDetailText = document.getElementById('statsDetailText');
  const convertToPdfBtn = document.getElementById('convertToPdfBtn');
  
  // Mode Switcher Buttons
  const modeImgToPdfBtn = document.getElementById('modeImgToPdfBtn');
  const modePdfToImgBtn = document.getElementById('modePdfToImgBtn');
  
  // Loading Modal
  const loadingModal = document.getElementById('loadingModal');
  const progressIndicator = document.getElementById('progressIndicator');
  const progressPercentText = document.getElementById('progressPercentText');
  const loadingModalStatusText = document.getElementById('loadingModalStatusText');
  
  // Success Modal
  const successModal = document.getElementById('successModal');
  const pdfNameText = document.getElementById('pdfNameText');
  const pdfSizeText = document.getElementById('pdfSizeText');
  const pdfPagesText = document.getElementById('pdfPagesText');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const convertAnotherBtn = document.getElementById('convertAnotherBtn');
  
  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // Initialize Lucide Icons
  lucide.createIcons();

  // --- Navigation Link Active Toggling ---
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // --- Theme Toggle Action ---
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    document.body.classList.add('light-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });

  // --- Segmented Mode Switcher Actions ---
  modeImgToPdfBtn.addEventListener('click', () => switchMode('imgToPdf'));
  modePdfToImgBtn.addEventListener('click', () => switchMode('pdfToImg'));

  function switchMode(mode) {
    if (currentMode === mode) return;
    
    // Confirm if files are present to prevent accidental data loss
    if (uploadedFiles.length > 0) {
      if (!confirm('Switching modes will clear your current workspace. Do you want to proceed?')) {
        return;
      }
    }

    currentMode = mode;
    uploadedFiles = [];
    generatedPdfBlob = null;
    
    // Toggle active switcher visual styles
    if (currentMode === 'imgToPdf') {
      modeImgToPdfBtn.classList.add('active');
      modePdfToImgBtn.classList.remove('active');
      
      // Dynamic HTML5 Label updates (forces native unblockable click routing)
      dropzone.setAttribute('for', 'fileInput');
      addImagesBtn.setAttribute('for', 'fileInput');
      addMoreCard.setAttribute('for', 'fileInput');
      
      // Update upload zone labels
      uploadZoneTitle.textContent = 'Drag & drop your images here';
      uploadZoneSub.textContent = 'Supports JPG, JPEG, PNG, and WebP. Works 100% locally in your browser.';
      
      // Update select buttons
      selectBtnText.textContent = 'Select Files';
      selectBtnIcon.setAttribute('data-lucide', 'image');
      
      // Update Editor text labels
      editorPanelTitle.innerHTML = `<i data-lucide="list-ordered" style="color: var(--accent-color);"></i> Document Pages`;
      addMoreText.textContent = 'Add Image';
      
      // Toggle sidebar panel visibility
      imgToPdfSettingsCard.style.display = 'block';
      pdfToImgSettingsCard.style.display = 'none';
      
      // Update bottom convert button
      convertToPdfBtn.innerHTML = `<i data-lucide="file-text"></i> Convert to PDF`;
    } else {
      modePdfToImgBtn.classList.add('active');
      modeImgToPdfBtn.classList.remove('active');
      
      // Dynamic HTML5 Label updates (forces native unblockable click routing)
      dropzone.setAttribute('for', 'pdfFileInput');
      addImagesBtn.setAttribute('for', 'pdfFileInput');
      addMoreCard.setAttribute('for', 'pdfFileInput');
      
      // Update upload zone labels
      uploadZoneTitle.textContent = 'Drag & drop your PDF file here';
      uploadZoneSub.textContent = 'Extract PDF pages as high-quality JPEGs or PNGs. Done strictly client-side.';
      
      // Update select buttons
      selectBtnText.textContent = 'Select PDF';
      selectBtnIcon.setAttribute('data-lucide', 'file-text');
      
      // Update Editor text labels
      editorPanelTitle.innerHTML = `<i data-lucide="images" style="color: var(--accent-color);"></i> Extracted Pages`;
      addMoreText.textContent = 'Add PDF';
      
      // Toggle sidebar panel visibility
      imgToPdfSettingsCard.style.display = 'none';
      pdfToImgSettingsCard.style.display = 'block';
      
      // Update bottom convert button
      convertToPdfBtn.innerHTML = `<i data-lucide="file-output"></i> Download JPEG Pages`;
    }

    // Recalculate icon bounds
    lucide.createIcons();
    updateWorkspaceState();
  }

  // --- Dynamic Form Dependency Handling (Image to PDF settings) ---
  pageSizeSelect.addEventListener('change', () => {
    const value = pageSizeSelect.value;
    if (value === 'auto') {
      imageFitGroup.style.opacity = '0.4';
      imageFitGroup.style.pointerEvents = 'none';
      document.getElementById('orientAuto').checked = true;
      orientationGroup.style.opacity = '0.4';
      orientationGroup.style.pointerEvents = 'none';
    } else {
      imageFitGroup.style.opacity = '1';
      imageFitGroup.style.pointerEvents = 'auto';
      orientationGroup.style.opacity = '1';
      orientationGroup.style.pointerEvents = 'auto';
    }
  });

  // --- Notification Toasts ---
  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    
    const iconName = isError ? 'alert-circle' : 'check-circle2';
    const iconColor = isError ? 'var(--danger-color)' : 'var(--accent-color)';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}" style="color: ${iconColor}; width: 1.25rem; height: 1.25rem;"></i>
      <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.25s reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, 4000);
  }

  // --- File Selection Change Handlers ---
  fileInput.addEventListener('change', (e) => {
    handleSelectedImageFiles(e.target.files);
    fileInput.value = '';
  });

  pdfFileInput.addEventListener('change', (e) => {
    handleSelectedPdfFile(e.target.files[0]);
    pdfFileInput.value = '';
  });

  // --- Drag & Drop Event Listeners ---
  dropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');

    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      if (currentMode === 'imgToPdf') {
        handleSelectedImageFiles(dt.files);
      } else {
        handleSelectedPdfFile(dt.files[0]);
      }
    }
  });

  // --- Image to PDF Processing Pipeline ---
  async function handleSelectedImageFiles(files) {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    // Dual-layer validation: checks standard MIME types AND visual file extensions (bypasses Linux browser mime-binding bugs)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const imageFiles = fileList.filter(file => {
      const isMimeValid = validImageTypes.includes(file.type);
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isExtValid = validExtensions.includes(ext);
      return isMimeValid || isExtValid;
    });

    if (imageFiles.length === 0) {
      showToast('Please select valid JPEG, PNG, or WebP images.', true);
      return;
    }

    if (imageFiles.length < fileList.length) {
      showToast(`${fileList.length - imageFiles.length} unsupported files were ignored.`, true);
    }

    showLoadingModal(true);
    loadingModalStatusText.textContent = 'Processing and optimizing images...';
    updateProgressPercent(0);

    const totalToProcess = imageFiles.length;
    let processedCount = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        const optimizedImg = await processImageAsync(file);
        uploadedFiles.push({
          id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          name: file.name,
          originalSize: formatBytes(file.size),
          optimizedSize: optimizedImg.size,
          dataUrl: optimizedImg.dataUrl,
          width: optimizedImg.width,
          height: optimizedImg.height,
          aspectRatio: optimizedImg.width / optimizedImg.height
        });
      } catch (err) {
        console.error(err);
        showToast(`Failed to process: ${file.name}`, true);
      }
      processedCount++;
      updateProgressPercent(Math.round((processedCount / totalToProcess) * 100));
    }

    showLoadingModal(false);
    showToast(`Successfully added ${imageFiles.length} images.`);
    updateWorkspaceState();
  }

  function processImageAsync(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          try {
            let targetW = img.naturalWidth;
            let targetH = img.naturalHeight;

            if (targetW > MAX_IMAGE_DIMENSION || targetH > MAX_IMAGE_DIMENSION) {
              if (targetW > targetH) {
                targetH = Math.round((targetH * MAX_IMAGE_DIMENSION) / targetW);
                targetW = MAX_IMAGE_DIMENSION;
              } else {
                targetW = Math.round((targetW * MAX_IMAGE_DIMENSION) / targetH);
                targetH = MAX_IMAGE_DIMENSION;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, targetW, targetH);

            const dataUrl = canvas.toDataURL('image/jpeg', JPEG_COMPRESSION_QUALITY);
            const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
            const rawLength = Math.floor(base64Length * 0.75);

            resolve({
              dataUrl: dataUrl,
              width: targetW,
              height: targetH,
              size: formatBytes(rawLength)
            });
          } catch (canvasErr) {
            reject(canvasErr);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image element.'));
      };
      reader.onerror = () => reject(new Error('Failed to read file contents.'));
    });
  }

  // --- PDF to Image Page Rendering Pipeline (PDF.js) ---
  async function handleSelectedPdfFile(file) {
    if (!file) return;

    // Checks standard extension endings to support Linux environments
    const isPdfExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase() === '.pdf';
    if (file.type !== 'application/pdf' && !isPdfExt) {
      showToast('Please select a valid PDF document.', true);
      return;
    }

    showLoadingModal(true);
    loadingModalStatusText.textContent = 'Initializing local PDF engine...';
    updateProgressPercent(0);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    
    reader.onerror = () => {
      showLoadingModal(false);
      showToast('Failed to read PDF file contents.', true);
    };

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        
        // Configure PDFjs Worker globally (supports standard and fallback namespaces)
        const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) {
          throw new Error('PDF.js library is not fully loaded in global scope.');
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        
        loadingModalStatusText.textContent = 'Loading PDF document...';
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        
        const totalPages = pdfDoc.numPages;
        if (totalPages === 0) {
          showLoadingModal(false);
          showToast('The selected PDF contains no pages.', true);
          return;
        }

        // Gather extraction configurations
        const exportFormat = exportFormatSelect.value; // 'image/jpeg' or 'image/png'
        const ext = exportFormat === 'image/png' ? 'png' : 'jpg';
        const scale = parseFloat(document.querySelector('input[name="extractQuality"]:checked').value); // 1.5 (med) or 2.5 (HD)

        uploadedFiles = []; // Reset files workspace list
        const baseName = file.name.replace(/\.[^/.]+$/, ""); // strip extension

        for (let i = 1; i <= totalPages; i++) {
          loadingModalStatusText.textContent = `Rendering page ${i} of ${totalPages} (HD rendering)...`;
          
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: scale });
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          // Render PDF page in canvas
          await page.render(renderContext).promise;
          
          // Export data url
          const dataUrl = canvas.toDataURL(exportFormat, JPEG_COMPRESSION_QUALITY);
          const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          const rawLength = Math.floor(base64Length * 0.75);

          uploadedFiles.push({
            id: 'pdf-page-' + i + '-' + Date.now(),
            name: `${baseName}_page_${i}.${ext}`,
            originalSize: 'PDF Rendered',
            optimizedSize: formatBytes(rawLength),
            dataUrl: dataUrl,
            width: viewport.width,
            height: viewport.height,
            aspectRatio: viewport.width / viewport.height
          });

          // Incremental spinner updates
          const pct = Math.round((i / totalPages) * 100);
          updateProgressPercent(pct);
          await sleep(40); // yields execution to browser thread
        }

        showLoadingModal(false);
        showToast(`Successfully extracted ${totalPages} pages from PDF.`);
        updateWorkspaceState();

      } catch (err) {
        console.error(err);
        showLoadingModal(false);
        showToast('Failed to convert PDF. Ensure file is not encrypted/password protected.', true);
      }
    };
  }

  // --- UI State Management ---
  function updateWorkspaceState() {
    if (uploadedFiles.length === 0) {
      uploadStateSection.style.display = 'flex';
      editorStateSection.style.display = 'none';
      bottomBar.style.display = 'none';
    } else {
      uploadStateSection.style.display = 'none';
      editorStateSection.style.display = 'grid';
      bottomBar.style.display = 'block';
      renderPreviews();
    }
  }

  // --- Rendering Previews & Action bindings ---
  function renderPreviews() {
    addMoreCard.remove();
    previewGrid.innerHTML = '';

    const isImgMode = currentMode === 'imgToPdf';

    // Synchronize addMoreCard target label naturally
    addMoreCard.setAttribute('for', isImgMode ? 'fileInput' : 'pdfFileInput');

    uploadedFiles.forEach((file, index) => {
      const isFirst = index === 0;
      const isLast = index === uploadedFiles.length - 1;

      const card = document.createElement('div');
      card.className = 'thumbnail-card';
      card.setAttribute('data-id', file.id);
      
      card.innerHTML = `
        <span class="page-badge">Page ${index + 1}</span>
        <div class="card-controls">
          ${!isImgMode ? `
          <button class="control-btn download-single-btn" title="Download JPEG image" aria-label="Download page ${index + 1} image">
            <i data-lucide="download" style="width: 0.95rem; height: 0.95rem;"></i>
          </button>
          ` : ''}
          <button class="control-btn delete-btn" title="Remove page" aria-label="Remove page ${index + 1}">
            <i data-lucide="trash-2" style="width: 0.95rem; height: 0.95rem;"></i>
          </button>
        </div>
        <div class="thumbnail-image-container">
          <img src="${file.dataUrl}" alt="${file.name}">
        </div>
        <div class="thumbnail-info">
          <span class="thumbnail-name" title="${file.name}">${file.name}</span>
          <span class="thumbnail-size">${file.optimizedSize}</span>
        </div>
        ${isImgMode ? `
        <div class="thumbnail-footer-actions">
          <button class="action-arrow-btn reorder-prev" title="Move page up" ${isFirst ? 'disabled' : ''} aria-label="Move page ${index + 1} left">
            <i data-lucide="arrow-left" style="width: 0.95rem; height: 0.95rem;"></i>
          </button>
          <button class="action-arrow-btn reorder-next" title="Move page down" ${isLast ? 'disabled' : ''} aria-label="Move page ${index + 1} right">
            <i data-lucide="arrow-right" style="width: 0.95rem; height: 0.95rem;"></i>
          </button>
        </div>
        ` : ''}
      `;

      // Set up individual button event listeners inside cards
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removePage(file.id);
      });

      if (isImgMode) {
        card.querySelector('.reorder-prev').addEventListener('click', (e) => {
          e.stopPropagation();
          swapPages(index, index - 1);
        });

        card.querySelector('.reorder-next').addEventListener('click', (e) => {
          e.stopPropagation();
          swapPages(index, index + 1);
        });
      } else {
        // Individual page download listener
        card.querySelector('.download-single-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          downloadSinglePageImage(file);
        });
      }

      previewGrid.appendChild(card);
    });

    previewGrid.appendChild(addMoreCard);
    lucide.createIcons();
    
    // Stats Calculations
    const label = isImgMode ? 'Image' : 'Extracted Page';
    statsCountText.textContent = `${uploadedFiles.length} ${label}${uploadedFiles.length > 1 ? 's' : ''} Selected`;
    
    let totalMegabytes = 0;
    uploadedFiles.forEach(f => {
      const sizeVal = parseFloat(f.optimizedSize);
      if (f.optimizedSize.includes('MB')) {
        totalMegabytes += sizeVal;
      } else if (f.optimizedSize.includes('KB')) {
        totalMegabytes += sizeVal / 1024;
      }
    });
    
    const summary = isImgMode ? 'Output PDF will be fully optimized' : 'Ready to pack into ZIP';
    statsDetailText.textContent = `Footprint: ~${totalMegabytes.toFixed(2)} MB | ${summary}`;
  }

  // Swap pages
  function swapPages(indexA, indexB) {
    if (indexA < 0 || indexA >= uploadedFiles.length || indexB < 0 || indexB >= uploadedFiles.length) return;
    
    const cardA = previewGrid.children[indexA];
    const cardB = previewGrid.children[indexB];
    if (cardA && cardB) {
      cardA.style.opacity = '0.5';
      cardB.style.opacity = '0.5';
    }

    setTimeout(() => {
      const temp = uploadedFiles[indexA];
      uploadedFiles[indexA] = uploadedFiles[indexB];
      uploadedFiles[indexB] = temp;
      renderPreviews();
    }, 120);
  }

  // Remove single page
  function removePage(id) {
    const card = previewGrid.querySelector(`.thumbnail-card[data-id="${id}"]`);
    if (card) {
      card.style.transform = 'scale(0.85)';
      card.style.opacity = '0';
    }

    setTimeout(() => {
      uploadedFiles = uploadedFiles.filter(file => file.id !== id);
      updateWorkspaceState();
    }, 200);
  }

  // Download a single extracted image page directly
  function downloadSinglePageImage(file) {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    showToast('Download started!');
  }

  // Clear all workspace elements
  clearAllBtn.addEventListener('click', () => {
    const prompt = currentMode === 'imgToPdf' ? 'images' : 'extracted pages';
    if (confirm(`Are you sure you want to remove all ${prompt}?`)) {
      uploadedFiles = [];
      updateWorkspaceState();
      showToast('Workspace cleared.');
    }
  });

  // --- Execution Router (Convert action) ---
  convertToPdfBtn.addEventListener('click', async () => {
    if (uploadedFiles.length === 0) return;

    showLoadingModal(true);
    updateProgressPercent(0);

    setTimeout(async () => {
      try {
        if (currentMode === 'imgToPdf') {
          loadingModalStatusText.textContent = 'Generating optimized PDF document...';
          await compilePdfAsync();
        } else {
          loadingModalStatusText.textContent = 'Preparing your JPEG files...';
          await prepareDownloadImagesAsync();
        }
      } catch (err) {
        console.error(err);
        showLoadingModal(false);
        showToast('An error occurred during conversion processing.', true);
      }
    }, 300);
  });

  // Asynchronously compile images to PDF
  async function compilePdfAsync() {
    const jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDF) {
      throw new Error('jsPDF library not loaded.');
    }
    
    const pageSize = pageSizeSelect.value; 
    const marginSelect = document.querySelector('input[name="margins"]:checked').value; 
    const imageFit = imageFitSelect.value; 
    
    let margin = 0; 
    if (marginSelect === 'small') margin = 10;
    else if (marginSelect === 'medium') margin = 20;

    const orientationRadio = document.querySelector('input[name="orientation"]:checked').value; 

    let doc = null;
    const totalPages = uploadedFiles.length;

    for (let i = 0; i < totalPages; i++) {
      const file = uploadedFiles[i];
      let pageW, pageH, orient;
      
      if (pageSize === 'auto') {
        const factor = 25.4 / 72;
        pageW = (file.width * factor) + (margin * 2);
        pageH = (file.height * factor) + (margin * 2);
        orient = file.width > file.height ? 'landscape' : 'portrait';
      } else if (pageSize === 'a4') {
        pageW = 210;
        pageH = 297;
        
        if (orientationRadio === 'auto') {
          orient = file.width > file.height ? 'landscape' : 'portrait';
        } else {
          orient = orientationRadio;
        }

        if (orient === 'landscape') {
          pageW = 297;
          pageH = 210;
        }
      } else if (pageSize === 'letter') {
        pageW = 215.9;
        pageH = 279.4;
        
        if (orientationRadio === 'auto') {
          orient = file.width > file.height ? 'landscape' : 'portrait';
        } else {
          orient = orientationRadio;
        }

        if (orient === 'landscape') {
          pageW = 279.4;
          pageH = 215.9;
        }
      }

      const orientShort = orient === 'landscape' ? 'l' : 'p';
      const formatSize = [Math.min(pageW, pageH), Math.max(pageW, pageH)];

      if (i === 0) {
        doc = new jsPDF({
          orientation: orientShort,
          unit: 'mm',
          format: formatSize
        });
      } else {
        doc.addPage(formatSize, orientShort);
      }

      const printableW = pageW - (margin * 2);
      const printableH = pageH - (margin * 2);
      
      let x = margin;
      let y = margin;
      let drawW = printableW;
      let drawH = printableH;

      if (pageSize === 'auto') {
        drawW = file.width * (25.4 / 72);
        drawH = file.height * (25.4 / 72);
      } else {
        if (imageFit === 'contain') {
          const imgAspect = file.aspectRatio;
          const pageAspect = printableW / printableH;
          
          if (imgAspect > pageAspect) {
            drawW = printableW;
            drawH = printableW / imgAspect;
            y = margin + (printableH - drawH) / 2;
          } else {
            drawH = printableH;
            drawW = printableH * imgAspect;
            x = margin + (printableW - drawW) / 2;
          }
        } else if (imageFit === 'original') {
          const origW = file.width * (25.4 / 72);
          const origH = file.height * (25.4 / 72);
          
          if (origW <= printableW && origH <= printableH) {
            drawW = origW;
            drawH = origH;
            x = margin + (printableW - drawW) / 2;
            y = margin + (printableH - drawH) / 2;
          } else {
            const imgAspect = file.aspectRatio;
            const pageAspect = printableW / printableH;
            
            if (imgAspect > pageAspect) {
              drawW = printableW;
              drawH = printableW / imgAspect;
              y = margin + (printableH - drawH) / 2;
            } else {
              drawH = printableH;
              drawW = printableH * imgAspect;
              x = margin + (printableW - drawW) / 2;
            }
          }
        } else if (imageFit === 'cover') {
          const targetAspect = printableW / printableH;
          const croppedImgDataUrl = await cropImageToAspect(file.dataUrl, file.width, file.height, targetAspect);
          doc.addImage(croppedImgDataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
          
          const pct = Math.round(((i + 1) / totalPages) * 100);
          updateProgressPercent(pct);
          await sleep(50);
          continue; 
        }
      }

      doc.addImage(file.dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');

      const pct = Math.round(((i + 1) / totalPages) * 100);
      updateProgressPercent(pct);
      await sleep(50);
    }

    if (doc) {
      const rawOutput = doc.output('blob');
      generatedPdfBlob = rawOutput;
      
      const baseName = uploadedFiles[0].name.replace(/\.[^/.]+$/, "");
      pdfFileName = `${baseName}_compiled.pdf`;

      pdfNameText.textContent = pdfFileName;
      pdfSizeText.textContent = formatBytes(generatedPdfBlob.size);
      pdfPagesText.textContent = `${totalPages} page${totalPages > 1 ? 's' : ''}`;

      showLoadingModal(false);
      showSuccessModal(true);
    }
  }

  // Asynchronously prepare extracted images for sequential downloads
  async function prepareDownloadImagesAsync() {
    const total = uploadedFiles.length;
    
    for (let i = 0; i < total; i++) {
      const pct = Math.round(((i + 1) / total) * 100);
      updateProgressPercent(pct);
      await sleep(15); // yield execution to simulate quick prep
    }
    
    // Filename template construct
    const firstFile = uploadedFiles[0].name;
    const baseName = firstFile.substring(0, firstFile.lastIndexOf('_page_'));
    pdfFileName = `${baseName || 'extracted_pages'}_images`;

    // Success Screen bindings
    pdfNameText.textContent = 'JPEG Images';
    
    // Total sizes of all extracted JPEGs combined
    let totalBytes = 0;
    uploadedFiles.forEach(f => {
      const sizeVal = parseFloat(f.optimizedSize);
      if (f.optimizedSize.includes('MB')) {
        totalBytes += sizeVal * 1024 * 1024;
      } else if (f.optimizedSize.includes('KB')) {
        totalBytes += sizeVal * 1024;
      } else {
        totalBytes += sizeVal;
      }
    });
    
    pdfSizeText.textContent = formatBytes(totalBytes);
    pdfPagesText.textContent = `${total} image${total > 1 ? 's' : ''}`;
    
    // Modify success screen details for JPEG sequential downloads
    document.getElementById('successModalTitle').textContent = 'Pages Extracted!';
    document.getElementById('successModal').querySelector('p').textContent = 'Your PDF document pages were successfully extracted as high-quality JPEGs.';
    downloadPdfBtn.querySelector('span').textContent = 'Download JPEG Pages';

    showLoadingModal(false);
    showSuccessModal(true);
  }

  // --- HTML5 Canvas Aspect Ratio Cropping for Cover fit ---
  function cropImageToAspect(imgDataUrl, origW, origH, targetAspect) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imgDataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let cropW = origW;
        let cropH = origH;
        let sourceX = 0;
        let sourceY = 0;
        
        const origAspect = origW / origH;
        
        if (origAspect > targetAspect) {
          cropW = origH * targetAspect;
          sourceX = (origW - cropW) / 2;
        } else {
          cropH = origW / targetAspect;
          sourceY = (origH - cropH) / 2;
        }
        
        canvas.width = cropW;
        canvas.height = cropH;
        
        ctx.drawImage(img, sourceX, sourceY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(canvas.toDataURL('image/jpeg', JPEG_COMPRESSION_QUALITY));
      };
    });
  }

  // --- Modal Helpers ---
  function showLoadingModal(show) {
    loadingModal.style.display = show ? 'flex' : 'none';
    if (show) loadingModal.focus();
  }

  function updateProgressPercent(percent) {
    progressPercentText.textContent = `${percent}%`;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    progressIndicator.style.strokeDashoffset = offset;
  }

  function showSuccessModal(show) {
    successModal.style.display = show ? 'flex' : 'none';
    if (show) successModal.focus();
  }

  // Download compiled document (PDF or JPEGs)
  downloadPdfBtn.addEventListener('click', () => {
    if (currentMode === 'imgToPdf') {
      if (!generatedPdfBlob) return;
      
      const downloadUrl = URL.createObjectURL(generatedPdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = pdfFileName;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      showToast('Download started!');
    } else {
      // Sequential multi-file download with 250ms spacing to prevent browser blockages
      uploadedFiles.forEach((file, index) => {
        setTimeout(() => {
          downloadSinglePageImage(file);
        }, index * 250);
      });
      showToast('Downloading all JPEG pages...');
    }
  });

  // Reset converter / Return to start
  convertAnotherBtn.addEventListener('click', () => {
    showSuccessModal(false);
    uploadedFiles = [];
    generatedPdfBlob = null;
    
    // Restore default text handles for success modals
    document.getElementById('successModalTitle').textContent = 'PDF Generated!';
    document.getElementById('successModal').querySelector('p').textContent = 'Your document was compiled successfully, completely locally.';
    downloadPdfBtn.querySelector('span').textContent = 'Download PDF';
    
    updateWorkspaceState();
  });

  // --- Standard Utilities ---
  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Asynchronous thread yield sleep utility
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Compliance Modals Controller Hooks ---
  const aboutLink = document.getElementById('aboutLink');
  const privacyLink = document.getElementById('privacyLink');
  const contactLink = document.getElementById('contactLink');

  const aboutModal = document.getElementById('aboutModal');
  const privacyModal = document.getElementById('privacyModal');
  const contactModal = document.getElementById('contactModal');

  const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');
  const closePrivacyModalBtn = document.getElementById('closePrivacyModalBtn');
  const closeContactModalBtn = document.getElementById('closeContactModalBtn');
  
  const contactForm = document.getElementById('contactForm');

  // Open Handlers
  aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    aboutModal.style.display = 'flex';
    aboutModal.focus();
  });

  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    privacyModal.style.display = 'flex';
    privacyModal.focus();
  });

  contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    contactModal.style.display = 'flex';
    contactModal.focus();
  });

  // Close Handlers
  closeAboutModalBtn.addEventListener('click', () => aboutModal.style.display = 'none');
  closePrivacyModalBtn.addEventListener('click', () => privacyModal.style.display = 'none');
  closeContactModalBtn.addEventListener('click', () => {
    contactModal.style.display = 'none';
    contactForm.reset();
  });

  // Click Outside to Close Modals
  window.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.style.display = 'none';
    if (e.target === privacyModal) privacyModal.style.display = 'none';
    if (e.target === contactModal) {
      contactModal.style.display = 'none';
      contactForm.reset();
    }
  });

  // Contact Form Submission Handler
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    // Attempt silent AJAX background post to Netlify Forms
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "form-name": "contact",
        "name": name,
        "email": email,
        "message": message
      }).toString()
    })
    .then((res) => {
      if (!res.ok) throw new Error("Netlify AJAX request unsuccessful.");
      showToast('Message sent successfully! We will contact you soon.');
      contactModal.style.display = 'none';
      contactForm.reset();
    })
    .catch((error) => {
      console.warn("AJAX submit failed, falling back to mailto client...", error);
      
      // Fallback: Launch pre-filled native mail client directly targeting your email address
      const mailtoUrl = `mailto:v937506@gmail.com?subject=AeroPDF%20Support/Complaint%20Request&body=Name:%20${encodeURIComponent(name)}%0AEmail:%20${encodeURIComponent(email)}%0A%0AComplaint/Feedback:%0A${encodeURIComponent(message)}`;
      window.location.href = mailtoUrl;
      
      showToast('Opening default mail client...');
      contactModal.style.display = 'none';
      contactForm.reset();
    });
  });
});
