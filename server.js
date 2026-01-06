const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir fitxers estàtics
app.use(express.static('public'));
app.use('/data', express.static('data'));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor executant-se a http://localhost:${PORT}`);
});
