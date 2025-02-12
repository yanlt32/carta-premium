const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Configuração do SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criar tabelas (se não existirem)
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS cartas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS fotos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            caminho TEXT NOT NULL,
            data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Middleware para permitir CORS e JSON
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer para upload de fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Rota para enviar cartas
app.post('/enviar-carta', (req, res) => {
    const { titulo, conteudo } = req.body;

    console.log('Dados recebidos para envio de carta:', { titulo, conteudo });  // Verifique os dados recebidos

    const query = 'INSERT INTO cartas (titulo, conteudo) VALUES (?, ?)';
    
    db.run(query, [titulo, conteudo], function(err) {
        if (err) {
            console.error('Erro ao inserir carta:', err);  // Verifique o erro
            return res.status(500).send(err);
        }
        console.log('Carta inserida com sucesso:', { id: this.lastID, titulo, conteudo });  // Verifique o ID e os dados
        res.status(200).send('Carta enviada com sucesso!');
    });
});

// Rota para buscar cartas
app.get('/cartas', (req, res) => {
    const query = 'SELECT * FROM cartas ORDER BY data_envio DESC';
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar cartas:', err);  // Verifique o erro
            return res.status(500).send(err);
        }
        res.status(200).json(rows);
    });
});

// Rota para enviar fotos
app.post('/enviar-foto', upload.single('foto'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma foto foi enviada.' });
    }
    const caminho = req.file.path;
    const query = 'INSERT INTO fotos (caminho) VALUES (?)';
    
    db.run(query, [caminho], (err) => {
        if (err) {
            console.error('Erro ao inserir foto:', err);  // Verifique o erro
            return res.status(500).send(err);
        }
        res.status(200).json({ message: 'Foto enviada com sucesso!', caminho });
    });
});

// Rota para buscar fotos
app.get('/fotos', (req, res) => {
  const query = 'SELECT * FROM fotos ORDER BY data_envio DESC';
  
  db.all(query, (err, rows) => {
      if (err) {
          console.error('Erro ao buscar fotos:', err);  // Verifique o erro
          return res.status(500).send(err);
      }
      res.status(200).json(rows);
  });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
