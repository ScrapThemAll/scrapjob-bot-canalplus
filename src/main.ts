var Rx = require('rxjs/Rx');
var request = require('request');
var cheerio = require('cheerio');
var io = require('socket.io')();
const port = process.env.PORT || 3000;
const timer = process.env.TIMER || 10800000;
const nbPage = process.env.NBPAGE || 3;

io.listen(port);

const baseUrl = 'http://www.vousmeritezcanalplus.com';

const getHtml = (url: string) => {
  return new Promise((res, rej) => {
    request(url, (err, response, html) => {
      if (err) return rej(err);
      res(html);
    })
  });
}

interface Poste {
  date: string,
  poste: string,
  link: string,
  header: string, 
  contrat: string,
  context: string,
  mission: string,
  profil: string,
  niveau: string,
  experience: string
}

const getBasicInfo = (html: string): Object => {
  var $ = cheerio.load(html);
  return $('li.offre_distribution').map((i, elem) => {
    const date = $(elem).children('.date').text();
    const poste = $(elem).children('.titre').text();
    var link = `${baseUrl}${$(elem).children('.lien_offre').attr('href')}`;
    return {date, poste, link};
  }).get();
}

const getDetailInfo = (data: [string, Object]): Object => {
  const $ = cheerio.load(data[0]);
  const header = $('div#offerHeader');
  const contrat = header.children('.offerHeaderBloc').children('.typeContrat');
  const duree = header.children('.offerHeaderBloc').next().children().next().first();
  const context = header.next().next();
  const mission = context.next().next();
  const profil = mission.next().next();
  const niveau = profil.next().next();
  const experience = niveau.next().next();

  return Object.assign(
    data[1], 
    {
      duree: duree.text(),
      contrat: contrat.text(),
      context: context.text(),
      mission: mission.text(),
      profil: profil.text(),
      niveau: niveau.text(),
      experience: experience.text()
    }
  );
}

const posteStream  = 
  Rx.Observable
    .interval(timer)
    .startWith(0)
    .concatMap(_ => Rx.Observable.range(0, nbPage))
    .flatMap(nb => nb !== 0 ? Rx.Observable.of(`?page=${nb+1}`) : Rx.Observable.of(''))
    .flatMap(nbPage => Rx.Observable.fromPromise(getHtml(`${baseUrl}/offres-d-emploi.html${nbPage}`)))
    .flatMap(getBasicInfo)
    .flatMap(poste => (
      Rx.Observable.forkJoin([
        Rx.Observable.fromPromise(getHtml(poste.link)),
        Rx.Observable.of(poste)
      ])
    ))
    .map(getDetailInfo);

posteStream.subscribe((data: Poste) => io.emit('poste', Object.assign(data, {entreprise: 'canalplus'})));