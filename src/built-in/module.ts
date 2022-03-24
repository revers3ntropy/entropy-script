import type { dict } from "../util/util";
import type { ESError } from "../errors";

export type NativeModule = dict<any>;
export type NativeModuleBuilder = (dependencies: dict<any>) => NativeModule | ESError;