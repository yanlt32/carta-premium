// Definir a URL base da API
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://carta-premium.onrender.com';

// Função para abrir um modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Função para fechar um modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para enviar uma foto
async function uploadPhoto() {
    const fileInput = document.getElementById('photo-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecione uma foto antes de enviar!');
        return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    try {
        const response = await fetch(`${API_BASE_URL}/enviar-foto`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        alert(data.message);
        fileInput.value = ''; // Limpar o campo
        closeModal('photo-modal');
        loadPhotos(); // Atualizar o carrossel
    } catch (error) {
        console.error('Erro ao enviar foto:', error);
        alert('Erro ao enviar a foto: ' + error.message);
    }
}

// Função para enviar uma carta
async function uploadLetter() {
    const letterTitle = document.getElementById('letter-title').value;
    const letterContent = document.getElementById('letter-input').value;

    if (!letterTitle.trim() || !letterContent.trim()) {
        alert('Por favor, preencha o título e o conteúdo da carta!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/enviar-carta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: letterTitle,
                conteudo: letterContent
            })
        });
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        alert(data.message);
        document.getElementById('letter-title').value = ''; // Limpar campos
        document.getElementById('letter-input').value = '';
        closeModal('letter-modal');
        loadLetters(); // Recarregar cartas
    } catch (error) {
        console.error('Erro ao enviar carta:', error);
        alert('Erro ao enviar a carta: ' + error.message);
    }
}

// Função para alternar a visibilidade do histórico de cartas
function toggleHistory() {
    const historyList = document.getElementById('letter-history-list');
    if (historyList) {
        historyList.style.display = historyList.style.display === 'none' ? 'block' : 'none';
    }
}

// Função para carregar as cartas do backend
async function loadLetters() {
    try {
        const response = await fetch(`${API_BASE_URL}/cartas`);
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        const cartas = await response.json();

        // Exibir a carta mais recente na seção "Carta do Mês"
        const monthlyLetter = document.getElementById('monthly-letter');
        if (cartas.length > 0 && monthlyLetter) {
            monthlyLetter.innerHTML = `
                <h3>${cartas[0].titulo}</h3>
                <p>${cartas[0].conteudo}</p>
            `;
        } else if (monthlyLetter) {
            monthlyLetter.innerHTML = '<p>Nenhuma carta disponível.</p>';
        }

        // Exibir todas as cartas no histórico
        const letterHistoryContent = document.getElementById('letter-history-content');
        if (letterHistoryContent) {
            letterHistoryContent.innerHTML = cartas.length > 0 ? cartas.map(carta => `
                <li>
                    <div class="letter-card">
                        <h3>${carta.titulo}</h3>
                        <p>${carta.conteudo}</p>
                        <button onclick="deleteLetter('${carta.id}')">Deletar</button>
                    </div>
                </li>
            `).join('') : '<li>Nenhuma carta no histórico.</li>';
        }
    } catch (error) {
        console.error('Erro ao carregar cartas:', error);
        alert('Erro ao carregar cartas: ' + error.message);
    }
}

// Função para carregar as fotos do backend (adicionada)
async function loadPhotos() {
    try {
        const response = await fetch(`${API_BASE_URL}/fotos`);
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        const fotos = await response.json();

        // Exibir fotos no carrossel (ajuste o ID conforme seu HTML)
        const photoContainer = document.getElementById('photo-carousel') || document.getElementById('fotos-container');
        if (photoContainer) {
            photoContainer.innerHTML = fotos.length > 0 ? fotos.map(foto => `
                <div class="carousel-item">
                    <img src="${API_BASE_URL}${foto.caminho}" alt="Foto" style="max-width: 100%; height: auto;">
                </div>
            `).join('') : '<p>Nenhuma foto disponível.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar fotos:', error);
        alert('Erro ao carregar fotos: ' + error.message);
    }
}

// Função para deletar uma carta
async function deleteLetter(cartaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cartas/${cartaId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        alert(data.message || 'Carta deletada com sucesso!');
        loadLetters(); // Recarregar as cartas
    } catch (error) {
        console.error('Erro ao deletar carta:', error);
        alert('Erro ao deletar a carta: ' + error.message);
    }
}

// Carregar cartas e fotos quando a página for carregada
window.onload = () => {
    loadLetters();
    loadPhotos();
};

// Função para calcular a diferença de dias
document.addEventListener("DOMContentLoaded", function() {
    const startDate = new Date("2024-09-13");

    function calculateDays() {
        const currentDate = new Date();
        const timeDifference = currentDate - startDate;
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const daysElement = document.getElementById('days-together');
        if (daysElement) {
            daysElement.textContent = daysDifference;
        }
    }

    calculateDays();
});