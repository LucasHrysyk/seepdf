const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const pdfInfoContainer = document.getElementById('pdfInfoContainer');
const pdfFileName = document.getElementById('pdfFileName');
const pdfTotalPages = document.getElementById('pdfTotalPages');
const thumbnailPreviewMain = document.getElementById('thumbnailPreviewMain');
const removePdfBtn = document.getElementById('removePdfBtn');
const splitOptionsContainer = document.getElementById('splitOptionsContainer');
const splitMethodRadios = document.querySelectorAll('input[name="splitMethod"]');
const pageRangesInput = document.getElementById('pageRangesInput'); // Re-adicionado
const splitPdfBtn = document.getElementById('splitPdfBtn');
const messageElement = document.getElementById('message');
const resultSection = document.getElementById('resultSection');
const downloadLinksContainer = document.getElementById('downloadLinksContainer');

let loadedPdfFile = null;      // Armazena o objeto File do PDF carregado
let loadedPdfDocLib = null;    // Armazena o objeto PDFDocument do pdf-lib
let loadedPdfDocJs = null;     // Armazena o objeto PDFDocumentProxy do pdf.js para renderização
let totalPdfPages = 0;

// Função para exibir mensagens
function displayMessage(msg, type = 'error') {
    messageElement.textContent = msg;
    messageElement.style.color = type === 'success' ? '#28a745' : '#dc3545';
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// Atualiza o estado do botão "Dividir PDF"
function updateSplitButtonState() {
    splitPdfBtn.disabled = true; // Desabilita por padrão
    if (!loadedPdfFile) return;

    const selectedMethod = document.querySelector('input[name="splitMethod"]:checked').value;

    if (selectedMethod === 'allPages') {
        splitPdfBtn.disabled = totalPdfPages < 1; // Habilita se houver pelo menos 1 página
    } else if (selectedMethod === 'pageRanges') {
        // Habilita se houver um PDF carregado e o input de intervalos não estiver vazio
        splitPdfBtn.disabled = pageRangesInput.value.trim() === '';
    }
}

// Função para gerar a pré-visualização de uma página (usando PDF.js)
async function generatePageThumbnail(pdfDocJs, pageNum, container, width = 120, height = 150) {
    try {
        const page = await pdfDocJs.getPage(pageNum + 1); // pageNum é base 0, getPage é base 1
        const viewport = page.getViewport({ width: width }); 
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext).promise;

        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.alt = `Pré-visualização da Página ${pageNum + 1}`;
        
        container.innerHTML = ''; // Limpa qualquer conteúdo anterior
        container.appendChild(img);

    } catch (error) {
        console.error(`Erro ao gerar miniatura da página ${pageNum + 1}:`, error);
        container.innerHTML = '<p style="color: #dc3545; font-size: 0.8em; margin: auto;">Erro ao carregar prévia</p>';
    }
}


// Processa o arquivo PDF carregado
async function handlePdfFile(file) {
    if (file.type !== 'application/pdf') {
        displayMessage('Por favor, selecione um arquivo PDF válido.');
        return;
    }
    if (file.size > 100 * 1024 * 1024) { // Limite de 100MB
        displayMessage('O arquivo excede o limite de 100MB.');
        return;
    }

    try {
        messageElement.style.display = 'block';
        messageElement.style.color = '#007bff';
        messageElement.textContent = 'Carregando PDF, por favor aguarde...';

        const arrayBuffer = await file.arrayBuffer();
        
        // Carrega o PDF com PDF-lib para manipulação (divisão)
        loadedPdfDocLib = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // Carrega o PDF com PDF.js para renderização da miniatura
        loadedPdfDocJs = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        totalPdfPages = loadedPdfDocLib.getPageCount();

        loadedPdfFile = file; // Armazena o objeto File
        pdfFileName.textContent = file.name;
        pdfTotalPages.textContent = totalPdfPages;

        dropArea.style.display = 'none'; // Esconde a área de upload
        pdfInfoContainer.style.display = 'block'; // Mostra informações do PDF
        splitOptionsContainer.style.display = 'block'; // Mostra opções de divisão

        // Gera e exibe a miniatura da primeira página
        await generatePageThumbnail(loadedPdfDocJs, 0, thumbnailPreviewMain);
        
        displayMessage('PDF carregado com sucesso!', 'success');
        updateSplitButtonState(); // Atualiza o estado do botão de divisão
        resultSection.style.display = 'none'; // Esconde resultados anteriores
        downloadLinksContainer.innerHTML = ''; // Limpa links de download anteriores

    } catch (error) {
        console.error('Erro ao carregar PDF:', error);
        displayMessage('Erro ao carregar o PDF. Verifique se o arquivo está correto.');
        resetUI(); // Reseta a interface em caso de erro
    }
}

// Reseta a interface para o estado inicial
function resetUI() {
    loadedPdfFile = null;
    loadedPdfDocLib = null;
    if (loadedPdfDocJs) { // Fecha o documento PDF.js se estiver aberto
        loadedPdfDocJs.destroy();
        loadedPdfDocJs = null;
    }
    totalPdfPages = 0;
    fileInput.value = ''; // Limpa o input de arquivo

    dropArea.style.display = 'block';
    pdfInfoContainer.style.display = 'none';
    splitOptionsContainer.style.display = 'none';
    resultSection.style.display = 'none';
    downloadLinksContainer.innerHTML = '';
    pageRangesInput.value = ''; // Limpa o input de intervalos
    document.querySelector('input[name="splitMethod"][value="allPages"]').checked = true; // Volta para a opção padrão
    pageRangesInput.disabled = true; // Desabilita o input de intervalos
    updateSplitButtonState(); // Atualiza o estado dos botões
    displayMessage(''); // Limpa a mensagem
    thumbnailPreviewMain.innerHTML = ''; // Limpa a prévia
}

// Event Listeners para upload
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('highlight');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('highlight');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('highlight');
    if (e.dataTransfer.files.length > 0) {
        handlePdfFile(e.dataTransfer.files[0]); // Pega apenas o primeiro arquivo
    }
});

selectFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handlePdfFile(e.target.files[0]); // Pega apenas o primeiro arquivo
    }
});

// Event Listener para o botão remover PDF
removePdfBtn.addEventListener('click', resetUI);

// Event Listeners para as opções de divisão
splitMethodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        pageRangesInput.disabled = radio.value === 'allPages';
        updateSplitButtonState();
    });
});

pageRangesInput.addEventListener('input', updateSplitButtonState);

// --- Lógica Principal de Divisão do PDF ---
splitPdfBtn.addEventListener('click', async () => {
    if (!loadedPdfDocLib) {
        displayMessage('Nenhum PDF carregado para dividir.');
        return;
    }

    messageElement.style.display = 'block';
    messageElement.style.color = '#007bff';
    messageElement.textContent = 'Dividindo PDF, por favor aguarde...';
    splitPdfBtn.disabled = true;
    downloadLinksContainer.innerHTML = ''; // Limpa links anteriores
    resultSection.style.display = 'none';

    try {
        const selectedMethod = document.querySelector('input[name="splitMethod"]:checked').value;
        let splitRanges = [];

        if (selectedMethod === 'allPages') {
            for (let i = 0; i < totalPdfPages; i++) {
                splitRanges.push([i, i]); // [startIndex, endIndex] (base 0)
            }
        } else if (selectedMethod === 'pageRanges') {
            const input = pageRangesInput.value.trim();
            const ranges = input.split(',').map(s => s.trim()).filter(s => s); // Separa por vírgulas e limpa vazios

            for (const range of ranges) {
                if (range.includes('-')) {
                    const [start, end] = range.split('-').map(Number);
                    if (isNaN(start) || isNaN(end) || start < 1 || end > totalPdfPages || start > end) {
                        displayMessage(`Intervalo inválido: "${range}". Verifique as páginas (1-${totalPdfPages}) e a ordem.`);
                        splitPdfBtn.disabled = false;
                        return;
                    }
                    splitRanges.push([start - 1, end - 1]); // Converte para base 0
                } else {
                    const pageNum = Number(range);
                    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPdfPages) {
                        displayMessage(`Página inválida: "${range}". Verifique as páginas (1-${totalPdfPages}).`);
                        splitPdfBtn.disabled = false;
                        return;
                    }
                    splitRanges.push([pageNum - 1, pageNum - 1]); // Converte para base 0
                }
            }
            if (splitRanges.length === 0) {
                displayMessage('Nenhum intervalo de página válido foi especificado.');
                splitPdfBtn.disabled = false;
                return;
            }
        }

        const originalFileNameWithoutExt = loadedPdfFile.name.replace(/\.pdf$/, '');
        const { PDFDocument } = PDFLib;

        for (let i = 0; i < splitRanges.length; i++) {
            const [startIndex, endIndex] = splitRanges[i];
            const newPdf = await PDFDocument.create();
            
            // Copiar páginas do PDF original para o novo PDF usando loadedPdfDocLib
            const pagesToCopy = [];
            for(let j = startIndex; j <= endIndex; j++) {
                pagesToCopy.push(loadedPdfDocLib.getPages()[j]);
            }

            const copiedPages = await newPdf.copyPages(loadedPdfDocLib, pagesToCopy.map(p => loadedPdfDocLib.getPages().indexOf(p)));
            copiedPages.forEach(page => newPdf.addPage(page));

            const bytes = await newPdf.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            let fileNameSuffix = '';
            if (startIndex === endIndex) { // Single page
                fileNameSuffix = `_page_${startIndex + 1}`;
            } else { // Range of pages
                fileNameSuffix = `_pages_${startIndex + 1}-${endIndex + 1}`;
            }
            downloadLink.download = `${originalFileNameWithoutExt}${fileNameSuffix}.pdf`;
            downloadLink.classList.add('download-link-item');
            downloadLink.textContent = `PDF ${i + 1} (${startIndex + 1}-${endIndex + 1})`;
            
            downloadLinksContainer.appendChild(downloadLink);
        }

        resultSection.style.display = 'block';
        displayMessage('PDF dividido com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao dividir PDF:', error);
        displayMessage('Ocorreu um erro ao dividir o PDF. Verifique os intervalos de páginas ou o arquivo.');
    } finally {
        splitPdfBtn.disabled = false; // Reabilita o botão
    }
});

// Inicializa o estado dos botões ao carregar a página
updateSplitButtonState();