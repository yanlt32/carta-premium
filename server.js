const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();

// Configurar o servidor HTTP com Express
const server = http.createServer(app);
const io = socketIo(server);  // Inicializa o socket.io no servidor

// Configuração do banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, 'cartas.db'), (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados SQLite:", err);
  } else {
    console.log("Banco de dados SQLite conectado com sucesso.");
  }
});

// Criação de uma tabela para armazenar cartas (se não existir)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cartas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT,
      conteudo TEXT,
      data_criacao TEXT
    )
  `);
});

// Rota para salvar cartas
app.use(express.json());

app.post('/enviarCarta', (req, res) => {
  const { titulo, conteudo } = req.body;
  const dataCriacao = new Date().toISOString();

  db.run(
    'INSERT INTO cartas (titulo, conteudo, data_criacao) VALUES (?, ?, ?)',
    [titulo, conteudo, dataCriacao],
    function (err) {
      if (err) {
        return res.status(500).send('Erro ao salvar a carta.');
      }

      // Emitir evento para todos os clientes conectados
      io.emit('newLetter', { title: titulo, content: conteudo });
      res.status(200).send({ message: 'Carta enviada com sucesso!' });
    }
  );
});

// Rota para obter as cartas
app.get('/cartas', (req, res) => {
  db.all('SELECT * FROM cartas ORDER BY data_criacao DESC', (err, rows) => {
    if (err) {
      return res.status(500).send('Erro ao recuperar cartas.');
    }
    res.status(200).json(rows);
  });
});

// Configurar o servidor para ouvir na porta 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
