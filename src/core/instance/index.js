import { warn } from "../util/index";
import { eventsMixin } from "./events";
import { initMixin } from "./init";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";
import { stateMixin } from "./state";

function Vue(options) {
  if (process.env.NODE_ENV !== "production" &&
    !(this instanceof Vue)
  ) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options);
}

initMixin(Vue);  // 混入init
stateMixin(Vue); // 混入状态
eventsMixin(Vue);  // 混入事件系统
lifecycleMixin(Vue);   // 混入生命周期系统
renderMixin(Vue);  // 混入渲染系统

export default Vue;
