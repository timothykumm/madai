import { Request, Response, NextFunction, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Agent, Configuration } from '../other/interfaces';
import multer from 'multer';
import { FileService } from '../service/file.service';
import { MadStream } from '../stream/mad.stream';
import { FileStream } from '../stream/file.stream';

export class MadController {
    public path = '/mad';
    public router = Router();
    public upload = multer({ dest: 'uploads/' }); // Temporäres Verzeichnis für Uploads
    public fileService = new FileService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path, this.startMad);
    }

    private startMad = async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Transfer-Encoding', 'chunked');

            this.upload.single('code')(req, res, async (err) => {
                if (err) {
                    return next(err);
                }

                if (!req.body.agents) {
                    return res.status(400).send('Keine Agenten definiert.');
                }

                if (!req.file) {
                    return res.status(400).send('Keine Datei hochgeladen.');
                }

                await this.fileService.checkSize(req.file).catch((err) => {
                    return res.status(400).send('Datei zu groß.');
                });

                const agents: Agent[] = JSON.parse(req.body.agents);
                const configuration: Configuration = {
                    apiKeys: { google: '', openAi: '' },
                    agents: agents,
                    rounds: 3,
                };

                const directoryPath = await this.fileService.extractZip(req.file);
                if (!directoryPath) {
                    return res.status(500).send('Zip konnte nicht entpackt werden.');
                }

                const directoryPathPrecheck = await this.fileService.directoryPathPrecheck(directoryPath);
                const fileStream: FileStream = new FileStream(directoryPathPrecheck);
                let lastText = false;

                fileStream.on('data', (fileChunkBuffer: BufferEncoding) => {
                    fileStream.pause();

                    const decodedFileChunkBuffer: { text: string; lastText: boolean } = JSON.parse(fileChunkBuffer.toString());
                    lastText = decodedFileChunkBuffer.lastText;

                    const madStream: MadStream = new MadStream(configuration, decodedFileChunkBuffer.text);

                    madStream.on('data', (madChunk: string | null) => {
                        res.write(madChunk);
                    });

                    madStream.on('end', () => {
                        fileStream.resume();

                        if (lastText) {
                            res.write('Debatte beendet!');
                            res.status(StatusCodes.OK).end();
                        }
                    });

                    madStream.on('error', (err: any) => {
                        console.error('Fehler im Stream:', err);
                        res.status(500).send('Interner Serverfehler');
                    });
                });

                fileStream.on('error', (err: any) => {
                    console.error('Fehler im Stream:', err);
                    res.status(500).send('Interner Serverfehler');
                });
            });
        } catch (error) {
            next(error);
        }
    };
}
