import express, { Express, Request, Response } from 'express';
import { MadController } from './controller/mad.controller';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

//app.use(bodyParser.json()); // Parse JSON request bodies
//app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', new MadController().router); // mount controller's routes under /api
// app.use(errorHandler); // error handler middleware

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
