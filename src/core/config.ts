import * as _ from '../files/file-utils';

export class Config{

    constructor(){}

    public static readCfg(path: string, encoding: string = 'utf-8'){
        const cfgFileExists = _.existsSync(path);
        if (!cfgFileExists) {
            throw new Error("文件不存在或读取失败。");
        }
        const fileContent = _.readFileSync(path, encoding);
        return JSON.parse(fileContent.toString());
    }

    public static witerCfg(path: string, content: string | Buffer, encoding: string = 'utf-8'){
        const cfgFileExists = _.existsSync(path);
        if (!cfgFileExists) {
            throw new Error("文件不存在或读取失败。");
        }
        if (typeof content === 'string') {
            content = new Buffer(content, encoding);
        }
        _.writeFileSync(path, content, encoding);
    }

    public static appendCfg(path: string, content: string | Buffer){}
}