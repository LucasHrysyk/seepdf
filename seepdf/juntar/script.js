const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const selectFilesBtn = document.getElementById('selectFilesBtn');
const fileList = document.getElementById('fileList');
const mergePdfBtn = document.getElementById('mergePdfBtn');
const messageElement = document.getElementById('message');
const resultSection = document.getElementById('resultSection');
const downloadLink = document.getElementById('downloadLink');
const removeAllPdfsBtn = document.getElementById('removeAllPdfsBtn'); // Novo elemento!

// Array para armazenar os objetos File selecionados, mantendo a ordem
let selectedFiles = [];

// Variáveis para o drag-and-drop
let draggedItem = null; // O item (li) que está sendo arrastado

// Função para exibir mensagens
function displayMessage(msg, type = 'error') {
    messageElement.textContent = msg;
    messageElement.style.color = type === 'success' ? '#28a745' : '#dc3545';
    messageElement.style.display = 'block';
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000); // Esconde a mensagem após 5 segundos
}

// Atualiza o estado dos botões (Juntar PDF e Remover Todos)
function updateButtonStates() {
    mergePdfBtn.disabled = selectedFiles.length < 2;
    // Mostra/Esconde o botão Remover Todos
    if (selectedFiles.length > 0) {
        removeAllPdfsBtn.style.display = 'block';
    } else {
        removeAllPdfsBtn.style.display = 'none';
    }
}

// Função para gerar a pré-visualização de um PDF
async function generatePdfThumbnail(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); // Pega a primeira página

        const viewport = page.getViewport({ scale: 0.5 }); // Escala para uma miniatura
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Retorna a URL da imagem base64 do canvas
        return canvas.toDataURL('image/png');

    } catch (error) {
        console.error('Erro ao gerar miniatura do PDF:', error);
        // Retorna uma imagem de erro ou placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik01MiAzNlYyMEg0MC41QzM5Ljg4IDIwIDM5LjMzIDE5LjUyIDM5LjMzIDE4Ljg5VjcuMzI5OTVDMzkuMzMgNi43Mjk5NSAzOS44OCA2LjIwOTk1IDQwLjUgNi4yMDk5NUgzNi43NUMzNi4wMyA2LjIwOTk1IDM1LjQyIDUuNzM5OTUgMzUuNDIgNS4wMTk5NUgzMS41VjcuNzVCQzMxLjUgOC4zOCAzMS44MiA4Ljg4IDMyLjUgOC44OEg0NC4yNUM0NC45NyA4Ljg4IDQ1LjU4IDkuNDUgNDUuNTggMTAuMTZWNDYuMzM1QzQ1LjU4IDQ3LjA1NSA0NS42OCA0Ny41ODUgNDQuOTYgNDcuNTg1SDIxLjYzQzIwLjc2IDQ3LjU4NSAyMC4wOSA0Ni45MjUgMjAuMDkgNDYuMTA1VjI1Ljc1QzIwLjA5IDI1LjAxNSAyMC42NiAyNC41MTUgMjEuMzggMjQuNTE1SDguMjVDNy41NCAyNC41MTUgNy4wNyAyNS4wNDUgNy4wNyAyNS43NVY0NS41M0M3LjA3IDQ3LjEwNSA3Ljk2IDQ3Ljc0NSA5LjI3IDQ3Ljc0NUMxMC41OCA0Ny43NDUgMTEuNDcgNDcuMTA1IDExLjQ3IDQ1LjUzVjI1Ljc1QzExLjQ3IDI1LjAxNSAxMS45NCAyNC41MTUgMTIuNjUgMjQuNTE1SDQuNzRDMjQuNjkgNDIuNTQ1SDU2VjUwSDQ2Ljc1VjU3LjI1SDU2QzU3LjY1IDU3LjI1IDU5IDU1LjkgNTkgNTQuMjVWMTcuNzVDNTkgMTYuMTA1IDU3LjY1IDE0Ljc1IDU2IDE0LjcuNzVoLTRDMi4zNSAxNC43NSA1IDE2LjEwNSA1IDE3Ljc1VjU0LjI1QzUgNTUuOSA2LjM1IDU3LjI1IDggNTcuMjVINThWNTJIODYuNzVWMjguNTVINTdWMTQuNzVoLUwxOC4wNiAxNC42NDUiVHJhbnNmb3JtPSJzY2FsZSgwLjUgMC41KSB0cmFuc2xhdGUoMTYsIDE2KSIgZmlsbD0iI0REREREIi8+Cjwvc3ZnPg=='; // Ícone genérico de arquivo
    }
}

// Renderiza a lista de arquivos na interface
async function renderFileList() {
    fileList.innerHTML = ''; // Limpa a lista atual

    // Cria clones do selectedFiles para garantir que o array original não seja alterado
    // durante as operações assíncronas de thumbnail (embora agora seja menos crítico com a renderização em loop)
    const filesToRender = [...selectedFiles]; 

    for (let i = 0; i < filesToRender.length; i++) {
        const file = filesToRender[i];
        const listItem = document.createElement('li');
        listItem.draggable = true; // Torna o item arrastável
        listItem.dataset.index = i; // Armazena o índice atual

        // Cria o elemento da miniatura
        const thumbnailImg = document.createElement('img');
        thumbnailImg.classList.add('thumbnail');
        thumbnailImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // Pequeno gif transparente para placeholder inicial
        thumbnailImg.alt = 'Pré-visualização do PDF';
        listItem.appendChild(thumbnailImg);

        // Cria o elemento para o nome do arquivo
        const fileNameSpan = document.createElement('span');
        fileNameSpan.classList.add('file-name');
        fileNameSpan.textContent = file.name;
        listItem.appendChild(fileNameSpan);

        // Cria o botão de remover
        const removeButton = document.createElement('button');
        removeButton.textContent = 'x';
        removeButton.classList.add('remove-file');
        // Usamos um atributo de dados para identificar o arquivo a ser removido
        removeButton.dataset.fileName = file.name; 
        removeButton.dataset.fileSize = file.size;

        listItem.appendChild(removeButton);

        fileList.appendChild(listItem);

        // Gera e atribui a miniatura assincronamente
        const thumbnailDataUrl = await generatePdfThumbnail(file);
        thumbnailImg.src = thumbnailDataUrl;
    }
    updateButtonStates(); // Atualiza o estado dos botões após renderizar a lista
}

// Adiciona arquivos à lista (chamado por drag-drop ou input file)
function addFiles(files) {
    let newFilesAdded = false;
    Array.from(files).forEach(file => {
        if (file.type === 'application/pdf') {
            if (file.size <= 100 * 1024 * 1024) { // Limite de 100MB
                // Verifica se o arquivo já foi adicionado para evitar duplicatas (nome e tamanho)
                const isDuplicate = selectedFiles.some(f => f.name === file.name && f.size === file.size);
                if (!isDuplicate) {
                    selectedFiles.push(file);
                    newFilesAdded = true;
                } else {
                    displayMessage(`O arquivo "${file.name}" já foi adicionado.`);
                }
            } else {
                displayMessage(`O arquivo "${file.name}" excede o limite de 100MB.`);
            }
        } else {
            displayMessage(`O arquivo "${file.name}" não é um PDF válido.`);
        }
    });

    if (newFilesAdded) {
        renderFileList(); // Renderiza a lista apenas se novos arquivos foram adicionados
    }
}

// Remove um arquivo da lista
// A correção está aqui: o evento é adicionado ao UL, e identificamos qual LI foi clicado
fileList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-file')) {
        const fileNameToRemove = e.target.dataset.fileName;
        const fileSizeToRemove = parseInt(e.target.dataset.fileSize); // Converter para número

        // Encontra o índice do arquivo a ser removido no array selectedFiles
        const indexToRemove = selectedFiles.findIndex(f => f.name === fileNameToRemove && f.size === fileSizeToRemove);

        if (indexToRemove > -1) {
            selectedFiles.splice(indexToRemove, 1); // Remove o arquivo do array
            renderFileList(); // Re-renderiza a lista para refletir a remoção
        }
    }
});


// Função para remover todos os arquivos
removeAllPdfsBtn.addEventListener('click', () => {
    selectedFiles = []; // Limpa o array
    renderFileList(); // Re-renderiza a lista (agora vazia)
    displayMessage('Todos os PDFs foram removidos.', 'success');
    resultSection.style.display = 'none'; // Esconde a seção de download se estiver visível
});


// --- Eventos de Drag and Drop para a área de upload ---
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
    addFiles(e.dataTransfer.files);
});

// --- Eventos de clique para selecionar arquivos ---
selectFilesBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
});

// --- Eventos de Drag and Drop para reordenar a lista de arquivos ---
fileList.addEventListener('dragstart', (e) => {
    // Garante que apenas itens da lista (LI) sejam arrastáveis
    if (e.target.tagName === 'LI') {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => draggedItem.classList.add('dragging'), 0);
    } else {
        // Se o clique foi no botão 'x', não iniciar o drag
        e.preventDefault();
        return;
    }
});

fileList.addEventListener('dragover', (e) => {
    e.preventDefault(); // Permite o drop
    const targetItem = e.target.closest('li');
    if (targetItem && targetItem !== draggedItem) {
        Array.from(fileList.children).forEach(item => item.classList.remove('drop-target'));
        targetItem.classList.add('drop-target');
    }
});

fileList.addEventListener('dragleave', (e) => {
    if (e.target.closest('li')) {
        e.target.closest('li').classList.remove('drop-target');
    }
});

fileList.addEventListener('drop', (e) => {
    e.preventDefault();
    Array.from(fileList.children).forEach(item => item.classList.remove('drop-target')); // Limpa todos os alvos

    const targetItem = e.target.closest('li');

    if (draggedItem && targetItem && draggedItem !== targetItem) {
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const targetIndex = parseInt(targetItem.dataset.index);

        // Reordena o array selectedFiles
        const [removed] = selectedFiles.splice(draggedIndex, 1);
        selectedFiles.splice(targetIndex, 0, removed);

        renderFileList(); // Re-renderiza a lista para refletir a nova ordem
    }
});

fileList.addEventListener('dragend', () => {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
    }
    draggedItem = null;
    Array.from(fileList.children).forEach(item => item.classList.remove('drop-target'));
});


// --- Função para juntar os PDFs ---
mergePdfBtn.addEventListener('click', async () => {
    if (selectedFiles.length < 2) {
        displayMessage('Selecione pelo menos 2 arquivos PDF para juntar.');
        return;
    }

    messageElement.style.display = 'block';
    messageElement.style.color = '#007bff';
    messageElement.textContent = 'Juntando PDFs, por favor aguarde...';
    mergePdfBtn.disabled = true; // Desabilita o botão enquanto processa

    try {
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();

        for (const file of selectedFiles) {
            console.log(`Tentando carregar arquivo: ${file.name}`);
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            console.log(`Arquivo ${file.name} carregado e páginas copiadas com sucesso.`);
        }

        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        downloadLink.href = url;
        if (resultSection) {
            resultSection.style.display = 'block'; // Mostra a seção de download
        }
        displayMessage('PDFs juntados com sucesso!', 'success');
        fileList.innerHTML = ''; // Limpa a lista de arquivos visíveis
        selectedFiles = []; // Limpa o array de arquivos selecionados
        updateButtonStates(); // Desabilita o botão após a junção

    } catch (error) {
        console.error('Erro detalhado ao juntar PDFs:', error);
        displayMessage('Ocorreu um erro ao juntar os PDFs. Verifique se os arquivos são válidos ou tente novamente. Veja o console para mais detalhes.');
    } finally {
        mergePdfBtn.disabled = false; // Reabilita o botão em caso de erro
    }
});

// Garante que o estado inicial dos botões esteja correto ao carregar a página
updateButtonStates();