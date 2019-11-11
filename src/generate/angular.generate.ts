import { GenerateCore } from "./generate.core";
import { join } from 'path';

export class AngularGenerate extends GenerateCore {

    initProjectAllFolder(){
        const { srcPath } = super.initProjectAllFolder();
        this.mkdir(join(srcPath, 'app'));
        this.mkdir(join(srcPath, 'styles'));
        this.mkdir(join(srcPath, 'testing'));
        this.mkdir(join(srcPath, 'webassets'));
        return {};
    }
}