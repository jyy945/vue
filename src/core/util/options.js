/* @flow */

import { ASSET_TYPES, LIFECYCLE_HOOKS } from "shared/constants";

import { camelize, capitalize, extend, hasOwn, isBuiltInTag, isPlainObject, toRawType } from "shared/util";
import config from "../config";
import { set } from "../observer/index";
import { warn } from "./debug";
import { hasSymbol, nativeWatch } from "./env";
import { unicodeRegExp } from "./lang";

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
const strats = config.optionMergeStrategies;

// el和propsData的合并策略
if (process.env.NODE_ENV !== "production") {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        "creation with the `new` keyword."
      );
    }
    return defaultStrat(parent, child);
  };
}

/**
 * Helper that recursively merges two data objects together.
 */
// 合并两个data，
// 若第一个data不包含第二个中的属性，则使用set放入第一个data；
// 若二者的属性值为对象，且不相等，则递归
function mergeData(to: Object, from: ?Object): Object {
  if (!from) return to;
  let key, toVal, fromVal;

  const keys = hasSymbol
               ? Reflect.ownKeys(from)
               : Object.keys(from);

  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    // in case the object is already observed...
    if (key === "__ob__") continue;
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal);
    }
  }
  return to;
}

// 合并data数据
export function mergeDataOrFn(
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal;
    }
    if (!parentVal) {
      return childVal;
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn() {
      return mergeData(
        typeof childVal === "function" ? childVal.call(this, this) : childVal,
        typeof parentVal === "function" ? parentVal.call(this, this) : parentVal
      );
    };
  } else {
    return function mergedInstanceDataFn() {
      // instance merge
      const instanceData = typeof childVal === "function"
                           ? childVal.call(vm, vm)
                           : childVal;
      const defaultData = typeof parentVal === "function"
                          ? parentVal.call(vm, vm)
                          : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData);
      } else {
        return defaultData;
      }
    };
  }
}

// 合并data策略
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    if (childVal && typeof childVal !== "function") {
      process.env.NODE_ENV !== "production" && warn(
        "The \"data\" option should be a function " +
        "that returns a per-instance value in component " +
        "definitions.",
        vm
      );

      return parentVal;
    }
    return mergeDataOrFn(parentVal, childVal);
  }

  return mergeDataOrFn(parentVal, childVal, vm);
};

// 合并钩子函数，
// 将child钩子拼接到parent钩子中，此时[parentHook, childHook]
function mergeHook(
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal
              ? parentVal
                ? parentVal.concat(childVal)
                : Array.isArray(childVal)
                  ? childVal
                  : [childVal]
              : parentVal;
  return res
         ? dedupeHooks(res) // 钩子去重
         : res;
}

// 将相同的钩子函数去掉
function dedupeHooks(hooks) {
  const res = [];
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i]);
    }
  }
  return res;
}

// 设置合并生命周期函数策略
LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook;
});

//components、directives、filetersd的合并策略
// 直接将child的属性放到parent中，若存在相同则覆盖
function mergeAssets(
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null);
  if (childVal) {
    process.env.NODE_ENV !== "production" && assertObjectType(key, childVal, vm);
    return extend(res, childVal);
  } else {
    return res;
  }
}

// 设置components、directives、filetersd的合并策略
ASSET_TYPES.forEach(function (type) {
  strats[type + "s"] = mergeAssets;
});

// 合并watch
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) parentVal = undefined;
  if (childVal === nativeWatch) childVal = undefined;
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null);
  if (process.env.NODE_ENV !== "production") {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) return childVal;
  const ret = {};
  extend(ret, parentVal);
  for (const key in childVal) {
    let parent = ret[key];
    const child = childVal[key];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key] = parent
               ? parent.concat(child)
               : Array.isArray(child) ? child : [child];
  }
  return ret;
};


// 其他属性的合并策略
strats.props =
  strats.methods =
    strats.inject =
      strats.computed = function (
        parentVal: ?Object,
        childVal: ?Object,
        vm?: Component,
        key: string
      ): ?Object {
        if (childVal && process.env.NODE_ENV !== "production") {
          assertObjectType(key, childVal, vm);
        }
        if (!parentVal) return childVal;
        const ret = Object.create(null);
        extend(ret, parentVal);
        if (childVal) extend(ret, childVal);
        return ret;
      };
strats.provide = mergeDataOrFn;

// 默认的合并策略， childVal会覆盖parentVal
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
         ? parentVal
         : childVal;
};

// 校验components的合法性
function checkComponents(options: Object) {
  for (const key in options.components) {
    validateComponentName(key);
  }
}

// 检查组件名称的是否合法：以大小写字母开头，且不能为slot、component以及html、svg的标签名称
export function validateComponentName(name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      "Invalid component name: \"" + name + "\". Component names " +
      "should conform to valid custom element name in html5 specification."
    );
  }
  // 是否为slot、component或html、svg的标签名称
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      "Do not use built-in or reserved HTML elements as component " +
      "id: " + name
    );
  }
}

// 将props标准化，转换为:{props: {type: 类型名称}}，若props为数组，则类型名称为null
function normalizeProps(options: Object, vm: ?Component) {
  const props = options.props;
  if (!props) return;
  const res = {};
  let i, val, name;
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === "string") {
        name = camelize(val); // 将-连词符改为驼峰
        res[name] = {type: null};
      } else if (process.env.NODE_ENV !== "production") {
        warn("props must be strings when using array syntax.");
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key];
      name = camelize(key);
      res[name] = isPlainObject(val)
                  ? val
                  : {type: val};
    }
  } else if (process.env.NODE_ENV !== "production") {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    );
  }
  options.props = res;
}

// 将inject标准化，转换为:{inject名称: {from: inject值, .....}}
function normalizeInject(options: Object, vm: ?Component) {
  const inject = options.inject;
  if (!inject) return;
  const normalized = options.inject = {};
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = {from: inject[i]};
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key];
      normalized[key] = isPlainObject(val)
                        ? extend({from: key}, val)
                        : {from: val};
    }
  } else if (process.env.NODE_ENV !== "production") {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    );
  }
}

// 将局部directives标准化, 转换为{指令名称: {bind: fn, update, fn}}
function normalizeDirectives(options: Object) {
  const dirs = options.directives;
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key];
      if (typeof def === "function") {
        dirs[key] = {bind: def, update: def};
      }
    }
  }
}

// 断言对象类型
function assertObjectType(name: string, value: any, vm: ?Component) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    );
  }
}

// 合并两个options
export function mergeOptions(
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== "production") {
    checkComponents(child); // 检查组件名称的合法性
  }

  if (typeof child === "function") {
    child = child.options;
  }

  normalizeProps(child, vm);  // 将props标准化
  normalizeInject(child, vm); // 将inject标准化
  normalizeDirectives(child); // 将局部directives标准化

  // 对options中的extends和mixins属性进行合并
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm);
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm);
      }
    }
  }

  const options = {};
  let key;
  // 对parent中的属性进行合并，如果child中存在属性，则覆盖parent中的属性
  for (key in parent) {
    mergeField(key);
  }
  // 遍历child中的属性，若parent中不存在该属性，则合并之
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }

  // 合并字段
  function mergeField(key) {
    const strat = strats[key] || defaultStrat; // 获取合并策略
    options[key] = strat(parent[key], child[key], vm, key);
  }

  return options;
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
export function resolveAsset(
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== "string") {
    return;
  }
  const assets = options[type];
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id];
  const camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) return assets[camelizedId];
  const PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId];
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if (process.env.NODE_ENV !== "production" && warnMissing && !res) {
    warn(
      "Failed to resolve " + type.slice(0, -1) + ": " + id,
      options
    );
  }
  return res;
}
