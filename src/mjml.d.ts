declare module 'mjml' {
    export interface MJMLParsingOptions {
        fonts?: { [key: string]: string };
        keepComments?: boolean;
        beautify?: boolean;
        minify?: boolean;
        validationLevel?: 'strict' | 'soft' | 'skip';
        filePath?: string;
    }

    export interface MJMLParseResults {
        html: string;
        errors: Array<{
            line: number;
            message: string;
            tagName: string;
            formattedMessage: string;
        }>;
    }

    export default function mjml2html(mjml: string, options?: MJMLParsingOptions): MJMLParseResults;
}
