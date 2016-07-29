var Rx = require('rxjs/Rx');
var request = require('request');
var cheerio = require('cheerio');

const getHtml = () => {
  return new Promise((res, rej) => {
    request('http://www.vousmeritezcanalplus.com/offres-d-emploi.html', (err, response, html) => {
      if (err) return rej(err);
      res(html);
    })
  });
}

Rx.Observable.fromPromise(getHtml())
  .subscribe(html => {
    var $ = cheerio.load(html);
    var a = $('li.offre_distribution').map((i, elem) => {
      const date = $(elem).children('.date').text();
      const poste = $(elem).children('.titre').text();
      console.log(date, poste);
      return {date, poste};
    }).get();

    console.log(a);
  });