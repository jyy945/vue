/* @flow */
/* globals MutationObserver */

import { noop } from "shared/util";
import { isIE, isIOS, isNative } from "./env";
import { handleError } from "./error";

export let isUsingMicroTask = false;  // 是否使用微任务

const callbacks = [];
let pending = false;

// 执行缓存的回调函数
function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  for (let i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

let timerFunc;

// 若存在支持promise，则使用promise微任务，否则使用MutationObserver，否则使用setImmediate，否则使用setTimeout
// 前两者为微任务，后两者为宏任务
if (typeof Promise !== "undefined" && isNative(Promise)) {
  const p = Promise.resolve();
  timerFunc = () => {
    p.then(flushCallbacks);

    if (isIOS) setTimeout(noop);
  };
  isUsingMicroTask = true;
} else if (!isIE && typeof MutationObserver !== "undefined" && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === "[object MutationObserverConstructor]"
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1;
  const observer = new MutationObserver(flushCallbacks);
  const textNode = document.createTextNode(String(counter));
  observer.observe(textNode, {
    characterData: true
  });
  timerFunc = () => {
    counter = (counter + 1) % 2;
    textNode.data = String(counter);
  };
  isUsingMicroTask = true;
} else if (typeof setImmediate !== "undefined" && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks);
  };
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0);
  };
}

export function nextTick(cb?: Function, ctx?: Object) {
  let _resolve;
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, "nextTick");
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    timerFunc();
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== "undefined") {
    return new Promise(resolve => {
      _resolve = resolve;
    });
  }
}
