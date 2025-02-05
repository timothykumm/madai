import unzipper from 'unzipper';
import { promises as fsPromises, createReadStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { CodePrecheck, MADLog } from '../other/interfaces';

/**
 * Die gesamte Klasse wurde von ChatGPT generiert und angepasst.
 */
export class FileService {
    private maxSize = 10 * 1024 * 1024; // 10 MB

    constructor() {}

    /**
     * Extrahiert den Inhalt einer ZIP-Datei in ein angegebenes Verzeichnis.
     *
     * @param {Express.Multer.File} file - Das hochgeladene Dateiobjekt, das die zu extrahierende ZIP-Datei enthält.
     * @returns {Promise<string>} - Eine Promise, das den Pfad der extrahierten Dateien zurückgibt.
     * @throws {Error} - Wirft einen Fehler, wenn der Extraktionsprozess fehlschlägt.
     *
     * @example
     * const extractionPath = await extractZip(file);
     * console.log('Dateien extrahiert nach:', extractionPath);
     */
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
            throw err;
        }
    };

    /**
     * Überprüft, ob die hochgeladene Datei die maximal zulässige Größe überschreitet.
     *
     * @param file - Die hochgeladene Datei, die überprüft werden soll.
     * @throws {Error} Wenn die Dateigröße die maximal zulässige Größe von 10 MB überschreitet.
     */
    checkSize = async (file: Express.Multer.File) => {
        if (file.size > this.maxSize) {
            throw new Error('Die hochgeladene Datei ist größer als 10 MB.');
        }
    };

    /**
     * Überprüft ein Verzeichnis, um Informationen über die darin enthaltenen Dateien und Codezeilen zu sammeln.
     * Diese Funktion durchläuft rekursiv das Verzeichnis und seine Unterverzeichnisse, um die Anzahl der Dateien,
     * die Gesamtzahl der Codezeilen und die Pfade aller Dateien zu zählen.
     *
     * @param directoryPath - Der Pfad des zu überprüfenden Verzeichnisses.
     * @returns Eine Prmoise, das ein Objekt mit der Anzahl der Dateien, der Anzahl der Codezeilen und den Dateipfaden zurückgibt.
     * @throws Wirft einen Fehler, wenn es ein Problem beim Lesen des Verzeichnisses oder seiner Dateien gibt.
     */
    directoryPathPrecheck = async (directoryPath: string): Promise<CodePrecheck> => {
        let fileCount = 0;
        let codeLineCount = 0;
        const filePaths: string[] = [];

        try {
            const files = await fsPromises.readdir(directoryPath, { withFileTypes: true });

            for (const file of files) {
                const filePath = path.join(directoryPath, file.name);

                if (file.isDirectory()) {
                    const subDirStats = await this.directoryPathPrecheck(filePath);
                    fileCount += subDirStats.fileCount;
                    codeLineCount += subDirStats.codeLineCount;

                    filePaths.push(...subDirStats.filePaths);
                } else {
                    fileCount++;
                    filePaths.push(filePath);
                    const fileContent = await fsPromises.readFile(filePath, 'utf-8');
                    const lines = fileContent.split('\n');
                    codeLineCount += lines.length;
                }
            }

            return { fileCount, codeLineCount, filePaths };
        } catch (err) {
            console.error('Fehler beim Vorabprüfen des Verzeichnisses:', err);
            throw err;
        }
    };

    /**
     * Liest asynchron den Inhalt einer Datei an dem angegebenen Dateipfad.
     *
     * @param filePath - Der Pfad zu der Datei, die gelesen werden soll.
     * @returns Eine Promise, die den Inhalt der Datei als String zurückgibt.
     * @throws Wirft einen Fehler, wenn es ein Problem beim Lesen der Datei gibt.
     */
    readFile = async (filePath: string) => {
        try {
            const fileContent = await fsPromises.readFile(filePath, 'utf-8');

            return fileContent;
        } catch (err) {
            console.error('Fehler beim Lesen der Datei:', err);
            throw err;
        }
    };

    /**
     * Speichert ein MADLog-Objekt in einer JSON-Datei im Verzeichnis "logs".
     * Die Protokolldatei wird mit einem Zeitstempel benannt, um die Einzigartigkeit zu gewährleisten.
     *
     * @param {MADLog} madLog - Das zu speichernde MADLog-Objekt.
     * @returns {Promise<void>} - Eine Promise, die aufgelöst wird, wenn das Protokoll erfolgreich gespeichert wurde.
     * @throws {Error} - Wirft einen Fehler, wenn es ein Problem beim Erstellen des Verzeichnisses oder beim Schreiben der Datei gibt.
     */
    saveMadLog = async (madLog: MADLog) => {
        try {
            const logsDir = path.join(process.cwd(), 'logs');
            await fsPromises.mkdir(logsDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logFileName = `madlog-${timestamp}.json`;
            const logFilePath = path.join(logsDir, logFileName);

            const logData = JSON.stringify(madLog, null, 2); // Verwende null, 2 für Pretty-Printing

            await fsPromises.writeFile(logFilePath, logData, 'utf-8');

            console.log(`MADLog gespeichert unter: ${logFilePath}`);
        } catch (err) {
            console.error('Fehler beim Speichern des MADLog:', err);
            throw err;
        }
    };
}
