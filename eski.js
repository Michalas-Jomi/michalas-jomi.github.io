function romanize(num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
            "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
            "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"
        ],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}

let div = document.getElementById('eski')
let labels = div.children[0].children
let canvas = div.children[1]

function calculate() {
    let eska = parseFloat(labels[0].children[0].value)
    let odlm = parseFloat(labels[1].children[0].value)
    let pl = parseFloat(labels[2].children[0].value)
    let ranga = parseInt(labels[3].children[0].value)

    let c1, c2

    let html = ''


    // eski kolor gwiazdek -> 5 ^ kolor(0-3) * kat(1-4) 
    let ileE = [2, 5, 12, 24, 32, 40, 55, 70, 85, 115, 145, 175] // Eski
    let ileOR = [
            [3, 5, 8, 12, 20, 30, 50, 100, 250],
            [15, 25, 40, 60, 100, 150, 250, 500, 1250],
            [75, 125, 200, 300, 500, 750, 1250, 2500, 6500],
            [350, 650, 1000, 1500, 2500, 4000, 6500, 12500, 30000],
        ] // Odłamki rary
    let ileOS = [
            [5, 8, 12, 18, 30, 45, 75, 150, 375],
            [25, 40, 60, 100, 150, 250, 400, 750, 2000],
            [125, 200, 300, 450, 750, 1100, 2000, 4000, 10000],
        ] // Odłamki sety
    let inh = [3, 4, 4, 5, 6, 6, 7, 8, 8, 10, 12, 12]

    let display = x => {
        x = Math.round(x * 10) / 10
        let le = x.toString().length
        if (le < 4)
            return x.toString() + 'k'
        if (le <= 5 && x.toString().indexOf('.') != -1)
            return x.toString() + 'k'

        return display(x / 1000) + 'k'
    }

    // Przetapianie
    if (ranga == 0) {
        for (lp = 1; lp < 13; lp++) {
            ct = ileE[lp - 1]
            ih = inh[lp - 1]

            c1 = ct * eska - 20
            c2 = Math.ceil(ct * 1.3) * eska - 20 - ih * pl

            html += `<tr>
            <td><span class='lp'>${romanize(lp)}</span></td>
            <td><span class='c1'>${display(c1)}</span></td>
            <td><span class='c2'>${display(c2)}</span></td>
            </tr>`
        }
    } else {
        ileE = ileE[ranga - 1]
        inh = inh[ranga - 1]

        c1 = Math.round((eska + 20) / ile, 2)
        c2 = Math.round((eska + 20 + inh * pl) / Math.ceil(ile * 1.3), 2)

        html += `<tr>
        <td><span class='lp'>${romanize(ranga)}</span></td>
        <td><span class='c1'>${display(c1)}</span></td>
        <td><span class='c2'>${display(c2)}</span></td>
        </tr>`
    }

    html = `<table>
    <thead>
        <tr>
            <th colspan=3>Przetapianie (Zysk)</th>
        </tr>
        <tr>
            <th>Ranga</th>
            <th>bez inhb</th>
            <th>z inhb</th>
        </tr>
    </thead>
    <tbody>${html}</tbody>
    </table>`

    html += '</tbody></table>'

    // Ładowanie
    html += `
    <table style="margin-left: 10px;">
        <thead>
            <tr>
                <th colspan="3">Ładowanie (koszt 10%)</th>
            </tr>
            <tr>
                <th>Ranga</th>
                <th>bez inhb</th>
                <th>z inhb</th>
            </tr>
        </thead>
        <tbody>`

    for (let i = 0; i < 12; i++) {
        let bez = 20 + Math.max(1, i) * eska
        let z = bez + inh[i] * pl

        html += `
        <tr>
            <td>${romanize(i+1)}</td>
            <td>${display(Math.round(bez*5 / 3) / 10)}</td>
            <td>${display(Math.round(z) / 10)}</td>
        </tr>`
    }

    html += '</tbody></table>'


    // Flaszki Gorzałki
    html += `<table style='margin-left: 10px;'>
    <thead>
        <tr>
            <th colspan=2>Gorzałki</th>
        </tr>
        <tr>
            <th>Rejon</th>
            <th>cena 1szt</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Garni</td>
            <td>${display(Math.round((eska + 55) / 3 * 10) / 10)}</td>
        </tr>
        <tr>
            <td>Łowca</td>
            <td>${display(Math.round((eska + 50) / 3 * 10) / 10)}</td>
        </tr>
    </tbody>
    </table>`


    // Rozbijanie Rary
    html += `<table><thead>
        <tr>
            <th colspan=9>Rozbijanie Rary</th>
        </tr>
        <tr>
            <th></th>
            <th colspan=2 class="eskitd2">II - III</th>
            <th colspan=2>IV - VI</th>
            <th colspan=2 class="eskitd2">VII - IX</th>
            <th colspan=2>X - XII</th>
        </tr>
        <tr>
            <th></th>
            <th class="eskitd2">bez</th> <th class="eskitd2">z inhb</th>
            <th>bez</th> <th>z inhb</th>
            <th class="eskitd2">bez</th> <th class="eskitd2">z inhb</th>
            <th>bez</th> <th>z inhb</th>
        </tr>
    </thead><tbody>`

    for (let gw = 0; gw < 9; gw++) {
        html += `<tr><td>${gw}</td>`
        for (let i = 0; i < 4; i++) {
            let x = ileOR[i][gw]
            let base = -Math.pow(5, parseInt(gw / 3)) * (i + 1) - 20
            html += `<td ${i % 2 == 1 ? '' : 'class="eskitd2"'}>${display(x * odlm + base)}</td>
                     <td ${i % 2 == 1 ? '' : 'class="eskitd2"'}>${display(Math.ceil(x * 1.3) * odlm + base - pl*inh[[2, 5, 8, 11][i]])}</td>`
        }
        html += '</tr>'
    }
    html += '</tbody></table>'

    // Rozbijanie Sety
    html += `<table><thead>
        <tr>
            <th colspan=9>Rozbijanie Sety</th>
        </tr>
        <tr>
            <th></th>
            <th colspan=2 class="eskitd2">II - III</th>
            <th colspan=2>IV - V</th>
            <th colspan=2 class="eskitd2">IX</th>
        </tr>
        <tr>
            <th></th>
            <th class="eskitd2">bez</th> <th class="eskitd2">z inhb</th>
            <th>bez</th> <th>z inhb</th>
            <th class="eskitd2">bez</th> <th class="eskitd2">z inhb</th>
        </tr>
    </thead><tbody>`

    for (let gw = 0; gw < 9; gw++) {
        html += `<tr><td>${gw+1}*</td>`
        for (let i = 0; i < 3; i++) {
            let x = ileOS[i][gw]
            let base = -Math.pow(5, parseInt(gw / 3)) * (i + 1) - 20
            html += `<td ${i % 2 == 1 ? '' : 'class="eskitd2"'}>${display(x * odlm + base)}</td>
                     <td ${i % 2 == 1 ? '' : 'class="eskitd2"'}>${display(Math.ceil(x * 1.3) * odlm + base - pl*inh[[2, 5, 8, 11][i]])}</td>`
        }
        html += '</tr>'
    }
    html += '</tbody></table>'


    // center
    html = `<center>${html}</center><div style='clear: both;'></div>`


    canvas.innerHTML = html

}

for (label of labels) {
    label.onchange = calculate;
}

calculate()