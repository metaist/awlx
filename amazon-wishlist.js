var results = [];
var urls = [];

if (typeof jQuery=='undefined') {
  script = document.createElement( 'script' );
  script.src = 'https://code.jquery.com/jquery-3.2.1.min.js';
  script.onload=getTitles;
  document.body.appendChild(script);
} else {
  getTitles();
}


function parseCurrency(amount) { return parseFloat(amount.substr(1)) || 0; }

function getTitles() {
  results = $.makeArray($('[id^="itemInfo_"]').map(function (idx, dom) {
    var $dom = $(dom);
    var result = {
      name: $dom.find('[id^="itemName"]').text(),
      by: $dom.find('[id^="item-byline"]').text(),
      price: parseCurrency($dom.find('[id^="itemPrice"]').text()),
      audible: "",
      url: $dom.find('[id^="itemName"]').attr('href'),
    };

    urls.push({pos: idx, url: result.url});
    return result;
  }));

  checkAudible();
}

function checkAudible() {
  if (urls.length) {
    var item = urls.shift();
    getAudiblePrice(item.url, item.pos);
  } else { // print results
    console.log(results.map(function (item) {
      return '"' + [
        item.name + ' ' + item.by,
        item.price,
        item.audible,
        item.price + item.audible
      ].join('","') + '"';
    }).join("\n"));
  }//end if: chain fetching
}

var SEL_AUDIBLE = 'label[for="narration-checkbox"] .a-color-price';
function getAudiblePrice(url, pos) {
  jQuery.get(url).done(function (data) {
    console.log(pos, url);
    try {
      results[pos]['audible'] = parseCurrency($(data).find(SEL_AUDIBLE).text());
    } catch(e) {}
    checkAudible();
  });
}
