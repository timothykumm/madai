import unzipper from 'unzipper';
import { promises as fsPromises, createReadStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { CodePrecheck, MADLog } from '../other/interfaces';

export class FileService {
    private maxSize = 10 * 1024 * 1024; // 10 MB

    constructor() {}

    extractZip = async (file: Express.Multer.File) => {
        const uploadedFilePath = file.path;
        const extractionPath = path.join('uploads', path.parse(file.originalname).name);

        await fsPromises.mkdir(extractionPath, { recursive: true });

        try {
            await pipeline(createReadStream(uploadedFilePath), unzipper.Extract({ path: extractionPath }));

            await fsPromises.unlink(uploadedFilePath);
            console.log('Datei entpackt nach:', extractionPath);
            return extractionPath;
        } catch (err) {
            console.error('Fehler beim Entpacken der Zip Datei:', err);
        }
    };

    checkSize = async (file: Express.Multer.File) => {
        // Überprüfen, ob die Datei eine Zip-Datei ist und kleiner als 10 MB ist
        if (file.size > this.maxSize) {
            throw new Error('Die hochgeladene Datei ist größer als 10 MB.');
        }
    };

    directoryPathPrecheck = async (directoryPath: string): Promise<CodePrecheck> => {
        let fileCount = 0;
        let codeLineCount = 0;
        const filePaths: string[] = [];

        try {
            const files = await fsPromises.readdir(directoryPath, { withFileTypes: true });

            for (const file of files) {
                const filePath = path.join(directoryPath, file.name);

                if (file.isDirectory()) {
                    // Rekursiver Aufruf für Unterverzeichnisse
                    const subDirStats = await this.directoryPathPrecheck(filePath); // Korrektur hier
                    fileCount += subDirStats.fileCount;
                    codeLineCount += subDirStats.codeLineCount;
                    // Hinzufügen der Dateipfade aus dem Unterverzeichnis
                    filePaths.push(...subDirStats.filePaths); // Verwendung des Spread-Operators
                } else {
                    fileCount++;
                    filePaths.push(filePath);
                    const fileContent = await fsPromises.readFile(filePath, 'utf-8');
                    const lines = fileContent.split('\n'); // Zähle nur nicht-leere Zeilen
                    codeLineCount += lines.length;
                }
            }

            return { fileCount, codeLineCount, filePaths };
        } catch (err) {
            console.error('Fehler beim Vorabprüfen des Verzeichnisses:', err);
            throw err; // Fehler weiterwerfen
        }
    };

    readFile = async (filePath: string) => {
        try {
            const fileContent = await fsPromises.readFile(filePath, 'utf-8'); // oder anderes Encoding

            return fileContent;
        } catch (err) {
            console.error('Fehler beim Lesen der Dateien:', err);
            throw err; // Fehler weiterwerfen
        }
    };

    // Gneriert von Gemini
    saveMadLog = async (madLog: MADLog) => {
        try {
            const logsDir = path.join(process.cwd(), 'logs');
            await fsPromises.mkdir(logsDir, { recursive: true });

            // Generate a unique filename for the log file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logFileName = `madlog-${timestamp}.json`;
            const logFilePath = path.join(logsDir, logFileName);

            // Convert the MADLog object to a JSON string
            const logData = JSON.stringify(madLog, null, 2); // Use null, 2 for pretty-printing

            // Write the JSON string to the log file
            await fsPromises.writeFile(logFilePath, logData, 'utf-8');

            console.log(`MADLog saved to: ${logFilePath}`);
        } catch (err) {
            console.error('Error saving MADLog:', err);
            throw err;
        }
    };
}
