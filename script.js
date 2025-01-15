// Conectar ao servidor WebSocket
const socket = io('http://localhost:3000');

// Função para carregar as cartas
function loadLetters(letters) {
    const letterHistoryContent = document.getElementById('letter-history-content');
    letterHistoryContent.innerHTML = ''; // Limpar a lista antes de carregar

    letters.forEach(letter => {
        const newLetter = document.createElement('li');
        newLetter.innerHTML = `
            <div class="letter-card">
                <h3>${letter.title}</h3>
                <p>${letter.content}</p>
            </div>
        `;
        letterHistoryContent.appendChild(newLetter);
    });
}

// Quando o cliente se conecta, ele receberá todas as cartas existentes
socket.on('loadLetters', (letters) => {
    loadLetters(letters);
});

// Quando uma nova carta for enviada, todos os clientes recebem ela em tempo real
socket.on('newLetter', (newLetter) => {
    const letterHistoryContent = document.getElementById('letter-history-content');
    const newLetterElement = document.createElement('li');
    newLetterElement.innerHTML = `
        <div class="letter-card">
            <h3>${newLetter.title}</h3>
            <p>${newLetter.content}</p>
        </div>
    `;
    letterHistoryContent.appendChild(newLetterElement);
});

// Função para enviar uma carta para o backend
function uploadLetter() {
    const letterTitle = document.getElementById('letter-title').value;
    const letterContent = document.getElementById('letter-input').value;

    if (letterContent.trim() === '') {
        alert('Por favor, escreva uma carta antes de enviar!');
        return;
    }

    fetch('http://localhost:3000/enviarCarta', {
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
    })
    .catch(error => console.error('Erro:', error));
}
