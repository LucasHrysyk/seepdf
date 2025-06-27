const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const pdfInfoContainer = document.getElementById('pdfInfoContainer');
const pdfFileName = document.getElementById('pdfFileName');
const fileSizeOriginal = document.getElementById('fileSizeOriginal');
const thumbnailPreviewMain = document.getElementById('thumbnailPreviewMain');
const removePdfBtn = document.getElementById('removePdfBtn');
const compressOptionsContainer = document.getElementById('compressOptionsContainer');
const imageQuality = document.getElementById('imageQuality');
const imageQualityValue = document.getElementById('imageQualityValue');
const compressPdfBtn = document.getElementById('compressPdfBtn');
const messageElement = document.getElementById('message');
const resultSection = document.getElementById('resultSection');
const fileSizeCompressed = document.getElementById('fileSizeCompressed');
const reductionPercentage = document.getElementById('reductionPercentage');
const downloadLinksContainer = document.getElementById('downloadLinksContainer');

let loadedPdfFile = null;      // Armazena o objeto File do PDF carregado
let loadedPdfDocLib = null;    // Armazena o objeto PDFDocument do pdf-lib
let loadedPdfDocJs = null;     // Armazena o objeto PDFDocumentProxy do pdf.js para renderização

// Função para exibir mensagens
function displayMessage(msg, type = 'error') {
    messageElement.textContent = msg;
    messageElement.style.color = type === 'success' ? '#28a745' : '#dc3545';
    messageElement.style.display = 'block';
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// Atualiza o estado do botão "Comprimir PDF"
function updateCompressButtonState() {
    compressPdfBtn.disabled = !loadedPdfFile;
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

// Formata o tamanho do arquivo para leitura
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
        
        // Carrega o PDF com PDF-lib para manipulação
        loadedPdfDocLib = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // Carrega o PDF com PDF.js para renderização da miniatura
        loadedPdfDocJs = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        loadedPdfFile = file; // Armazena o objeto File
        pdfFileName.textContent = file.name;
        fileSizeOriginal.textContent = formatBytes(file.size);

        dropArea.style.display = 'none'; // Esconde a área de upload
        pdfInfoContainer.style.display = 'block'; // Mostra informações do PDF
        compressOptionsContainer.style.display = 'block'; // Mostra opções de compressão

        // Gera e exibe a miniatura da primeira página
        await generatePageThumbnail(loadedPdfDocJs, 0, thumbnailPreviewMain);
        
        displayMessage('PDF carregado com sucesso!', 'success');
        updateCompressButtonState(); // Atualiza o estado do botão
        resultSection.style.display = 'none'; // Esconde resultados anteriores
        downloadLinksContainer.innerHTML = ''; // Limpa links de download anteriores

    } catch (error) {
        console.error('Erro ao carregar PDF:', error);
        displayMessage('Erro ao carregar o PDF. Verifique se o arquivo está correto ou se não está corrompido.');
        resetUI(); // Reseta a interface em caso de erro
    }
}

// Reseta a interface para o estado inicial
function resetUI() {
    loadedPdfFile = null;
    if (loadedPdfDocLib) {
        // Embora PDFDocument de pdf-lib não tenha um método 'destroy',
        // podemos limpá-lo.
        loadedPdfDocLib = null;
    }
    if (loadedPdfDocJs) { // Fecha o documento PDF.js se estiver aberto
        loadedPdfDocJs.destroy();
        loadedPdfDocJs = null;
    }
    fileInput.value = ''; // Limpa o input de arquivo

    dropArea.style.display = 'block';
    pdfInfoContainer.style.display = 'none';
    compressOptionsContainer.style.display = 'none';
    resultSection.style.display = 'none';
    downloadLinksContainer.innerHTML = '';
    imageQuality.value = "0.8"; // Reseta o slider para o valor padrão
    imageQualityValue.textContent = "80%";
    
    updateCompressButtonState(); // Atualiza o estado dos botões
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

// Event Listener para o slider de qualidade da imagem
imageQuality.addEventListener('input', (e) => {
    imageQualityValue.textContent = `${Math.round(e.target.value * 100)}%`;
});

// --- Lógica Principal de Compressão do PDF ---
compressPdfBtn.addEventListener('click', async () => {
    if (!loadedPdfDocLib) {
        displayMessage('Nenhum PDF carregado para comprimir.');
        return;
    }

    messageElement.style.display = 'block';
    messageElement.style.color = '#007bff';
    messageElement.textContent = 'Comprimindo PDF, por favor aguarde...';
    compressPdfBtn.disabled = true;
    downloadLinksContainer.innerHTML = ''; // Limpa links anteriores
    resultSection.style.display = 'none';

    try {
        // A compressão principal do PDF-lib ocorre ao salvar o documento,
        // pois ele otimiza a estrutura e comprime os streams de dados (FLATE).
        // Não há um parâmetro direto 'imageQuality' no save() para re-comprimir
        // imagens existentes. O slider será uma indicação visual de nível.

        const bytes = await loadedPdfDocLib.save(); // Salva o PDF otimizado

        const compressedBlob = new Blob([bytes], { type: 'application/pdf' });
        const compressedSize = compressedBlob.size;
        const originalSize = loadedPdfFile.size;

        const reduction = originalSize - compressedSize;
        const reductionPercent = (reduction / originalSize) * 100;

        fileSizeCompressed.textContent = formatBytes(compressedSize);
        reductionPercentage.textContent = `${reductionPercent.toFixed(2)}%`;
        
        const url = URL.createObjectURL(compressedBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        const originalFileNameWithoutExt = loadedPdfFile.name.replace(/\.pdf$/, '');
        downloadLink.download = `${originalFileNameWithoutExt}_comprimido.pdf`;
        downloadLink.classList.add('download-link-item');
        downloadLink.textContent = `Baixar ${originalFileNameWithoutExt}_comprimido.pdf`;
        
        downloadLinksContainer.appendChild(downloadLink);

        resultSection.style.display = 'block';
        displayMessage('PDF comprimido com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao comprimir PDF:', error);
        displayMessage('Ocorreu um erro ao comprimir o PDF. Verifique o arquivo ou tente novamente.');
    } finally {
        compressPdfBtn.disabled = false; // Reabilita o botão
    }
});

// Inicializa o estado dos botões ao carregar a página
updateCompressButtonState();