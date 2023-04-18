function makeSkill(imgname, lvls = 21) {
    let div = document.createElement('div');
    let img = document.createElement('img');

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
                refreshPoints()
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
    img.setAttribute('src', `icons/${imgname}.png`);
    img.setAttribute('alt', imgname);
    img.setAttribute('class', 'imgSpell');



    return div;
}

function refreshPoints() {
    function refactor(lvl, n, buff = 0) {
        if (lvl <= 0)
            return n <= 0 ? buff : refactor(7, n - 1, buff * 14)
        return refactor(lvl - 1, n, buff + lvl)
    }

    let mx = parseInt(document.getElementById('inpskillpoints').value)
    mx = Array.from(Array(mx + 1).keys()).reduce((partialSum, a) => partialSum + a, 0) - 1
    let used = 0;

    Array.from(document.getElementsByClassName('lvl')).forEach(label => {
        if (label.getAttribute('style') != 'null') {
            lvl = parseInt(label.getAttribute('value')[0])
            t = parseInt(label.getAttribute('value')[1])

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

function makeSkills(clazz) {
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
        div1.appendChild(makeSkill(clazz + i))
    div2.appendChild(makeSkill('wataha', 14))
    for (let i = 1; i <= 5; i++)
        div2.appendChild(makeSkill('s' + i))

    refreshPoints();
}

function makeProfs() {
    let body = document.getElementById('profs');

    function makeProf(prof) {
        b = document.createElement('button');
        img = document.createElement('img');

        img.setAttribute('src', 'icons/' + prof + '.png');
        img.setAttribute('alt', prof);

        b.onclick = () => makeSkills(prof);

        b.appendChild(img);
        body.appendChild(b);
    }

    ['dr', 'mo', 'vd', 'sh', 'rc', 'br', 'uk'].forEach(makeProf);
}

function scroll(div1, div2) {
    div1 = document.getElementById('skillstree' + div1)
    div2 = document.getElementById('skillstree' + div2)

    div1.style.setProperty('display', 'block')
    div2.style.setProperty('display', 'none')
}

document.getElementById('inpskillpoints').onchange = refreshPoints;
document.getElementById('skilltreescrollb1').onclick = () => scroll(1, 2);
document.getElementById('skilltreescrollb2').onclick = () => scroll(2, 1);

makeSkills('dr');
makeProfs();

refreshPoints()