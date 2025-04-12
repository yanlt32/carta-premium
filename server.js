const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises; // Usando fs.promises para async
const app = express();
const port = process.env.PORT || 3000;

// Configuração do diretório de uploads e banco de dados (persistente no Render Disk)
const diskPath = '/opt/render/database'; // Caminho do Render Disk
const uploadDir = path.join(diskPath, 'uploads');
const dbPath = path.join(diskPath, 'database.db');

// Criação do diretório de uploads, caso não exista (async)
async function ensureUploadDir() {
    try {
        await fs.mkdir(uploadDir, { recursive: true });
        console.log('Diretório de uploads criado ou já existe:', uploadDir);
    } catch (err) {
        console.error('Erro ao criar diretório de uploads:', err);
    }
}
ensureUploadDir();

// Servindo arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// Configuração do SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite em:', dbPath);
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
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })); // Restringir em produção
app.use(express.json());

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
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const mimeType = fileTypes.test(file.mimetype);
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error('Erro: Apenas imagens (jpeg, jpg, png, gif) são suportadas.'));
    }
});

// Rota para página inicial (necessária para Render)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para enviar cartas
app.post('/enviar-carta', (req, res) => {
    const { titulo, conteudo } = req.body;
    if (!titulo || !conteudo) {
        return res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' });
    }

    const query = 'INSERT INTO cartas (titulo, conteudo) VALUES (?, ?)';
    db.run(query, [titulo, conteudo], function (err) {
        if (err) {
            console.error('Erro ao inserir carta:', err);
            return res.status(500).json({ message: 'Erro ao salvar carta.' });
        }
        res.status(200).json({ message: 'Carta enviada com sucesso!', id: this.lastID });
    });
});

// Rota para buscar cartas
app.get('/cartas', (req, res) => {
    const query = 'SELECT * FROM cartas ORDER BY data_envio DESC';
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar cartas:', err);
            return res.status(500).json({ message: 'Erro ao buscar cartas.' });
        }
        res.status(200).json(rows);
    });
});

// Rota para deletar carta
app.delete('/cartas/:id', (req, res) => {
    const cartaId = parseInt(req.params.id, 10);
    if (isNaN(cartaId)) {
        return res.status(400).json({ message: 'ID inválido.' });
    }

    db.get('SELECT * FROM cartas WHERE id = ?', [cartaId], (err, row) => {
        if (err) {
            console.error('Erro ao buscar carta:', err);
            return res.status(500).json({ message: 'Erro ao buscar carta.' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Carta não encontrada.' });
        }

        db.run('DELETE FROM cartas WHERE id = ?', [cartaId], function (err) {
            if (err) {
                console.error('Erro ao deletar carta:', err);
                return res.status(500).json({ message: 'Erro ao deletar carta.' });
            }
            res.json({ message: 'Carta deletada com sucesso!' });
        });
    });
});

// Rota para enviar foto
app.post('/enviar-foto', upload.single('foto'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma foto válida foi enviada.' });
    }
    const caminho = `/uploads/${req.file.filename}`; // Caminho relativo para o cliente
    const query = 'INSERT INTO fotos (caminho) VALUES (?)';

    db.run(query, [caminho], (err) => {
        if (err) {
            console.error('Erro ao inserir foto:', err);
            return res.status(500).json({ message: 'Erro ao salvar foto.' });
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
            return res.status(500).json({ message: 'Erro ao buscar fotos.' });
        }
        res.status(200).json(rows);
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err.message);
    res.status(500).json({ message: err.message || 'Algo deu errado no servidor.' });
});

// Fechar o banco de dados ao encerrar o processo
process.on('SIGTERM', () => {
    console.log('Encerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar banco de dados:', err);
            process.exit(1);
        }
        console.log('Banco de dados fechado.');
        process.exit(0);
    });
});

// Iniciar o servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});