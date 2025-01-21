import { Readable } from 'stream';
import { FileService } from '../service/file.service';
import { CodePrecheck } from '../other/interfaces';

export class FileStream extends Readable {
    private fileService: FileService;
    private codePrecheck: CodePrecheck;
    private currentFileIndex = 0;

    constructor(codePrecheck: CodePrecheck) {
        super();
        this.fileService = new FileService();
        this.codePrecheck = codePrecheck;

        console.log(
            `Anzahl der zu überprüfenden Datein: ${codePrecheck.fileCount}\nAnzahl der zu überprüfenden Zeilen Code: ${codePrecheck.codeLineCount}\n`
        );
        console.log(codePrecheck.filePaths);
    }

    async _read() {
        if (this.currentFileIndex >= this.codePrecheck.fileCount) {
            this.push(null); // Ende des Streams
            return;
        }

        this.push(
            Buffer.from(
                JSON.stringify({
                    text: `${await this.fileService.readFile(this.codePrecheck.filePaths[this.currentFileIndex])}`,
                    lastText: this.currentFileIndex + 1 === this.codePrecheck.fileCount,
                })
            )
        );

        this.currentFileIndex++;
    }
}
