let ScrollOut = (function () {
  'use strict';

  function clamp(v, min, max) {
      return min > v ? min : max < v ? max : v;
  }
  function sign(x) {
      return (+(x > 0) - +(x < 0));
  }
  function round(n) {
      return Math.round(n * 10000) / 10000;
  }

  let cache = {};
  function replacer(match) {
      return '-' + match[0].toLowerCase();
  }
  function hyphenate(value) {
      return cache[value] || (cache[value] = value.replace(/([A-Z])/g, replacer));
  }

  /** find elements */
  function $(e, parent) {
      return !e || e.length === 0
          ? // null or empty string returns empty array
              []
          : e.nodeName
              ? // a single element is wrapped in an array
                  [e]
              : // selector and NodeList are converted to Element[]
                  [].slice.call(e[0].nodeName ? e : (parent || document.documentElement).querySelectorAll(e));
  }
  function setAttrs(el, attrs) {
      // tslint:disable-next-line:forin
      for (let key in attrs) {
          if (key.indexOf('_')) {
              el.setAttribute('data-' + hyphenate(key), attrs[key]);
          }
      }
  }
  function setProps(cssProps) {
      return function (el, props) {
          for (let key in props) {
              if (key.indexOf('_') && (cssProps === true || cssProps[key])) {
                  el.style.setProperty('--' + hyphenate(key), round(props[key]));
              }
          }
      };
  }

  let clearTask;
  let subscribers = [];
  function loop() {
      clearTask = 0;
      subscribers.slice().forEach(function (s2) { return s2(); });
      enqueue();
  }
  function enqueue() {
      if (!clearTask && subscribers.length) {
          clearTask = requestAnimationFrame(loop);
      }
  }
  function subscribe(fn) {
      subscribers.push(fn);
      enqueue();
      return function () {
          subscribers = subscribers.filter(function (s) { return s !== fn; });
          if (!subscribers.length && clearTask) {
              cancelAnimationFrame(clearTask);
              clearTask = 0;
          }
      };
  }

  function unwrap(value, el, ctx, doc) {
      return typeof value === 'function' ? value(el, ctx, doc) : value;
  }
  function noop() { }

  /**
   * Creates a new instance of ScrollOut that marks elements in the viewport with
   * an "in" class and marks elements outside of the viewport with an "out"
   */
  // tslint:disable-next-line:no-default-export
  function main (opts) {
      // Apply default options.
      opts = opts || {};
      // Debounce onChange/onHidden/onShown.
      let onChange = opts.onChange || noop;
      let onHidden = opts.onHidden || noop;
      let onShown = opts.onShown || noop;
      let onScroll = opts.onScroll || noop;
      let props = opts.cssProps ? setProps(opts.cssProps) : noop;
      let se = opts.scrollingElement;
      let container = se ? $(se)[0] : window;
      let doc = se ? $(se)[0] : document.documentElement;
      let rootChanged = false;
      let scrollingElementContext = {};
      let elementContextList = [];
      let clientOffsetX, clientOffsety;
      let sub;
      function index() {
          elementContextList = $(opts.targets || '[data-scroll]', $(opts.scope || doc)[0]).map(function (el) { return ({ element: el }); });
      }
      function update() {
          // Calculate position, direction and ratio.
          let clientWidth = doc.clientWidth;
          let clientHeight = doc.clientHeight;
          let scrollDirX = sign(-clientOffsetX + (clientOffsetX = doc.scrollLeft || window.pageXOffset));
          let scrollDirY = sign(-clientOffsety + (clientOffsety = doc.scrollTop || window.pageYOffset));
          let scrollPercentX = doc.scrollLeft / (doc.scrollWidth - clientWidth || 1);
          let scrollPercentY = doc.scrollTop / (doc.scrollHeight - clientHeight || 1);
          // Detect if the root context has changed.
          rootChanged =
              rootChanged ||
                  scrollingElementContext.scrollDirX !== scrollDirX ||
                  scrollingElementContext.scrollDirY !== scrollDirY ||
                  scrollingElementContext.scrollPercentX !== scrollPercentX ||
                  scrollingElementContext.scrollPercentY !== scrollPercentY;
          scrollingElementContext.scrollDirX = scrollDirX;
          scrollingElementContext.scrollDirY = scrollDirY;
          scrollingElementContext.scrollPercentX = scrollPercentX;
          scrollingElementContext.scrollPercentY = scrollPercentY;
          let childChanged = false;
          for (let index_1 = 0; index_1 < elementContextList.length; index_1++) {
              let ctx = elementContextList[index_1];
              let element = ctx.element;
              // find the distance from the element to the scrolling container
              let target = element;
              let offsetX = 0;
              let offsetY = 0;
              do {
                  offsetX += target.offsetLeft;
                  offsetY += target.offsetTop;
                  target = target.offsetParent;
              } while (target && target !== container);
              // Get element dimensions.
              let elementHeight = element.clientHeight || element.offsetHeight || 0;
              let elementWidth = element.clientWidth || element.offsetWidth || 0;
              // Find visible ratios for each element.
              let visibleX = (clamp(offsetX + elementWidth, clientOffsetX, clientOffsetX + clientWidth) -
                  clamp(offsetX, clientOffsetX, clientOffsetX + clientWidth)) /
                  elementWidth;
              let visibleY = (clamp(offsetY + elementHeight, clientOffsety, clientOffsety + clientHeight) -
                  clamp(offsetY, clientOffsety, clientOffsety + clientHeight)) /
                  elementHeight;
              let intersectX = visibleX === 1 ? 0 : sign(offsetX - clientOffsetX);
              let intersectY = visibleY === 1 ? 0 : sign(offsetY - clientOffsety);
              let viewportX = clamp((clientOffsetX - (elementWidth / 2 + offsetX - clientWidth / 2)) / (clientWidth / 2), -1, 1);
              let viewportY = clamp((clientOffsety - (elementHeight / 2 + offsetY - clientHeight / 2)) / (clientHeight / 2), -1, 1);
              let visible = void 0;
              if (opts.offset) {
                  visible = unwrap(opts.offset, element, ctx, doc) <= clientOffsety ? 1 : 0;
              }
              else if ((unwrap(opts.threshold, element, ctx, doc) || 0) < visibleX * visibleY) {
                  visible = 1;
              }
              else {
                  visible = 0;
              }
              let changedVisible = ctx.visible !== visible;
              let changed = ctx._changed ||
                  changedVisible ||
                  ctx.visibleX !== visibleX ||
                  ctx.visibleY !== visibleY ||
                  ctx.index !== index_1 ||
                  ctx.elementHeight !== elementHeight ||
                  ctx.elementWidth !== elementWidth ||
                  ctx.offsetX !== offsetX ||
                  ctx.offsetY !== offsetY ||
                  ctx.intersectX !== ctx.intersectX ||
                  ctx.intersectY !== ctx.intersectY ||
                  ctx.viewportX !== viewportX ||
                  ctx.viewportY !== viewportY;
              if (changed) {
                  childChanged = true;
                  ctx._changed = true;
                  ctx._visibleChanged = changedVisible;
                  ctx.visible = visible;
                  ctx.elementHeight = elementHeight;
                  ctx.elementWidth = elementWidth;
                  ctx.index = index_1;
                  ctx.offsetX = offsetX;
                  ctx.offsetY = offsetY;
                  ctx.visibleX = visibleX;
                  ctx.visibleY = visibleY;
                  ctx.intersectX = intersectX;
                  ctx.intersectY = intersectY;
                  ctx.viewportX = viewportX;
                  ctx.viewportY = viewportY;
                  ctx.visible = visible;
              }
          }
          if (!sub && (rootChanged || childChanged)) {
              sub = subscribe(render);
          }
      }
      function render() {
          maybeUnsubscribe();
          // Update root attributes if they have changed.
          if (rootChanged) {
              rootChanged = false;
              setAttrs(doc, {
                  scrollDirX: scrollingElementContext.scrollDirX,
                  scrollDirY: scrollingElementContext.scrollDirY
              });
              props(doc, scrollingElementContext);
              onScroll(doc, scrollingElementContext, elementContextList);
          }
          let len = elementContextList.length;
          for (let x = len - 1; x > -1; x--) {
              let ctx = elementContextList[x];
              let el = ctx.element;
              let visible = ctx.visible;
              if (ctx._changed) {
                  ctx._changed = false;
                  props(el, ctx);
              }
              if (ctx._visibleChanged) {
                  setAttrs(el, { scroll: visible ? 'in' : 'out' });
                  onChange(el, ctx, doc);
                  (visible ? onShown : onHidden)(el, ctx, doc);
              }
              // if this is shown multiple times, keep it in the list
              if (visible && opts.once) {
                  elementContextList.splice(x, 1);
              }
          }
      }
      function maybeUnsubscribe() {
          if (sub) {
              sub();
              sub = undefined;
          }
      }
      // Run initialize index.
      index();
      update();
      render();
      // Collapses sequential updates into a single update.
      let updateTaskId = 0;
      let onUpdate = function () {
          updateTaskId = updateTaskId || setTimeout(function () {
              updateTaskId = 0;
              update();
          }, 0);
      };
      // Hook up document listeners to automatically detect changes.
      window.addEventListener('resize', onUpdate);
      container.addEventListener('scroll', onUpdate);
      return {
          index: index,
          update: update,
          teardown: function () {
              maybeUnsubscribe();
              window.removeEventListener('resize', onUpdate);
              container.removeEventListener('scroll', onUpdate);
          }
      };
  }

  return main;

}());

//elementos afetados pelo scroll-out
ScrollOut({
    targets: 'h1,h2,h3,h4,h5,h6,.p-animacao'
});
