const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000; // Porta dinâmica para Render

// Criação do diretório uploads, caso não exista
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Servindo arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

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

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer para upload de fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Verificação do tipo de arquivo para permitir apenas imagens
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const mimeType = fileTypes.test(file.mimetype);
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extName) {
            return cb(null, true);
        }
        cb('Erro: Arquivo não suportado.');
    }
});

// Rota para página inicial (necessário pro Render não dar 404)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para enviar cartas
app.post('/enviar-carta', (req, res) => {
    const { titulo, conteudo } = req.body;

    const query = 'INSERT INTO cartas (titulo, conteudo) VALUES (?, ?)';
    db.run(query, [titulo, conteudo], function(err) {
        if (err) {
            console.error('Erro ao inserir carta:', err);
            return res.status(500).send(err);
        }
        res.status(200).send('Carta enviada com sucesso!');
    });
});

// Rota para buscar cartas
app.get('/cartas', (req, res) => {
    const query = 'SELECT * FROM cartas ORDER BY data_envio DESC';
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar cartas:', err);
            return res.status(500).send(err);
        }
        res.status(200).json(rows);
    });
});

// Rota para deletar carta
app.delete('/cartas/:id', (req, res) => {
    const cartaId = parseInt(req.params.id, 10);

    db.get('SELECT * FROM cartas WHERE id = ?', [cartaId], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao buscar carta: ' + err.message });
        }
        if (!row) {
            return res.status(404).json({ success: false, message: 'Carta não encontrada.' });
        }

        db.run('DELETE FROM cartas WHERE id = ?', [cartaId], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Erro ao deletar carta: ' + err.message });
            }
            res.json({ success: true, message: 'Carta deletada com sucesso!' });
        });
    });
});

// Rota para enviar foto
app.post('/enviar-foto', upload.single('foto'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma foto foi enviada.' });
    }
    const caminho = req.file.path;
    const query = 'INSERT INTO fotos (caminho) VALUES (?)';

    db.run(query, [caminho], (err) => {
        if (err) {
            console.error('Erro ao inserir foto:', err);
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
            console.error('Erro ao buscar fotos:', err);
            return res.status(500).send(err);
        }
        res.status(200).json(rows);
    });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
