import express, { Express, Request, Response } from 'express';
import { MadController } from './controller/mad.controller';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use('/api', new MadController().router);

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
