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
function uploadPhoto() {
    const fileInput = document.getElementById('photo-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor, selecione uma foto antes de enviar!');
        return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    fetch('http://localhost:3000/enviar-foto', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        closeModal('photo-modal');
        loadPhotos(); // Atualizar o carrossel após enviar a foto
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar a foto.');
    });
}

// Função para enviar uma carta
function uploadLetter() {
    const letterTitle = document.getElementById('letter-title').value;
    const letterContent = document.getElementById('letter-input').value;

    if (letterContent.trim() === '') {
        alert('Por favor, escreva uma carta antes de enviar!');
        return;
    }

    fetch('http://localhost:3000/enviar-carta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            titulo: letterTitle,
            conteudo: letterContent
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        closeModal('letter-modal');
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar a carta.');
    });
}

// Função para alternar a visibilidade do histórico de cartas
function toggleHistory() {
    const historyList = document.getElementById('letter-history-list');
    if (historyList.style.display === 'none') {
        historyList.style.display = 'block';
    } else {
        historyList.style.display = 'none';
    }
}
// Função para carregar as cartas do backend
async function loadLetters() {
    try {
        const response = await fetch('http://localhost:3000/cartas');
        const cartas = await response.json();

        // Exibir a carta mais recente na seção "Carta do Mês"
        if (cartas.length > 0) {
            const monthlyLetter = document.getElementById('monthly-letter');
            monthlyLetter.innerHTML = `
                <h3>${cartas[0].titulo}</h3>
                <p>${cartas[0].conteudo}</p>
            `;
        }

        // Exibir todas as cartas no histórico
        const letterHistoryContent = document.getElementById('letter-history-content');
        letterHistoryContent.innerHTML = cartas.map(carta => `
            <li>
                <div class="letter-card">
                    <h3>${carta.titulo}</h3>
                    <p>${carta.conteudo}</p>
                    <button onclick="deleteLetter('${carta.id}')">Deletar</button>
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar cartas:', error);
    }
}

// Função para carregar as cartas do backend
async function loadLetters() {
    try {
        const response = await fetch('http://localhost:3000/cartas');
        const cartas = await response.json();

        // Exibir a carta mais recente na seção "Carta do Mês"
        if (cartas.length > 0) {
            const monthlyLetter = document.getElementById('monthly-letter');
            monthlyLetter.innerHTML = `
                <h3>${cartas[0].titulo}</h3>
                <p>${cartas[0].conteudo}</p>
            `;
        }

        // Exibir todas as cartas no histórico
        const letterHistoryContent = document.getElementById('letter-history-content');
        letterHistoryContent.innerHTML = cartas.map(carta => `
            <li>
                <div class="letter-card">
                    <h3>${carta.titulo}</h3>
                    <p>${carta.conteudo}</p>
                    <button onclick="deleteLetter('${carta.id}')">Deletar</button>
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar cartas:', error);
    }
}

// Função para deletar uma carta
async function deleteLetter(cartaId) {
    try {
        const response = await fetch(`http://localhost:3000/cartas/${cartaId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert('Carta deletada com sucesso!');
            loadLetters(); // Recarregar as cartas após deletar
        } else {
            alert('Erro ao deletar a carta.');
        }
    } catch (error) {
        console.error('Erro ao deletar carta:', error);
        alert('Erro ao deletar a carta.');
    }
}
// Carregar as cartas quando a página for carregada
window.onload = () => {
    loadLetters();
};
document.addEventListener("DOMContentLoaded", function() {
    // Defina a data de início (dia do pedido de namoro)
    const startDate = new Date("2024-09-13");

    // Função para calcular a diferença em dias
    function calculateDays() {
        const currentDate = new Date(); // Data de hoje
        const timeDifference = currentDate - startDate; // Diferença em milissegundos
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // Converter para dias

        // Exibir a quantidade de dias no elemento
        document.getElementById('days-together').textContent = daysDifference;
    }

    // Calcular e exibir os dias quando a página for carregada
    calculateDays();
});

