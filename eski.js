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
    static _tables = {}
    static _states = {}
    static reset() {
        EskiTable._tables = {}
    }
    static _addTable(cat, table) {
        if (!Object.keys(EskiTable._tables).includes(cat))
            EskiTable._tables[cat] = []
        EskiTable._tables[cat].push(table)
    }

    static switch(category) {
        let off = EskiTable._tables[category][0].table.style.getPropertyValue('display') == 'none'
        EskiTable.display(category, off)
    }
    static display(category, show=false) {
        EskiTable._states[category] = show
        for (let table of EskiTable._tables[category])
            table.table.style.setProperty('display', show ? 'block' : 'none')
    }

    constructor(category, title) {
        this.category = category
        this.headers = [[]]
        this.title = title
        this.table = null
        this.rows = []
        this.cols = 0

        EskiTable._addTable(category, this)
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
    build(compress=true) {
        if (compress)
            this.removeBadCols()

        let html = '<thead>'
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

        this.table = document.createElement('table')
        this.table.style.setProperty('display', EskiTable._states[this.category] === false ? 'none' : 'block')
        this.table.innerHTML = html

        return this.table
    }
}

class Eski {
    constructor() {
        this.div = document.getElementById('eski')
        this.labels = this.div.children[0].children
        this.canvas = this.div.children[2]

        for (let label of this.labels)
            label.children[0].onchange = () => this.calculate()
        for (let label of this.div.children[1].children)
            label.onclick = label => EskiTable.switch(label.target.getAttribute('value'))

        this.calculate()
    }

    calculate() {
        let eska = parseFloat(this.labels[0].children[0].value)
        let odlm = parseFloat(this.labels[1].children[0].value)
        let pl = parseFloat(this.labels[2].children[0].value)
        let podatek = this.labels[3].children[0].checked
        console.log(podatek)

        EskiTable.reset()

        let html = ''
        this.canvas.innerHTML = html


        // eski kolor gwiazdek -> 5 ^ kolor(0-3) * kat(1-4) 
        let ileE = [2, 5, 12, 24, 32, 40, 55, 70, 85, 115, 145, 175] // Eski
        let ileD = [5, 10, 20, 40] // Driffy
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
        let display = (x, good) => `<span class='${good === undefined ? '' : good ? 'good' : 'bad'}'>${notation(podatek ? x * .98 : x)}</span>`
        


        // Przetapianie
        let przetapianie = [0, 0]
        let tablePrzetapianie = new EskiTable('melting', 'Przetapianie (Zysk)')
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
        this.canvas.appendChild(tablePrzetapianie.build())

        let tablePrzetapianieDriffy = new EskiTable('melting', 'Przetapianie driffy')
        tablePrzetapianieDriffy.addHeader('Ranga', 0)
        tablePrzetapianieDriffy.addHeader('bez inhb', 1)
        tablePrzetapianieDriffy.addHeader('z inhb', 2)
        for (let i = 0; i <= 9; i += 3) {
            let ct = ileD[i / 3]
            let ih = inh[i]

            let c1 = ct * eska - 20
            let c2 = Math.ceil(ct * 1.3) * eska - 20 - ih * pl

            tablePrzetapianieDriffy.addRow(`<span class='lp'>${['sub', 'bid', 'magni', 'arcy'][i/3]}</span>`,
                                     `<span class='c1'>${display(c1, c1 >= c2)}</span>`,
                                     `<span class='c2'>${display(c2, c2 >  c1)}</span>`)
        }
        this.canvas.appendChild(tablePrzetapianieDriffy.build())
        

        // Ładowanie
        let tableLadowanie = new EskiTable('charging', 'Ładowanie (koszt 10%)')
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
        this.canvas.appendChild(tableLadowanie.build())

        // Rozbijanie Rary
        let tableRRary = new EskiTable('crushR', 'Rozbijanie Rary')
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
        this.canvas.appendChild(tableRRary.build())
        

        // Rozbijanie Sety
        let tableRSety = new EskiTable('crushS', 'Rozbijanie Sety')
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
        this.canvas.appendChild(tableRSety.build())

        // Flaszki Gorzałki
        let tableGorzo = new EskiTable('other', 'Gorzałki')
        tableGorzo.addHeader("Rejon", 0)
        tableGorzo.addHeader("cena 1szt", 1)
        tableGorzo.addRow('Garni', display(Math.round((eska + 55) / 3 * 10) / 10, false))
        tableGorzo.addRow('Łowca', display(Math.round((eska + 50) / 3 * 10) / 10, true))
        this.canvas.appendChild(tableGorzo.build())

        // Zwoje
        let tableZwoje = new EskiTable('other', 'Zwoje')
        tableZwoje.addHeader('Rodzaj', 0)
        tableZwoje.addHeader('wartość', 1)
        tableZwoje.addRow('tp gildia', display(pl / 5, true))
        tableZwoje.addRow('tp premium', display(3*pl / 10, false))
        tableZwoje.addRow('tp trentis', display(pl, true))
        this.canvas.appendChild(tableZwoje.build())

        // Imperiały
        let tableImperialy = new EskiTable('other', 'Imperiały')
        tableImperialy.addRow('szt', display(pl / 5, true))
        this.canvas.appendChild(tableImperialy.build())

    }
}

const ESKI = new Eski()
