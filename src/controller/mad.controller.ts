import { Request, Response, NextFunction, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Configuration, ExtendedAgentResponse, FileStreamResponse, MADLog, MADLogChunk } from '../other/interfaces';
import multer from 'multer';
import { FileService } from '../service/file.service';
import { MadStream } from '../stream/mad.stream';
import { FileStream } from '../stream/file.stream';
import { MadService } from '../service/mad.service';

export class MadController {
    public path = '/mad';
    public router = Router();
    public upload = multer({ dest: 'uploads/' }); // Temporäres Verzeichnis für Uploads
    public madService = new MadService();
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

                if (!req.body.configuration) {
                    return res.status(400).send('Keine Konfiguration ausgewählt.');
                }

                const configuration: Configuration = JSON.parse(req.body.configuration);
                if (!this.madService.checkConfiguration(configuration)) {
                    return res.status(400).send('Konfiguration fehlerhaft.');
                }

                if (!req.file) {
                    return res.status(400).send('Keine Datei hochgeladen.');
                }

                await this.fileService.checkSize(req.file).catch((err) => {
                    return res.status(400).send('Datei zu groß.');
                });

                const directoryPath = await this.fileService.extractZip(req.file);
                if (!directoryPath) {
                    return res.status(500).send('Zip konnte nicht entpackt werden.');
                }

                const directoryPathPrecheck = await this.fileService.directoryPathPrecheck(directoryPath);
                const timestamp = Date.now();
                const madLogChunk: MADLogChunk[] = directoryPathPrecheck.filePaths.flatMap((filePath) => ({ filePath, discussion: [] }));

                const fileStream: FileStream = new FileStream(directoryPathPrecheck);
                let isLastText = false;

                fileStream.on('data', (encodedFileStreamResponse: BufferEncoding) => {
                    fileStream.pause();

                    const fileStreamResponse: FileStreamResponse = JSON.parse(encodedFileStreamResponse.toString());
                    isLastText = fileStreamResponse.isLastText;

                    const madStream: MadStream = new MadStream(configuration, fileStreamResponse);

                    madStream.on('data', (encodedExtendedAgentResponse: BufferEncoding) => {
                        const extendedAgentResponse: ExtendedAgentResponse = JSON.parse(encodedExtendedAgentResponse.toString());

                        const entryDiscussion = madLogChunk.find((chunk) => chunk.filePath === fileStreamResponse.path);

                        if (entryDiscussion) {
                            const discussionRound = entryDiscussion.discussion.find((discussion) => discussion.round === extendedAgentResponse.round);

                            if (discussionRound) {
                                discussionRound.agentResponses.push(extendedAgentResponse.agentResponse);
                            } else {
                                entryDiscussion.discussion.push({
                                    round: extendedAgentResponse.round,
                                    agentResponses: [extendedAgentResponse.agentResponse],
                                });
                            }
                        } else {
                            console.error('Dateipfad existiert nicht in dem Log');
                        }

                        res.write(`${encodedExtendedAgentResponse.toString()}`);
                    });

                    madStream.on('end', () => {
                        fileStream.resume();

                        if (isLastText) {
                            const madLog: MADLog = {
                                timestamp,
                                fileCount: directoryPathPrecheck.fileCount,
                                codeLineCount: directoryPathPrecheck.codeLineCount,
                                configuration,
                                madLogChunk,
                            };
                            this.fileService.saveMadLog(madLog);
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
