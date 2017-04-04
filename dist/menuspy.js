/*! MenuSpy v1.0.1 (Apr 04 2017) - http://leocs.me/menuspy/ - Copyright (c) 2017 Leonardo Santos; MIT License */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.MenuSpy = factory());
}(this, (function () { 'use strict';

var utils = {
  extend: function extend(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }

    return a;
  },

  offset: function offset(el) {
    var rect = el.getBoundingClientRect();

    return {
      top: rect.top + document.body.scrollTop,
      left: rect.left + document.body.scrollLeft
    };
  },

  scrollTop: function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop;
  },

  addClass: function addClass(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else {
      var classes = el.className.split(' ');
      var existingIndex = classes.indexOf(className);

      if (existingIndex === -1) {
        classes.push(className);
      }

      el.className = classes.join(' ');
    }
  },

  removeClass: function removeClass(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp(("(^|\\b)" + (className.split(' ').join('|')) + "(\\b|$)"), 'gi'), ' ');
    }
  },

  debounce: function debounce(fn, delay) {
    var timeout = null;
    return function() {
      var args = arguments;
      var context = this;
      if (!timeout) {
        timeout = setTimeout(function () {
          timeout = 0;
          return fn.apply(context, args);
        }, delay);
      }
    };
  }
};

var MenuSpy = function MenuSpy(element, options) {
  var this$1 = this;

  if (!element) {
    return;
  }

  var defaults = {
    menuItemSelector: 'a[href^="#"]',
    activeClass   : 'active',
    threshold     : 15,
    hashTimeout   : 600,
    callback      : null
  };

  this.element = element;
  this.options = utils.extend(defaults, options);

  this.assignValues();
  window.addEventListener('resize', utils.debounce(function () { return this$1.assignValues(); }));

  this.debouncedHashFn = utils.debounce(function (state, push) {
    if (history.replaceState) {
      if (push) {
        history.pushState(state, null, ("#" + (this$1.lastId)));
      } else {
        history.replaceState(state, null, ("#" + (this$1.lastId)));
      }
    } else {
      var st = utils.scrollTop();
      window.location.hash = this$1.lastId;
      window.scrollTo(0, st);
    }
  }, this.options.hashTimeout);

  this.cacheItems();
  this.scrollFn();
};

MenuSpy.prototype.assignValues = function assignValues () {
  this.currScrollTop = 0;
  this.lastId = '';
  this.menuHeight = this.element.offsetHeight + this.options.threshold;
  this.menuItems = [].slice.call(this.element.querySelectorAll(this.options.menuItemSelector));
};

MenuSpy.prototype.cacheItems = function cacheItems () {
  this.scrollItems = this.menuItems.map(function (a) {
    var elm = document.getElementById(a.getAttribute('href').slice(1));
    if (elm) {
      var offset = utils.offset(elm).top;
      return { elm: elm, offset: offset };
    }
    console.warn('MenuSpy warning: %s not found on page.', a.href); // eslint-disable-line no-console
    return undefined;
  });
  this.scrollItems = this.scrollItems.filter( Boolean );
};

MenuSpy.prototype.tick = function tick () {
  var fromTop = this.currScrollTop + this.menuHeight;
  var inViewElms = this.scrollItems
    .filter(function (item) { return item.offset < fromTop; })
    .map(function (item) { return item.elm; });

  this.activateItem(inViewElms.pop());
};

MenuSpy.prototype.activateItem = function activateItem (inViewElm) {
    var this$1 = this;

  var id = inViewElm ? inViewElm.id : '';
  var activeClass = this.options.activeClass;
  var callback = this.options.callback;

  if (this.lastId !== id) {
    this.lastId = id;

    this.menuItems.forEach(function (item) {
      utils.removeClass(item.parentNode, activeClass);

      if (item.getAttribute('href') === ("#" + id)) {
        utils.addClass(item.parentNode, activeClass);

        var state = null;
        if (typeof callback === 'function') {
          state = callback.call(this$1, item, inViewElm);
          if (state === false) {
            return;
          }
        }

        var data = state;
        var push = false;
        if (state && state.data) {
          data = state.data;
          push = state.push;
        }
        this$1.debouncedHashFn(data, push);
      }
    });
  }
};

MenuSpy.prototype.scrollFn = function scrollFn () {
  var st = utils.scrollTop();

  if (this.currScrollTop !== st) {
    this.currScrollTop = st;
    this.tick();
  }

  window.requestAnimationFrame(this.scrollFn.bind(this));
};

return MenuSpy;

})));
