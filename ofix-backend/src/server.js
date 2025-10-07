import app from './app.js';
// import 'dotenv/config'; // Carrega variáveis de ambiente do .env
import dotenv from 'dotenv';
dotenv.config();
const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(`🚀 OFIX Backend rodando na porta ${port}`);
});
