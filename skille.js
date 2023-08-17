class Skills {
    static allProfs = ['dr', 'mo', 'vd', 'sh', 'rc', 'br', 'uk']

    static init() {
        document.getElementById('inpskillpoints').onchange = Skills.refreshPoints;
        document.getElementById('skilltreescrollb1').onclick = () => Skills.scroll(1, 2);
        document.getElementById('skilltreescrollb2').onclick = () => Skills.scroll(2, 1);

        Skills.makeSkills('dr');
        Skills.makeProfs();

        Skills.refreshPoints()
    }

    static makeSkill(imgname, lvls = 21) {
        let div = document.createElement('div');
        let img = document.createElement('img');
        div.setAttribute('value', imgname)

        div.appendChild(img);

        let chars = "uam";
        let counter = 0;
        for (let t = 0; t < 3; t++) {
            let line = document.createElement('div');
            for (let l = 1; l <= 7; l++) {
                if (counter++ >= lvls)
                    break;
                let label = document.createElement('label');
                let b = document.createElement('input');

                function select() {
                    let nonselected = label.getAttribute('style') == 'null';
                    document.getElementsByName(`skill${imgname}`).forEach(radio => radio.parentNode.setAttribute('style', 'null'))
                    if (nonselected)
                        label.setAttribute('style', 'background-color: lime;')
                    Skills.refreshPoints()
                }

                label.setAttribute('class', `lvl type_${chars[t]}`);
                label.setAttribute('value', `${l}${t}`)
                label.setAttribute('style', 'null');

                b.setAttribute('type', 'radio');
                b.setAttribute('value', 'abc');
                b.setAttribute('name', `skill${imgname}`);
                b.onclick = select

                b.innerHTML = `${l}${chars[t]}`;

                label.innerText = `${l}${chars[t]}`;
                label.appendChild(b);
                line.appendChild(label);
            }
            div.appendChild(line);
        }

        div.setAttribute('class', 'skill');
        img.setAttribute('src', `icons/skills/${imgname}.png`);
        img.setAttribute('alt', imgname);
        img.setAttribute('class', 'imgSpell');

        return div;
    }

    static refreshPoints() {
        function refactor(lvl, n, buff = 0) {
            if (lvl <= 0)
                return n <= 0 ? buff : refactor(7, n - 1, buff * 14)
            return refactor(lvl - 1, n, buff + lvl)
        }

        let inp = document.getElementById('inpskillpoints')
        let mx = parseInt(inp.value)
        try {
            Build.setPoints(parseInt(inp.value)) /// Metoda potrzebna w build.js
        } catch {}
        mx = Array.from(Array(mx + 1).keys()).reduce((partialSum, a) => partialSum + a, 0) - 1
        let used = 0;

        Array.from(document.getElementsByClassName('lvl')).forEach(label => {
            if (label.getAttribute('style') != 'null') {
                let lvl = parseInt(label.getAttribute('value')[0])
                let t = parseInt(label.getAttribute('value')[1])

                used += refactor(lvl, t);
            }
        });

        let pktu = mx - used;
        let pktm = parseInt(pktu / 14 / 14);
        pktu %= 14 * 14
        let pkta = parseInt(pktu / 14);
        pktu %= 14;

        document.getElementById('skillpoints').innerHTML = `
            <span class="type_u">${pktu}</span>
            <span class="type_a">${pkta}</span>
            <span class="type_m">${pktm}</span>
        `;

    }

    static makeSkills(clazz) {
        let body = document.getElementById('skillstree');

        let div1 = document.createElement('div');
        let div2 = document.createElement('div');


        div1.setAttribute('id', 'skillstree1')
        div2.setAttribute('id', 'skillstree2')

        div2.style.setProperty('display', 'none')

        body.innerHTML = '';
        body.appendChild(div1);
        body.appendChild(div2);

        for (let i = 1; i <= 9; i++)
            div1.appendChild(Skills.makeSkill(clazz + i))
        div2.appendChild(Skills.makeSkill('wataha', 14))
        for (let i = 1; i <= 5; i++)
            div2.appendChild(Skills.makeSkill('s' + i))

        Skills.refreshPoints();
    }

    static makeProfs() {
        let body = document.getElementById('profs');

        function makeProf(prof) {
            let b = document.createElement('button');
            let img = document.createElement('img');

            img.setAttribute('src', 'icons/skills/' + prof + '.png');
            img.setAttribute('alt', prof);

            b.onclick = () => Skills.makeSkills(prof);

            b.appendChild(img);
            body.appendChild(b);
        }

        Skills.allProfs.forEach(makeProf);
    }

    static scroll(div1, div2) {
        div1 = document.getElementById('skillstree' + div1)
        div2 = document.getElementById('skillstree' + div2)

        div1.style.setProperty('display', 'block')
        div2.style.setProperty('display', 'none')
    }

    /**
     * ustawia wybrany lvl na danym skillu
     * @param {String} skillname 
     * @param {Number} lvl 
     */
    static setLvL(skillname, lvl) {
        for (let skill of document.getElementsByClassName('skill'))
            if (skill.getAttribute('value') == skillname) {
                let s = `${(lvl - 1) % 7 + 1}${parseInt((lvl - 1) / 7)}`
                for (let lv of skill.getElementsByClassName('lvl')) {
                    if (lvl == 0) {
                        if (lv.getAttribute('style') != 'null') {
                            lv.children[0].onclick()
                            return
                        }
                    } else if (lv.getAttribute('value') == s) {
                        if (lv.getAttribute('style') == 'null')
                            lv.children[0].onclick()
                        return
                    }
                }
            }
    }

    /**
     * zwraca aktualny poziom dla danego skilla
     * @param {String} skill 
     * @returns {Number}
     */
    static getLvL(skillname) {
        for (let skill of document.getElementsByClassName('skill'))
            if (skill.getAttribute('value') == skillname) {
                for (let lvl of skill.getElementsByClassName('lvl')) {
                    if (lvl.getAttribute('style') != 'null') {
                        let lv = parseInt(lvl.getAttribute('value')[0])
                        let t = parseInt(lvl.getAttribute('value')[1])

                        return lv + t * 7
                    }
                }
                return 0
            }
        return 0
    }

    /**
     * @returns {String} aktualnie wybrana profesja
     */
    static getProf() {
        return document.getElementsByClassName('skill')[0].getAttribute('value').substring(0, 2)
    }
}

Skills.init()