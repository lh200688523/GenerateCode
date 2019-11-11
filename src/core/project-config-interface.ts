import { ProjectType } from "./enums";
/**
 * 项目属性
 */
export interface IProjectConfig {
    //项目名称
    name: string;
    //项目版本
    version: string;
    //项目描述
    description: string;
    //项目路径
    storagePath: string;
    //项目类型
    projectType: ProjectType;
}