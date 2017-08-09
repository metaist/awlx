((window, $) => {
  'use strict';

  // URL to latest minified jQuery.
  var URL_JQUERY = 'https://code.jquery.com/jquery-3.2.1.min.js';

  // Match the Amazon ID in a URL.
  var REGEX_ASIN = /dp\/(.*)\//;

  var parseCurrency = (amount) => {
    return parseFloat(amount.substr(1), 10) || 0
  };

  var scrollToBottom = () => {
    var maxY = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ) - window.innerHeight;

    var result = (window.scrollY / maxY); // get previous scroll

    if (window.scrollY < maxY) { window.scroll(0, maxY); }
    return result;
  };

  getAudiblePrice = (html) => {
    return parseCurrency(
      $(html)
        .find('label[for="narration-checkbox"] .a-color-price')
        .text()
    );
  };

  var app = {
    version: '1.0.0',
    config: {
      scrollWait: 400 // ms to wait between scrolls
    }
  };

  app.init = () => {
    app.scroll
    .then(app.getBooks)
    .then(books => { return Promise.all(books.map(app.lookupAudible)) })
    .then(app.csv)
    .then(console.log);
  };

  app.scroll = new Promise((resolve, reject) => {
    scrollToBottom();
    var timer = window.setInterval(() => {
      if (scrollToBottom() >= 1) {
        window.clearInterval(timer);
        timer = false;
        resolve();
      }
    }, app.config.scrollWait);
  });

  app.getBooks = () => {
    return $.makeArray($('[id^="itemInfo_"]').map((idx, dom) => {
      var $dom = $(dom);
      var url = $dom.find('[id^="itemName"]').attr('href');
      var book = {
        pos: idx,
        asin: REGEX_ASIN.exec(url)[1],
        name: $dom.find('[id^="itemName"]').text(),
        by: $dom.find('[id^="item-byline"]').text(),
        price: parseCurrency($dom.find('[id^="itemPrice"]').text()),
        audible: '',
        url: url
      };

      return book;
    }));
  };

  app.lookupAudible = (book) => {
    return new Promise((resolve, reject) => {
      $.get(book.url).done(function (data) {
        book.audible = getAudiblePrice(data);
        resolve(book);
      });
    });
  };

  app.csv = (books) => {
    return (
      'ASIN,Title,Price,Audible,Total\n' +
      books.map(book => {
        return '"' + [
          book.asin,
          book.name + ' ' + book.by,
          book.price,
          book.audible,
          (book.price + book.audible).toFixed(2)
        ].join('","') + '"';
      }).join("\n")
    );
  };

  if(typeof jQuery === 'undefined') {
    var tag = document.createElement('script');
    tag.setAttribute('src', URL_JQUERY);
    tag.setAttribute('crossorigin', 'anonymous');
    if(onload) { tag.onload = app.init; }
    document.body.appendChild(tag);
  } else {
    app.init();
  }//end if: script injected


  window.app = app;
})(window, jQuery);
