import { Readable } from 'stream';
import { FileService } from '../service/file.service';
import { CodePrecheck, FileStreamResponse } from '../other/interfaces';

export class FileStream extends Readable {
    private fileService: FileService;
    private codePrecheck: CodePrecheck;
    private currentFileIndex = 0;

    constructor(codePrecheck: CodePrecheck) {
        super();
        this.fileService = new FileService();
        this.codePrecheck = codePrecheck;
    }

    async _read() {
        if (this.currentFileIndex >= this.codePrecheck.fileCount) {
            this.push(null); // Ende des Streams
            return;
        }

        const fileStreamResponse: FileStreamResponse = {
            path: this.codePrecheck.filePaths[this.currentFileIndex],
            text: `${await this.fileService.readFile(this.codePrecheck.filePaths[this.currentFileIndex])}`,
            isLastText: this.currentFileIndex + 1 === this.codePrecheck.fileCount,
        };

        const output = JSON.stringify(fileStreamResponse);
        const outputBuffer = Buffer.from(output);

        this.push(outputBuffer);

        this.currentFileIndex++;
    }
}
