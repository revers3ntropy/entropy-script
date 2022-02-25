import * as es from '../../build/index';

(async () => {

    const initRes = await es.init(
        console.log,
        (msg, cb) => cb(prompt()),
        false, {
            print: console.log
        }
    );

    if (initRes) {
        console.log(initRes.str);
    }

    let scripts = document.querySelectorAll('script[type=es]');

    const scriptTexts = [];

    for (const s of scripts) {
        const url = s.getAttribute('src');
        let text;
        if (url) {
            text = await (await (fetch(url))).text();
        } else {
            text = s.innerText;
        }
        scriptTexts.push(text);
    }

    let i = 0;
    for (const text of scriptTexts) {
        const res = es.run(text, {
            fileName: scripts[i].getAttribute('src') || 'inlineES'
        });
        if (res.error) {
            document.getElementById('error').innerHTML = res.error.str;
        }
        i++;
    }
})();