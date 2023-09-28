class Procenty {
    static divs = {
        atak: {
            lvl: document.getElementById('procentyInpLvLA'),
            stats: document.getElementById('procentyInpStatsA'),
            mod: document.getElementById('procentyInpModA'),
            spell: document.getElementById('procentyInpSpellA')
        },
        obrona: {
            lvl: document.getElementById('procentyInpLvLO'),
            stats: document.getElementById('procentyInpStatsO'),
            mod: document.getElementById('procentyInpModO'),
        },
        out: document.getElementById('procentyOut'),
    }
    static init() {
        for (let inp of Object.values(Procenty.divs.atak))
            inp.onchange = Procenty.calc
        for (let inp of Object.values(Procenty.divs.obrona))
            inp.onchange = Procenty.calc

        Procenty.calc()
    }

    static calc() {
        let Alvl = parseInt(Procenty.divs.atak.lvl.value)
        let Astats = parseInt(Procenty.divs.atak.stats.value)
        let Amod = parseFloat(Procenty.divs.atak.mod.value) / 100
        let Aspell = parseFloat(Procenty.divs.atak.spell.value) / 100
        let Olvl = parseInt(Procenty.divs.obrona.lvl.value)
        let Ostats = parseInt(Procenty.divs.obrona.stats.value)
        let Omod = parseFloat(Procenty.divs.obrona.mod.value) / 100

        let A = []
        let O = []
        for (let pa=1; pa <= 5; pa++)
            A.push(Procenty.calcPercent(Alvl, Astats, pa, Amod, Aspell))
        for (let pa=0; pa <= 5; pa++)
            O.push(Procenty.calcPercent(Olvl, Ostats, pa, Omod))

        Procenty._show(A, O)
    }
    static _show(A, O) {
        let html = ''

        let row = 1
        for (let a of A) {
            html += `<tr><td>${row++}pa</td>`
            for (let o of O)
                html += `<td>${Math.floor(a / (a+o) * 1000) / 10}%</td>`
            html += '</tr>'
        }
        
        Procenty.divs.out.innerHTML = html
    }

    /**
     * 
     * @param {Number} lvl 1-140 
     * @param {Number} stats wiedza zręka
     * @param {Number} pa 1-5 
     * @param {Number} mod trafienia, obrona, dbf 
     * @param {Number} spell wartość trafień umiejętności | tylko dla ataku
     * @returns 
     */
    static calcPercent(lvl, stats, pa, mod=1, spell=1) {
        return (40 + stats + lvl) * pa * mod * spell
    }
}

Procenty.init()