((window) => {
  'use strict';

  var app = { VERSION: '1.0.0-pre' };

  // Match the Amazon ID in a URL.
  app.REGEX_ASIN = /dp\/(.*)\//;

  // URL to latest minified jQuery.
  app.URL_JQUERY = 'https://code.jquery.com/jquery-3.2.1.min.js';

  // Default configuration.
  app.config = {
    scrollWait: 600 // ms to wait between scrolls
  };

  // Initialize and run the app.
  app.init = () => {
    app.scroll
    .then(app.getBooks)
    .then(books => { return Promise.all(books.map(app.getAudible)) })
    .then(app.renderCSV)
    .then(console.log);
  };

  /**
    Helper function that scrolls to the bottom of the page.
    @return number - position of the scrollbar before scrolling (from 0 to 1)
  */
  app.scrollToBottom = () => {
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

  // Promise that continues to scroll down until it's definitely at the bottom.
  app.scroll = new Promise((resolve, reject) => {
    app.scrollToBottom();
    var timer = window.setInterval(() => {
      if (app.scrollToBottom() >= 1) {
        window.clearInterval(timer);
        timer = false;
        resolve();
      }
    }, app.config.scrollWait);
  });

  /**
    Convert a string containing a dollar amount into a float.
    @param amount {string} - item to parse
    @return {float} - dollars as a float (or zero if parsing fails)
  */
  app.parseCurrency = (amount) => parseFloat(amount.substr(1), 10) || 0;

  /**
    Extract the titles from the page.

    @return {array[object]} - extracted book information
  */
  app.getBooks = () => {
    return $.makeArray($('[id^="itemInfo_"]').map((idx, dom) => {
      var $dom = $(dom);
      var url = $dom.find('[id^="itemName"]').attr('href');
      var book = {
        pos: idx,
        asin: app.REGEX_ASIN.exec(url)[1],
        name: $dom.find('[id^="itemName"]').text(),
        by: $dom.find('[id^="item-byline"]').text(),
        price: app.parseCurrency($dom.find('[id^="itemPrice"]').text()),
        audible: '',
        url: url
      };

      return book;
    }));
  };

  /**
    Get the price of an audible book, if available.
    @param book {object} - item to lookup
    @return {Promise} - resolves when the page is visited
  */
  app.getAudible = (book) => {
    return new Promise((resolve, reject) => {
      $.get(book.url).done(function (html) {
        book.audible = app.parseCurrency(
          $(html)
            .find('label[for="narration-checkbox"] .a-color-price')
            .text()
        );

        resolve(book);
      });
    });
  };

  /**
    Convert an array of books into a CSV string.
    @param books {array[object]} - items to render
    @return {string} - CSV containing book information
  */
  app.renderCSV = (books) => {
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
    tag.setAttribute('src', app.URL_JQUERY);
    tag.setAttribute('crossorigin', 'anonymous');
    if(onload) { tag.onload = app.init; }
    document.body.appendChild(tag);
  } else {
    app.init();
  }//end if: script injected

  window.awlx = app; // exposed globally
})(window);
