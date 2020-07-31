/* @flow */

import { observe } from "core/observer/index";
import { ASSET_TYPES } from "shared/constants";
import builtInComponents from "../components/index";
import config from "../config";
import { del, set } from "../observer/index";

import { defineReactive, extend, mergeOptions, nextTick, warn } from "../util/index";
import { initAssetRegisters } from "./assets";
import { initExtend } from "./extend";
import { initMixin } from "./mixin";
import { initUse } from "./use";

// 安装全局api
export function initGlobalAPI(Vue: GlobalAPI) {
  // 设置vue的config属性，值为config文件中的数据
  const configDef = {};
  configDef.get = () => config;
  if (process.env.NODE_ENV !== "production") {
    configDef.set = () => {
      warn(
        "Do not replace the Vue.config object, set individual fields instead."
      );
    };
  }
  Object.defineProperty(Vue, "config", configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj);
    return obj;
  };

  Vue.options = Object.create(null);  // 创建options
  // 创建options中'component','directive','filter'的默认值
  ASSET_TYPES.forEach(type => {
    Vue.options[type + "s"] = Object.create(null);
  });

  Vue.options._base = Vue;  // 设置基类

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}
