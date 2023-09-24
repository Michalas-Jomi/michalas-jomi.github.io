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

class EskiTable {
    constructor(title) {
        this.title = title
        this.headers = [[]]
        this.rows = []
        this.cols = 0
    }

    newHeadersRow() {
        this.headers.push([])
    }
    addHeader(th, ...forCols) {
        for (let col of forCols)
            this.headers[this.headers.length-1][col] = th
    }
    addRow(title, ...items) {
        this.rows.push([title, ...items])
        this.cols = Math.max(this.cols, items.length + 1)
    }

    removeBadCols() {
        for (let col=this.cols-1; col > 0; col--)
            if (this.isBadCol(col)) {
                for (let row of this.rows)
                    row.splice(col, 1)
                for (let header of this.headers)
                    header.splice(col, 1)
            }
    }
    isBadCol(col) {
        for (let row of this.rows)
            if (row[col].includes('good'))
                return false
        return true
    }

    calcSpan(header, start) {
        for (let i=start + 1; i < header.length; i++)
            if (header[i] !== header[start])
                return i - start
        return header.length - start
    }
    build() {
        this.removeBadCols()

        let html = '<table>'

        html += '<thead>'
        html += `<tr><th colspan=${this.cols}>${this.title}</th></tr>`
        for (let row of this.headers) {
            html += '<tr>'
            let skip = 0
            for (let i=0; i < row.length; i++) {
                if (--skip > 0)
                    continue
                skip = this.calcSpan(row, i)
                html += `<th colspan=${skip}>${row[i] === undefined ? '' : row[i]}</th>`
            }
            html += '</tr>'
        }
        html += '</thead>'

        html += '<tbody>'
        for (let row of this.rows) {
            html += '<tr>'
            for (let i = 0; i < row.length; i++)
                html += `<td ${i > 0 ? '' : 'style="text-align: center;"'}>${row[i]}</td>`
            html += '</tr>'
        }
        html += '</tbody>'

        html += '</table>'

        return html
    }
}

class Eski {
    constructor() {
        this.div = document.getElementById('eski')
        this.labels = this.div.children[0].children
        this.canvas = this.div.children[1]

        for (let label of this.labels)
            label.children[0].onchange = () => this.calculate()

        this.calculate()
    }

    calculate() {
        let eska = parseFloat(this.labels[0].children[0].value)
        let odlm = parseFloat(this.labels[1].children[0].value)
        let pl = parseFloat(this.labels[2].children[0].value)

        let html = ''


        // eski kolor gwiazdek -> 5 ^ kolor(0-3) * kat(1-4) 
        let ileE = [2, 5, 12, 24, 32, 40, 55, 70, 85, 115, 145, 175] // Eski
        let ileOR = [
                [3, 5, 8, 12, 20, 30, 50, 100, 250],
                [15, 25, 40, 60, 100, 150, 250, 500, 1250],
                [75, 100, 200, 300, 500, 750, 1250, 2500, 6500],
                [300, 500, 1000, 1500, 2500, 4000, 6500, 12500, 30000],
            ] // Odłamki rary
        let ileOS = [
                [5, 8, 12, 18, 30, 45, 75, 150, 375],
                [25, 30, 50, 100, 150, 250, 400, 750, 2000],
                [90, 120, 250, 450, 750, 1100, 2000, 4000, 9000],
            ] // Odłamki sety
        let inh = [3, 4, 4, 5, 6, 6, 7, 8, 8, 10, 12, 12]

        let notation = x => {
            x = Math.round(x * 10) / 10
            let le = x.toString().length
            if (le < 4)
                return x.toString() + 'k'
            if (le <= 5 && x.toString().indexOf('.') != -1)
                return x.toString() + 'k'

            return notation(x / 1000) + 'k'
        }
        let display = (x, good) => `<span class='${good === undefined ? '' : good ? 'good' : 'bad'}'>${notation(x)}</span>`
        


        // Przetapianie
        let przetapianie = [0, 0]
        let tablePrzetapianie = new EskiTable('Przetapianie (Zysk)')
        tablePrzetapianie.addHeader('Ranga', 0)
        tablePrzetapianie.addHeader('bez inhb', 1)
        tablePrzetapianie.addHeader('z inhb', 2)
        for (let lp = 2; lp < 13; lp++) {
            let ct = ileE[lp - 1]
            let ih = inh[lp - 1]

            let c1 = ct * eska - 20
            let c2 = Math.ceil(ct * 1.3) * eska - 20 - ih * pl

            przetapianie.push(Math.max(c1, c2))

            tablePrzetapianie.addRow(`<span class='lp'>${romanize(lp)}</span>`,
                                     `<span class='c1'>${display(c1, c1 >= c2)}</span>`,
                                     `<span class='c2'>${display(c2, c2 >  c1)}</span>`)
        }
        html += tablePrzetapianie.build()
        

        // Ładowanie
        let tableLadowanie = new EskiTable('Ładowanie (koszt 10%)')
        tableLadowanie.addHeader('Ranga', 0)
        tableLadowanie.addHeader('bez inhb', 1)
        tableLadowanie.addHeader('z inhb', 2)
        for (let i = 1; i < 12; i++) {
            let bez = 20 + Math.max(1, i) * eska
            let z = bez + inh[i] * pl

            let c1 = Math.round(bez*5 / 3) / 10
            let c2 = Math.round(z) / 10
            tableLadowanie.addRow(romanize(i+1),
                                display(c1, c1 <= c2),
                                display(c2, c2 <  c1))
        }
        html += tableLadowanie.build()


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
        let tableRRary = new EskiTable('Rozbijanie Rary')
        tableRRary.addHeader('II - III', 1, 2)
        tableRRary.addHeader('IV - VI', 3, 4)
        tableRRary.addHeader('VII - IX', 5, 6)
        tableRRary.addHeader('X - XII', 7, 8)
        tableRRary.newHeadersRow()
        tableRRary.addHeader('bez', 1, 3, 5, 7)
        tableRRary.addHeader('z inhb', 2, 4, 6, 8)
        for (let gw = 0; gw < 9; gw++) {
            let items = []
            for (let i = 0; i < 4; i++) {
                let x = ileOR[i][gw]
                let base = -Math.pow(5, parseInt(gw / 3)) * (i + 1) - 20
                let c1 = x * odlm + base
                let c2 = Math.ceil(x * 1.3) * odlm + base - pl*inh[[2, 5, 8, 11][i]]
                items.push(display(c1, c1 >= c2 && c1 >= przetapianie[[2, 4, 7, 10][i]]))
                items.push(display(c2, c2 >  c1 && c2 >= przetapianie[[2, 4, 7, 10][i]]))
            }
            tableRRary.addRow(`<img src="icons/gw${parseInt(gw / 3) + 1}.png">`.repeat(gw % 3 + 1), ...items)
        }
        html += tableRRary.build()
        

        // Rozbijanie Sety
        let tableRSety = new EskiTable('Rozbijanie Sety')
        tableRSety.addHeader('II - III', 1, 2)
        tableRSety.addHeader('IV - V', 3, 4)
        tableRSety.addHeader('IX', 5, 6)
        tableRSety.newHeadersRow()
        tableRSety.addHeader('bez', 1, 3, 5)
        tableRSety.addHeader('z inhb', 2, 4, 6)
        for (let gw = 0; gw < 9; gw++) {
            let items = []
            for (let i = 0; i < 3; i++) {
                let x = ileOS[i][gw]
                let base = -Math.pow(5, parseInt(gw / 3)) * (i + 1) - 20
                let c1 = x * odlm + base
                let c2 = Math.ceil(x * 1.3) * odlm + base - pl*inh[[2, 5, 8, 11][i]]
                items.push(display(c1, c1 >= c2 && c1 >= przetapianie[[2, 4, 9][i]]))
                items.push(display(c2, c2 >  c1 && c2 >= przetapianie[[2, 4, 9][i]]))
            }
            tableRSety.addRow(`<img src="icons/gw${parseInt(gw / 3) + 1}.png">`.repeat(gw % 3 + 1), ...items)
        }
        html += tableRSety.build()


        // center
        html = `<center>${html}</center><div style='clear: both;'></div>`


        this.canvas.innerHTML = html
    }
}

const ESKI = new Eski()
