import app from './app';
import dotenv from 'dotenv';

dotenv.config();
const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
