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
    let cena = parseFloat(labels[0].children[0].value)
    let pl = parseInt(labels[1].children[0].value)
    let ranga = parseInt(labels[2].children[0].value)

    let c1, c2

    let html = ''


    let ile = [2, 5, 12, 24, 32, 40, 55, 70, 85, 115, 145, 175]
    let inh = [3, 4, 4, 5, 6, 6, 7, 8, 8, 10, 12, 12]
    if (ranga == 0) {
        for (lp = 1; lp < 13; lp++) {
            ct = ile[lp - 1]
            ih = inh[lp - 1]

            c1 = ct * cena - 20
            c2 = Math.ceil(ct * 1.3) * cena - 20 - ih * pl

            html += `<tr>
            <td><span class='lp'>${romanize(lp)}</span></td>
            <td><span class='c1'>${c1}k</span></td>
            <td><span class='c2'>${c2}k</span></td>
            </tr>`
        }
    } else {
        ile = ile[ranga - 1]
        inh = inh[ranga - 1]

        c1 = Math.round((cena + 20) / ile, 2)
        c2 = Math.round((cena + 20 + inh * pl) / Math.ceil(ile * 1.3), 2)

        html += `<tr>
        <td><span class='lp'>${romanize(ranga)}</span></td>
        <td><span class='c1'>${c1}k</span></td>
        <td><span class='c2'>${c2}k</span></td>
        </tr>`
    }

    // przetapianie
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
        let bez = 20 + Math.max(1, i) * cena
        let z = bez + inh[i] * pl

        html += `
        <tr>
            <td>${romanize(i+1)}</td>
            <td>${Math.round(bez*5 / 3) / 10}k</td>
            <td>${Math.round(z) / 10}k</td>
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
            <td>${Math.round((cena + 55) / 3 * 10) / 10}k</td>
        </tr>
        <tr>
            <td>Łowca</td>
            <td>${Math.round((cena + 50) / 3 * 10) / 10}k</td>
        </tr>
    </tbody>
    </table>`

    html = `<center>${html}</center><div style='clear: both;'></div>`


    canvas.innerHTML = html

}

for (label of labels) {
    label.onchange = calculate;
}

calculate()