/* @flow */
// 空对象，不可编辑
export const emptyObject = Object.freeze({})

// 是否为undefined或null
export function isUndef (v: any): boolean %checks {
  return v === undefined || v === null
}

// 是否不为undefined和null
export function isDef (v: any): boolean %checks {
  return v !== undefined && v !== null
}

// 为真
export function isTrue (v: any): boolean %checks {
  return v === true
}

//为假
export function isFalse (v: any): boolean %checks {
  return v === false
}

// 是否为基本数据类型
export function isPrimitive (value: any): boolean %checks {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

// 快速检测是否为对象
export function isObject (obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object'
}

// toString的简写方法
const _toString = Object.prototype.toString

// 获取真实的原始类型，例如function的类型，使用toString后为 [object Function]，截取后为Function
export function toRawType (value: any): string {
  return _toString.call(value).slice(8, -1)
}


// 是否js中的纯对象
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}

// 是否为正则对象
export function isRegExp (v: any): boolean {
  return _toString.call(v) === '[object RegExp]'
}

// 是否为有效的数组索引
export function isValidArrayIndex (val: any): boolean {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

// 判断是否为promise对象
export function isPromise (val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

// 将val转换为字符串
export function toString (val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

// 转换为数字
export function toNumber (val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

// 创建一个map，用来检查是否有key存在
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}

// 检查名称是否为slot或component
export const isBuiltInTag = makeMap('slot,component', true)

// 检查名称是否为key、ref、slot、slot-scope、js
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

// 移除数组中的某个值
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

// hasOwnProperty简写
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}

// 缓存代理模式，可以按照方法对计算过的结果进行缓存，用于函数。这个方法非常好，是缓存代理的构造器
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str] // 若已经缓存过该方法，则shi
    return hit || (cache[str] = fn(str))
  }: any)
}

// 将-连字符形式转换为驼峰，可缓存
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

// 将首字母大写，可缓存
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

// 将单词转换为以-为连字符的单词，如abcd => a-b-c-d
const hyphenateRE = /\B([A-Z])/g
// 将第一个字母之后的所有的字母替换为-连字符，例如：abcd => a-b-c-d
export const hyphenate = cached((str: string): string => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

/**
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 */

/* istanbul ignore next */
function polyfillBind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

function nativeBind (fn: Function, ctx: Object): Function {
  return fn.bind(ctx)
}

// 本地bind
export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind

// 将类数组转换为数组
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

// 将对象属性复制到目标对象
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

// 将对象数组转换为一个对象
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/* eslint-disable no-unused-vars */

// 不执行任何操作
export function noop (a?: any, b?: any, c?: any) {}

// 返回false
export const no = (a?: any, b?: any, c?: any) => false


// 返回相同值，TODO不理解作用
export const identity = (_: any) => _

/**
 * 从编译器模块生成包含静态键的字符串。例如：[{staticKeys: "1"},{staticKeys: "2"}] => "1,2"
 */
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

//检查两个值是否大致相等
export function looseEqual (a: any, b: any): boolean {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

// 查看某个值是否和数组中的某个值宽松相等
export function looseIndexOf (arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

// 仅执行一次函数
export function once (fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}
