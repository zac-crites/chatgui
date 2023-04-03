/// <reference types="react-scripts" />

declare var uuid : { v4 : any };

declare module "uuid" {
    export = uuid;
}